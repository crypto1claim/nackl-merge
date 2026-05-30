// ============================================================
// Acki Merge — игровой движок.
// Поддержка тем через подписку на CSS-переменные через getComputedStyle.
// ============================================================

import Matter from 'matter-js';
import { addTap } from './beeEngine';
import { FRUITS, randomSpawnLevel, type FruitDef } from './fruits';
import { tg } from './telegram';
import { getSprite, preloadSprites } from './sprites';
import { getTheme } from './themes';
import { Settings } from './settings';
import { Sound } from './sound';
import { ParticleSystem } from './particles';

const W = 360;
const H = 600;

const WALL_THICKNESS = 60;
const WALL_PADDING = 8;
// Верхняя линия, по которой выравниваются прицельные монеты любого размера.
// Совпадает с верхом горлышка банки (neckTop = DANGER_LINE_Y - 16 = 54),
// чтобы верхушка любой монеты не вылезала выше горла — даже для крупных.
// Центр спавна = AIM_TOP_LINE + radius, мелкие монеты сидят в горлышке выше,
// большие — глубже, но все верхушки на одной линии.
const AIM_TOP_LINE = 54;
const SPAWN_Y = 50;
const SPAWN_DROP_DELAY = 400;
const DANGER_LINE_Y = SPAWN_Y + 20;
const GAME_OVER_GRACE_MS = 1500;
const RESTING_SPEED_THRESHOLD = 0.5;

const CAT_FRUIT = 0x0001;
const CAT_WALL  = 0x0002;

// Комбо: если за это окно произошёл ещё один merge — счётчик увеличивается
const COMBO_WINDOW_MS = 1800;

/** Максимум использований Shake Damage за одну партию */
const SHAKE_DAMAGE_MAX_USES = 3;

interface FruitData {
  level: number;
  merged: boolean;
  dangerSince: number | null;
  spawnAnim: number;
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onGameOver: (score: number) => void;
  onSpritesReady?: () => void;
  onNextLevelChange?: (level: number) => void;
  onCombo?: (count: number) => void;
  /**
   * Состояние Shake Damage.
   * charge: 0..100 — прогресс шкалы (накапливается из крупных комбо).
   * ready: сколько готовых зарядов на руках (от 0 до maxUses - used).
   * used: сколько потрачено за эту партию (0..maxUses).
   * maxUses: максимум за партию (константа = 3).
   */
  onBombStateChange?: (state: { charge: number; ready: number; used: number; maxUses: number }) => void;
  /** Вызывается в момент детонации Shake Damage — для UI-вспышки */
  onShakeDamageDetonated?: () => void;
}

// Тактильный хелпер — Telegram HapticFeedback или browser fallback.
// Telegram API на iOS требует версию >= 6.1, на старых Android может отсутствовать.
// Поэтому пробуем оба пути.
function haptic(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
  if (!Settings.vibration) return;
  try {
    // 1. Telegram WebApp HapticFeedback (приоритет)
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred(style);
      return;
    }
  } catch { /* ignore */ }
  try {
    // 2. Fallback: стандартный Vibration API (Android Chrome/Firefox)
    if ('vibrate' in navigator) {
      // Длительность по стилю
      const duration =
        style === 'heavy'  ? 30 :
        style === 'medium' ? 15 :
        style === 'rigid'  ? 25 :
        style === 'soft'   ? 8  :
        10; // light
      navigator.vibrate(duration);
    }
  } catch { /* ignore */ }
}

function hapticError() {
  if (!Settings.vibration) return;
  try {
    if (tg?.HapticFeedback?.notificationOccurred) {
      tg.HapticFeedback.notificationOccurred('error');
      return;
    }
  } catch { /* */ }
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]); // паттерн ошибки
    }
  } catch { /* */ }
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;
  private cb: GameCallbacks;

  private engine!: Matter.Engine;
  private world!: Matter.World;

  private aiming: { x: number; level: number; def: FruitDef } | null = null;
  private nextSpawnAt: number = 0;
  private pointerX: number | null = null;

  private score = 0;
  private gameOver = false;
  private paused = false;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private spritesReady = false;
  // Масштаб логических координат → backing store (с учётом capped DPR)
  private scaleX = 1;
  private scaleY = 1;
  // Оффскрин-слой со статикой (фон + декор + банка). Перерисовывается только
  // при ресайзе/смене темы, а не каждый кадр — это убирает основную нагрузку.
  private bgCanvas: HTMLCanvasElement | null = null;
  private bgCtx: CanvasRenderingContext2D | null = null;
  private bgDirty = true;
  private bgThemeId = '';
  // Idle-оптимизация: когда сцена статична (монеты лежат, нет эффектов),
  // пропускаем физику и перерисовку — экономит батарею.
  private needsRender = true;
  // Эффекты
  private particles = new ParticleSystem();
  private cameraShake = 0;
  private cameraShakeStrength = 0;
  // Превью следующей монеты — заранее сгенерированный уровень
  private nextLevel: number = randomSpawnLevel();
  // Комбо: если merge происходит в течение COMBO_WINDOW после прошлого — счётчик растёт
  private comboCount = 0;
  private comboExpiresAt = 0;
  /** Прогресс зарядки 0..100 (накапливается с крупных комбо) */
  private bombCharge = 0;
  /** Сколько Shake Damage уже использовано в этой партии */
  private bombUsedThisGame = 0;
  /** Сколько готовых зарядов на руках (накопленные но не потраченные) */
  private bombReadyCharges = 0;
  private lastThudAt = 0;
  private comboPopups: { x: number; y: number; text: string; life: number; color: string }[] = [];

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.canvas = canvas;
    this.cb = cb;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    this.attachPointerHandlers();
    this.initPhysics();

    preloadSprites().then(() => {
      this.spritesReady = true;
      // Спрайты загрузились асинхронно — пересобрать статичный слой,
      // чтобы тематический декор (напр. NACKL в фоне) попал в кэш.
      this.bgDirty = true;
      this.needsRender = true;
      this.cb.onSpritesReady?.();
    });

    this.cb.onScoreChange(this.score);
    // Уведомить UI о начальном состоянии Shake Damage (0%, 0 готовых, 0 потрачено)
    this.emitBombState();
  }

  // Вызывается из App при смене темы — помечаем статичный слой как «грязный»,
  // чтобы фон+банка перерисовались под новую тему на следующем кадре.
  onThemeChange() { this.bgDirty = true; this.needsRender = true; }

  /** Поставить игру на паузу. Физика не считается, ввод заблокирован. */
  pause() {
    if (this.paused || this.gameOver) return;
    this.paused = true;
  }

  /** Снять с паузы. Сбрасываем lastTime, чтобы не было гигантского dt. */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.needsRender = true;
  }

  isPaused() { return this.paused; }

  /** Готова ли бомба к детонации */
  isBombReady() { return this.bombReadyCharges > 0; }

  /** Текущий прогресс шкалы (0..100) */
  getBombCharge() { return this.bombCharge; }

  /** Сколько готовых зарядов на руках */
  getReadyCharges() { return this.bombReadyCharges; }

  /** Сколько уже использовано в этой партии */
  getUsedCharges() { return this.bombUsedThisGame; }

  /** Уведомление UI об актуальном состоянии Shake Damage */
  private emitBombState() {
    this.cb.onBombStateChange?.({
      charge: this.bombCharge,
      ready: this.bombReadyCharges,
      used: this.bombUsedThisGame,
      maxUses: SHAKE_DAMAGE_MAX_USES,
    });
  }

  /**
   * Активирует взрыв бомбы. Доступно если есть готовый заряд.
   * После взрыва — заряд тратится, used++.
   */
  detonateBomb() {
    if (this.bombReadyCharges <= 0 || this.paused || this.gameOver) return;

    // Собираем все монеты-тела на поле. Тело-монета имеет fruitData
    const fruitBodies: Matter.Body[] = [];
    for (const body of Matter.Composite.allBodies(this.world)) {
      const fd = (body as any).fruitData as FruitData | undefined;
      if (fd && !fd.merged) {
        fruitBodies.push(body);
      }
    }

    // Центр взрыва — середина поля (или чуть выше, для эффектности)
    const explosionX = W / 2;
    const explosionY = H / 2;

    // === ФАЗА 1: мгновенно даём всем монетам импульс ОТ центра ===
    // Это создаёт эффект "взрывной волны" — все монеты резко разлетаются
    fruitBodies.forEach((body) => {
      const dx = body.position.x - explosionX;
      const dy = body.position.y - explosionY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Нормализованное направление
      const nx = dx / dist;
      const ny = dy / dist;
      // Сила обратно пропорциональна расстоянию (ближе к центру — сильнее)
      // + случайный разброс для естественности
      const power = (0.025 + Math.random() * 0.015) * (1 + 300 / (dist + 100));
      Matter.Body.applyForce(body, body.position, {
        x: nx * power,
        y: ny * power - 0.008, // лёгкий подброс вверх
      });
      // Случайное вращение
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.6);
    });

    // === ФАЗА 2: волна частиц от центра ===
    // Большой ring-burst в центре поля
    this.particles.ringBurst(explosionX, explosionY, '#ffaa40', 60);
    this.particles.burst(explosionX, explosionY, '#ff5040', 80, 8);
    this.particles.burst(explosionX, explosionY, '#ffd060', 40, 6);

    // === ФАЗА 3: каждая монета взрывается с задержкой по расстоянию ===
    // Чем дальше от центра — тем позже срабатывает (волна расходится)
    let totalReward = 0;
    fruitBodies.forEach((body) => {
      const fd = (body as any).fruitData as FruitData;
      const lvl = fd.level;
      const def = FRUITS[lvl];
      const reward = (lvl + 1) * 8;
      totalReward += reward;

      // Помечаем как merged чтобы коллизии больше не срабатывали
      fd.merged = true;

      // Задержка пропорциональна расстоянию до центра — волна
      const dx = body.position.x - explosionX;
      const dy = body.position.y - explosionY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delay = Math.min(800, dist * 1.8);

      setTimeout(() => {
        if (!this.world) return;
        const x = body.position.x;
        const y = body.position.y;
        // Большой взрыв на месте монеты
        this.particles.burst(x, y, def.glow, 28, 5.5);
        this.particles.ringBurst(x, y, def.colorLight, 22);
        // Удаление монеты
        Matter.Composite.remove(this.world, body);
      }, delay);
    });

    // === ФАЗА 4: эффекты экрана ===
    this.cameraShake = 800;
    this.cameraShakeStrength = 12;
    Sound.fanfare();
    haptic('heavy');

    // Текст бонуса крупно в центре
    if (totalReward > 0) {
      // ВАЖНО: прибавляем к score партии и передаём общую сумму, не дельту.
      // Иначе UI перезаписывает накопленный счёт маленьким бонусом.
      this.score += totalReward;
      this.cb.onScoreChange(this.score);
      this.comboPopups.push({
        x: W / 2, y: H / 2 - 40,
        text: `SHAKE DAMAGE`,
        life: 1.8,
        color: '#ffaa40',
      });
      this.comboPopups.push({
        x: W / 2, y: H / 2 + 10,
        text: `+${totalReward} MRG`,
        life: 1.8,
        color: '#ff5040',
      });
    }

    // Уведомить UI о вспышке экрана
    this.cb.onShakeDamageDetonated?.();

    // Тратим один готовый заряд + увеличиваем счётчик использованных
    this.bombReadyCharges = Math.max(0, this.bombReadyCharges - 1);
    this.bombUsedThisGame += 1;
    this.comboCount = 0;
    this.emitBombState();
  }

  private initPhysics() {
    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
    this.world = this.engine.world;
    this.buildWalls();
    this.attachCollisionEvents();
  }

  private buildWalls() {
    const opts: Matter.IChamferableBodyDefinition = {
      isStatic: true, friction: 0.3, restitution: 0.05,
      collisionFilter: { category: CAT_WALL, mask: CAT_FRUIT },
    };
    Matter.Composite.add(this.world, [
      Matter.Bodies.rectangle(W / 2, H - WALL_PADDING + WALL_THICKNESS / 2, W, WALL_THICKNESS, opts),
      Matter.Bodies.rectangle(WALL_PADDING - WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H, opts),
      Matter.Bodies.rectangle(W - WALL_PADDING + WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H, opts),
    ]);
  }

  private createFruitBody(x: number, y: number, level: number, spawnAnim = 0): Matter.Body {
    const def = FRUITS[level];
    const body = Matter.Bodies.circle(x, y, def.radius, {
      restitution: 0.15, friction: 0.2, frictionAir: 0.005,
      density: 0.001 + level * 0.0002,
      collisionFilter: { category: CAT_FRUIT, mask: CAT_FRUIT | CAT_WALL },
      label: 'fruit',
    });
    (body as any).fruitData = { level, merged: false, dangerSince: null, spawnAnim } as FruitData;
    return body;
  }

  private attachCollisionEvents() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameOver) return;
      for (const pair of event.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const da = (a as any).fruitData as FruitData | undefined;
        const db = (b as any).fruitData as FruitData | undefined;

        // === ЗВУК ПРИЗЕМЛЕНИЯ ===
        // Если хотя бы одна сторона — монета, и она ПРИЗЕМЛИЛАСЬ
        // (скорость по Y была заметной), играем глухой удар.
        // Срабатывает на удары о стену, дно, и о другие монеты.
        // Throttling 40мс — нечастые удары не глушатся.
        // Порог скорости 1.2 — даже мелкие монеты (низкие уровни) звучат.
        const now = performance.now();
        const fruit = da ? a : (db ? b : null);
        if (fruit && (fruit as any).fruitData && !(fruit as any).fruitData.merged) {
          const vy = Math.abs(fruit.velocity.y);
          if (vy > 1.2 && now - this.lastThudAt > 40) {
            this.lastThudAt = now;
            // Громкость зависит от силы удара: тяжёлый удар — громче
            const volume = Math.min(1.0, 0.4 + (vy - 1.2) * 0.15);
            Sound.thud(volume);
          }
        }

        if (!da || !db) continue;
        if (da.merged || db.merged) continue;
        if (da.level !== db.level) continue;
        if (da.level >= FRUITS.length - 1) continue;

        da.merged = true; db.merged = true;

        const mx = (a.position.x + b.position.x) / 2;
        const my = (a.position.y + b.position.y) / 2;
        const nextLevel = da.level + 1;
        const nextDef = FRUITS[nextLevel];

        queueMicrotask(() => {
          if (this.gameOver) return;
          if (!Matter.Composite.allBodies(this.world).includes(a)) return;
          Matter.Composite.remove(this.world, a);
          Matter.Composite.remove(this.world, b);
          const merged = this.createFruitBody(mx, my, nextLevel, 1);
          Matter.Body.setVelocity(merged, { x: 0, y: -2 });
          Matter.Composite.add(this.world, merged);
          addTap(Math.round(mx), Math.round(my));

          // === Комбо-логика ===
          const now = performance.now();
          if (now < this.comboExpiresAt) {
            this.comboCount++;
          } else {
            this.comboCount = 1;
          }
          this.comboExpiresAt = now + COMBO_WINDOW_MS;

          // Бонус: мягкий множитель за комбо. comboCount=2 → x1.5, 3 → x2, 4 → x2.5...
          // Округляем итог до целого MRG.
          const comboMult = this.comboCount > 1 ? 1 + (this.comboCount - 1) * 0.5 : 1;
          const baseScore = nextDef.score;
          const totalScore = Math.max(1, Math.round(baseScore * comboMult));
          this.score += totalScore;
          this.cb.onScoreChange(this.score);

          // Popup: "+30" или "+45 x1.5"
          this.comboPopups.push({
            x: mx, y: my - 30,
            text: comboMult > 1 ? `+${totalScore} ×${this.comboCount}` : `+${baseScore}`,
            life: 1,
            color: comboMult > 1 ? '#ffd84d' : '#ffffff',
          });

          if (comboMult > 1) {
            this.cb.onCombo?.(this.comboCount);
            Sound.combo(this.comboCount);
          }

          // === ЗАРЯД SHAKE DAMAGE === шкала растёт из комбо ×3 и выше.
          // При 100% → +1 готовый заряд, шкала ноль.
          // Лимит партии: SHAKE_DAMAGE_MAX_USES готовых зарядов суммарно
          // (накопленных + потраченных). После 3-х новые не идут.
          //   x2  = 0 (случайные двойки отвергаем)
          //   x3  = 15
          //   x4  = 25
          //   x5  = 40
          //   x6  = 60
          //   x7+ = 80 (cap за один комбо)
          // Порог ×10 — заряд получают только за крупные каскады.
          // Раньше копился слишком легко (с ×3), что обесценивало способность.
          // Теперь нужно реально постараться — 1-2 заряда за хорошую партию.
          const totalChargesEarned = this.bombReadyCharges + this.bombUsedThisGame;
          const canEarnMore = totalChargesEarned < SHAKE_DAMAGE_MAX_USES;
          if (this.comboCount >= 10 && canEarnMore) {
            let chargeGain: number;
            if (this.comboCount === 10) chargeGain = 35;
            else if (this.comboCount === 11) chargeGain = 50;
            else if (this.comboCount === 12) chargeGain = 70;
            else chargeGain = 100; // ×13+ — сразу полный заряд

            this.bombCharge = Math.min(100, this.bombCharge + chargeGain);
            if (this.bombCharge >= 100) {
              // Полностью заряжен → конвертируем в готовый заряд
              this.bombReadyCharges += 1;
              this.bombCharge = 0;
              haptic('heavy');
              // Popup чтобы игрок увидел что получил заряд
              this.comboPopups.push({
                x: W / 2, y: H / 2 - 60,
                text: `⚡ SHAKE DAMAGE READY`,
                life: 2.0,
                color: '#ffd040',
              });
            }
            this.emitBombState();
          }

          // === Эффекты ===
          const particleCount = 8 + nextLevel * 2 + (comboMult - 1) * 4;
          this.particles.burst(mx, my, nextDef.glow, particleCount, 3 + nextLevel * 0.3);
          if (nextLevel >= 5 || comboMult >= 2) {
            this.particles.ringBurst(mx, my, nextDef.colorLight, 12);
          }
          if (nextLevel >= 8) {
            this.cameraShake = 250;
            this.cameraShakeStrength = 4 + (nextLevel - 8) * 2;
          } else if (nextLevel >= 5 || comboMult >= 3) {
            this.cameraShake = 150;
            this.cameraShakeStrength = 2;
          }

          // Звук
          if (nextLevel === FRUITS.length - 1) {
            Sound.nacklUnlocked();
            haptic('heavy');
            // === АВТОДЕТОНАЦИЯ === финальная монета взрывает банку.
            // Через 1.5 сек после слияния — пышный взрыв всех монет на поле.
            // Игроку даётся возможность увидеть свою победу (NACKL появилась),
            // потом банка очищается с большим бонусом, и игра продолжается.
            setTimeout(() => {
              this.detonateFinal();
            }, 1500);
          } else {
            Sound.merge(nextLevel);
            if (nextLevel >= 7)      haptic('heavy');
            else if (nextLevel >= 4) haptic('medium');
            else                     haptic('light');
          }
        });
      }
    });
  }

  /**
   * Финальная детонация — когда собрана последняя монета (NACKL).
   * Идентична Shake Damage, но НЕ требует заряда и сама взрывает поле.
   * После — игра продолжается с пустой банкой и большим бонусом.
   */
  private detonateFinal() {
    if (this.paused || this.gameOver) return;
    const fruitBodies: Matter.Body[] = [];
    for (const body of Matter.Composite.allBodies(this.world)) {
      const fd = (body as any).fruitData as FruitData | undefined;
      if (fd && !fd.merged) fruitBodies.push(body);
    }

    let totalReward = 0;
    fruitBodies.forEach((body, i) => {
      const fd = (body as any).fruitData as FruitData;
      const lvl = fd.level;
      const def = FRUITS[lvl];
      // Большая награда — раз в 2 раза больше Shake Damage
      const reward = (lvl + 1) * 16;
      totalReward += reward;
      fd.merged = true;
      const delay = i * 35;
      setTimeout(() => {
        if (!this.world) return;
        const x = body.position.x;
        const y = body.position.y;
        this.particles.burst(x, y, def.glow, 32, 6);
        this.particles.ringBurst(x, y, def.colorLight, 24);
        Matter.Composite.remove(this.world, body);
      }, delay);
    });

    this.cameraShake = 800;
    this.cameraShakeStrength = 10;
    Sound.fanfare();
    haptic('heavy');
    if (totalReward > 0) {
      // Прибавляем к score партии (см. detonateBomb — тот же fix)
      this.score += totalReward;
      this.cb.onScoreChange(this.score);
      this.comboPopups.push({
        x: W / 2, y: H / 2 - 30,
        text: `NACKL! +${totalReward}`,
        life: 2.0,
        color: '#ffd840',
      });
    }
  }

  private resize() {
    // DPR ограничиваем до 2: на iPhone с dpr=3 backing store втрое больше по
    // площади (×2.25), что сильно греет GPU без видимой разницы на таком масштабе.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.scaleX = (rect.width / W) * dpr;
    this.scaleY = (rect.height / H) * dpr;
    this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);

    // Оффскрин под статичный слой — тот же backing-размер, рисуем 1:1.
    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement('canvas');
      this.bgCtx = this.bgCanvas.getContext('2d');
    }
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    this.bgDirty = true;
    this.needsRender = true;
  }

  private attachPointerHandlers() {
    const toLogicalX = (clientX: number) => {
      const rect = this.canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * W;
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.gameOver || this.paused) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.pointerX = toLogicalX(e.clientX);
      this.needsRender = true;
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.gameOver || this.paused) return;
      if (this.pointerX !== null) { this.pointerX = toLogicalX(e.clientX); this.needsRender = true; }
    });
    const release = () => {
      if (this.gameOver || this.paused) return;
      if (this.aiming) this.dropAiming();
      this.pointerX = null;
      this.needsRender = true;
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  private dropAiming() {
    if (!this.aiming) return;
    const aimY = AIM_TOP_LINE + this.aiming.def.radius;
    Matter.Composite.add(this.world, this.createFruitBody(this.aiming.x, aimY, this.aiming.level));
    Sound.drop();
    this.aiming = null;
    this.nextSpawnAt = performance.now() + SPAWN_DROP_DELAY;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.spawnAiming();
    this.cb.onNextLevelChange?.(this.nextLevel);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }

  restart() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
    this.initPhysics();
    this.aiming = null;
    this.pointerX = null;
    this.score = 0;
    this.gameOver = false;
    this.particles.clear();
    this.cameraShake = 0;
    this.comboCount = 0;
    this.comboExpiresAt = 0;
    this.comboPopups.length = 0;
    this.bombCharge = 0;
    this.bombReadyCharges = 0;
    this.bombUsedThisGame = 0;
    this.emitBombState();
    this.nextLevel = randomSpawnLevel();
    this.cb.onScoreChange(this.score);
    this.spawnAiming();
  }

  private spawnAiming() {
    const level = this.nextLevel;
    this.nextLevel = randomSpawnLevel();
    this.aiming = { x: W / 2, level, def: FRUITS[level] };
    this.cb.onNextLevelChange?.(this.nextLevel);
    this.needsRender = true; // показать новую целящуюся монету, даже если поле в покое
  }

  /**
   * Активна ли сцена — есть ли что обновлять/перерисовывать.
   * Если всё лежит без движения и нет эффектов — кадр можно пропустить,
   * что резко снижает нагрузку (и нагрев) когда банка просто стоит заполненной.
   */
  private isSceneActive(bodies: Matter.Body[]): boolean {
    if (this.needsRender) return true;
    if (this.particles.particles.length > 0) return true;
    if (this.comboPopups.length > 0) return true;
    if (this.cameraShake > 0) return true;
    if (this.aiming && this.pointerX !== null) return true;
    if (!this.aiming && performance.now() < this.nextSpawnAt + 32) return true;
    for (const body of bodies) {
      const data = (body as any).fruitData as FruitData | undefined;
      if (!data) continue;
      if (data.spawnAnim > 0) return true;
      // тело ещё движется — нужно считать физику
      if (Math.abs(body.velocity.x) > 0.06 || Math.abs(body.velocity.y) > 0.06
          || Math.abs(body.angularVelocity) > 0.01) return true;
      if (data.dangerSince !== null) return true; // мигающая danger-линия
    }
    return false;
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime), 33);
    this.lastTime = time;

    // Один раз за кадр берём список тел (раньше allBodies звался 4-5 раз).
    const bodies = Matter.Composite.allBodies(this.world);

    // Idle-skip: нечего обновлять и рисовать — выходим дёшево.
    if (!this.isSceneActive(bodies)) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }
    this.needsRender = false;

    if (!this.gameOver && !this.paused) {
      if (this.aiming && this.pointerX !== null) {
        const r = this.aiming.def.radius;
        const minX = WALL_PADDING + r;
        const maxX = W - WALL_PADDING - r;
        this.aiming.x = Math.max(minX, Math.min(maxX, this.pointerX));
      }
      if (!this.aiming && time >= this.nextSpawnAt) this.spawnAiming();
      Matter.Engine.update(this.engine, dt);
      for (const body of bodies) {
        const data = (body as any).fruitData as FruitData | undefined;
        if (data && data.spawnAnim > 0) data.spawnAnim = Math.max(0, data.spawnAnim - dt / 250);
      }
      this.checkGameOver(time);
    }

    // Партиклы и shake работают всегда (даже когда gameOver — чтобы эффект досмотрелся)
    this.particles.update(dt);
    if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt);
    // Обновление popup-очков
    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      const p = this.comboPopups[i];
      p.life -= dt / 1000;
      p.y -= dt * 0.04; // движется вверх
      if (p.life <= 0) this.comboPopups.splice(i, 1);
    }

    this.render(bodies);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private checkGameOver(time: number) {
    for (const body of Matter.Composite.allBodies(this.world)) {
      const data = (body as any).fruitData as FruitData | undefined;
      if (!data) continue;
      const topY = body.position.y - FRUITS[data.level].radius;
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      const above = topY < DANGER_LINE_Y;
      const resting = speed < RESTING_SPEED_THRESHOLD;
      if (above && resting) {
        if (data.dangerSince === null) data.dangerSince = time;
        if (time - data.dangerSince >= GAME_OVER_GRACE_MS) { this.triggerGameOver(); return; }
      } else {
        data.dangerSince = null;
      }
    }
  }

  private triggerGameOver() {
    this.gameOver = true;
    this.aiming = null;
    hapticError();
    Sound.gameOver();
    this.cb.onGameOver(this.score);
  }

  // -----------------------------------------------------------
  // RENDER — читает текущую тему каждый кадр
  // -----------------------------------------------------------
  /**
   * Перерисовать статичный слой (фон + декор + банка) в оффскрин-канвас.
   * Выполняется ТОЛЬКО при ресайзе/смене темы — а не каждый кадр.
   * Раньше эти ~28 градиентов и сотни ctx-операций считались 60 раз/сек,
   * что и было главной причиной нагрева и просадок на телефоне.
   */
  private ensureStaticLayer() {
    const theme = getTheme();
    if (!this.bgDirty && this.bgThemeId === theme.id) return;
    const ctx = this.bgCtx;
    if (!ctx || !this.bgCanvas) return;
    ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // === АТМОСФЕРНЫЙ ФОН БАНКИ — глубокий, многослойный ===
    const tNow = performance.now() / 1000;

    // Слой 1: основной градиент глубины — центр светлее, края темнее
    const depthGrad = ctx.createRadialGradient(W / 2, H * 0.4, W * 0.1, W / 2, H * 0.5, W * 0.95);
    depthGrad.addColorStop(0, theme.canvasGlow);
    depthGrad.addColorStop(0.4, 'transparent');
    depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = depthGrad;
    ctx.fillRect(0, 0, W, H);

    // Слой 2: top bloom — прожектор сверху, пульсирует
    const bloomPulse = 0.85 + 0.15 * Math.sin(tNow * 0.6);
    const topBloom = ctx.createRadialGradient(W / 2, -20, 0, W / 2, -20, W * bloomPulse);
    topBloom.addColorStop(0, theme.canvasGlow);
    topBloom.addColorStop(0.4, 'transparent');
    ctx.fillStyle = topBloom;
    ctx.fillRect(0, 0, W, H);

    // Слой 3: нижний glow — отражение от пола
    const bottomGlow = ctx.createRadialGradient(W / 2, H + 20, 0, W / 2, H + 20, W * 0.85);
    bottomGlow.addColorStop(0, theme.canvasGlow);
    bottomGlow.addColorStop(0.55, 'transparent');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, W, H);

    // Слой 4: боковые тени — эффект цилиндра/стеклянной банки
    const leftSide = ctx.createLinearGradient(0, 0, W * 0.18, 0);
    leftSide.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
    leftSide.addColorStop(1, 'transparent');
    ctx.fillStyle = leftSide;
    ctx.fillRect(0, 0, W * 0.18, H);

    const rightSide = ctx.createLinearGradient(W, 0, W * 0.82, 0);
    rightSide.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
    rightSide.addColorStop(1, 'transparent');
    ctx.fillStyle = rightSide;
    ctx.fillRect(W * 0.82, 0, W * 0.18, H);

    // Слой 5: финальная виньетка по углам
    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, W * 0.95);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // === ТЕМАТИЧЕСКИЙ ПАТТЕРН ПОД МОНЕТАМИ ===
    this.drawThemeDecor(ctx, theme.id);

    // === ВЕРТИКАЛЬНЫЕ СВЕТОВЫЕ ЛУЧИ — реалистичный god-ray эффект ===
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const xRay = W * (0.25 + i * 0.18);
      const phase = tNow * 0.4 + i * 1.3;
      const offset = Math.sin(phase) * 8;
      const opacity = 0.04 + Math.abs(Math.sin(phase * 0.5)) * 0.04;

      const rayGrad = ctx.createLinearGradient(xRay + offset, 0, xRay + offset, H * 0.7);
      rayGrad.addColorStop(0, `${this.hexFromRgba(theme.canvasGlow, opacity)}`);
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(xRay + offset - 6, 0);
      ctx.lineTo(xRay + offset + 6, 0);
      ctx.lineTo(xRay + offset + 18, H * 0.7);
      ctx.lineTo(xRay + offset - 18, H * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // ════════════════════════════════════════════════════════════════
    // === 3D СТЕКЛЯННАЯ БАНКА ===
    // Подход: банка нарисована с лёгкой перспективой (вид немного снизу).
    // Дно и горлышко — эллипсы (видны как овалы под углом).
    // Боковые стенки выгибаются наружу из-за цилиндрической формы.
    // Двойной контур стекла (внешний+внутренний) даёт толщину.
    // ════════════════════════════════════════════════════════════════
    const wallShimmer = (Math.sin(tNow * 1.2) + 1) / 2; // 0..1

    const jarLeft = WALL_PADDING;
    const jarRight = W - WALL_PADDING;
    const jarTop = DANGER_LINE_Y;
    const jarBottom = H - WALL_PADDING;
    const jarWidth = jarRight - jarLeft;
    const jarCenterX = W / 2;

    // Толщина стекла (двойной контур)
    const glassThickness = 4;
    // Радиус эллипса горлышка (видимое отверстие сверху)
    const neckRx = jarWidth * 0.40;
    const neckRy = 9;
    // Радиус эллипса дна (видимое дно внутри)
    const bottomRx = jarWidth * 0.46;
    const bottomRy = 14;
    // Высота горлышка от верха
    const neckTop = jarTop - 16;
    const lipBottom = neckTop + 12;

    // --- 0. Тень банки снаружи (на фоне темы) ---
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    ctx.beginPath();
    ctx.moveTo(jarLeft, jarTop);
    ctx.lineTo(jarLeft, jarBottom - 12);
    ctx.quadraticCurveTo(jarLeft, jarBottom, jarLeft + 18, jarBottom);
    ctx.lineTo(jarRight - 18, jarBottom);
    ctx.quadraticCurveTo(jarRight, jarBottom, jarRight, jarBottom - 12);
    ctx.lineTo(jarRight, jarTop);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- 1. Заполнение корпуса банки — стеклянный градиент с глубиной ---
    // Горизонтальный градиент создаёт эффект цилиндра: центр светлее, края темнее
    const bodyGrad = ctx.createLinearGradient(jarLeft, 0, jarRight, 0);
    bodyGrad.addColorStop(0,    'rgba(140, 170, 210, 0.22)');
    bodyGrad.addColorStop(0.10, 'rgba(180, 200, 230, 0.08)');
    bodyGrad.addColorStop(0.30, 'rgba(200, 220, 240, 0.02)');
    bodyGrad.addColorStop(0.50, 'rgba(220, 230, 250, 0.00)');
    bodyGrad.addColorStop(0.70, 'rgba(200, 220, 240, 0.02)');
    bodyGrad.addColorStop(0.90, 'rgba(180, 200, 230, 0.08)');
    bodyGrad.addColorStop(1,    'rgba(140, 170, 210, 0.22)');
    ctx.fillStyle = bodyGrad;
    // Корпус: прямоугольник со скруглёнными нижними углами и эллиптическим дном
    ctx.beginPath();
    ctx.moveTo(jarLeft, jarTop);
    ctx.lineTo(jarLeft, jarBottom - 12);
    ctx.quadraticCurveTo(jarLeft, jarBottom, jarLeft + 18, jarBottom);
    ctx.lineTo(jarRight - 18, jarBottom);
    ctx.quadraticCurveTo(jarRight, jarBottom, jarRight, jarBottom - 12);
    ctx.lineTo(jarRight, jarTop);
    ctx.closePath();
    ctx.fill();

    // --- 2. Внутренний задний эллипс (дно банки изнутри) ---
    // Это создаёт ощущение что у банки есть глубина и мы видим внутрь
    const bottomGrad = ctx.createRadialGradient(
      jarCenterX, jarBottom - 8, 4,
      jarCenterX, jarBottom - 8, bottomRx
    );
    bottomGrad.addColorStop(0,   this.hexFromRgba(theme.canvasGlow, 0.32));
    bottomGrad.addColorStop(0.5, this.hexFromRgba(theme.canvasGlow, 0.12));
    bottomGrad.addColorStop(1,   'rgba(0, 0, 0, 0.20)');
    ctx.fillStyle = bottomGrad;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, jarBottom - 8, bottomRx, bottomRy, 0, 0, Math.PI * 2);
    ctx.fill();
    // Тень от стекла на дне (внутренний обод)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, jarBottom - 8, bottomRx, bottomRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    // --- 3. Внутреннее свечение от собранных монет в банке ---
    const innerGlow = ctx.createRadialGradient(
      jarCenterX, jarBottom - 60, 10,
      jarCenterX, jarBottom - 60, jarWidth * 0.7
    );
    innerGlow.addColorStop(0, this.hexFromRgba(theme.canvasGlow, 0.22));
    innerGlow.addColorStop(0.6, this.hexFromRgba(theme.canvasGlow, 0.05));
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(jarLeft, jarTop, jarWidth, jarBottom - jarTop);

    // --- 4. Внешний контур стекла (наружная стенка) ---
    ctx.strokeStyle = `rgba(220, 230, 250, ${0.55 + wallShimmer * 0.10})`;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(jarLeft, jarTop);
    ctx.lineTo(jarLeft, jarBottom - 12);
    ctx.quadraticCurveTo(jarLeft, jarBottom, jarLeft + 18, jarBottom);
    ctx.lineTo(jarRight - 18, jarBottom);
    ctx.quadraticCurveTo(jarRight, jarBottom, jarRight, jarBottom - 12);
    ctx.lineTo(jarRight, jarTop);
    ctx.stroke();

    // --- 5. Внутренний контур стекла (создаёт толщину) ---
    ctx.strokeStyle = 'rgba(180, 200, 230, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(jarLeft + glassThickness, jarTop);
    ctx.lineTo(jarLeft + glassThickness, jarBottom - 16);
    ctx.quadraticCurveTo(jarLeft + glassThickness, jarBottom - glassThickness, jarLeft + 22, jarBottom - glassThickness);
    ctx.lineTo(jarRight - 22, jarBottom - glassThickness);
    ctx.quadraticCurveTo(jarRight - glassThickness, jarBottom - glassThickness, jarRight - glassThickness, jarBottom - 16);
    ctx.lineTo(jarRight - glassThickness, jarTop);
    ctx.stroke();

    // --- 6. Передний эллипс горлышка (главная "3D" фишка) ---
    // Это эллипс который виден как овал — банка открыта сверху
    // Стеклянная толщина горлышка (внешний эллипс)
    const lipGrad = ctx.createLinearGradient(0, neckTop, 0, lipBottom + 4);
    lipGrad.addColorStop(0,    'rgba(255, 255, 255, 0.55)');
    lipGrad.addColorStop(0.4,  'rgba(220, 230, 250, 0.35)');
    lipGrad.addColorStop(0.7,  'rgba(160, 180, 210, 0.30)');
    lipGrad.addColorStop(1,    'rgba(100, 130, 170, 0.45)');
    ctx.fillStyle = lipGrad;
    // Внешний эллипс горлышка (вид сверху-снаружи)
    ctx.beginPath();
    ctx.ellipse(jarCenterX, neckTop, neckRx + 3, neckRy + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Тёмный круг внутри = отверстие банки
    const holeGrad = ctx.createRadialGradient(
      jarCenterX, neckTop, 2,
      jarCenterX, neckTop, neckRx
    );
    holeGrad.addColorStop(0, this.hexFromRgba(theme.canvasGlow, 0.15));
    holeGrad.addColorStop(0.6, 'rgba(20, 10, 30, 0.65)');
    holeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, neckTop, neckRx, neckRy, 0, 0, Math.PI * 2);
    ctx.fill();
    // Обводка отверстия (внутренний край стекла)
    ctx.strokeStyle = 'rgba(220, 230, 250, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, neckTop, neckRx, neckRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Лёгкий блик на верхнем крае отверстия (нижняя дуга эллипса видна как полумесяц блика)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + wallShimmer * 0.20})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, neckTop, neckRx - 1, neckRy - 1, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // --- 7. Боковые линии горлышка (от бортика к корпусу) ---
    // Они образуют как бы "шейку" банки сужающую вниз
    ctx.strokeStyle = `rgba(220, 230, 250, ${0.50 + wallShimmer * 0.10})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(jarCenterX - neckRx - 3, neckTop);
    ctx.quadraticCurveTo(jarCenterX - neckRx - 5, jarTop - 4, jarLeft, jarTop);
    ctx.moveTo(jarCenterX + neckRx + 3, neckTop);
    ctx.quadraticCurveTo(jarCenterX + neckRx + 5, jarTop - 4, jarRight, jarTop);
    ctx.stroke();

    // --- 8. Главный левый блик (длинная вертикальная полоса) ---
    // Изогнут по форме банки (slight curve внизу)
    const leftHighlightGrad = ctx.createLinearGradient(jarLeft + 6, 0, jarLeft + 22, 0);
    leftHighlightGrad.addColorStop(0, `rgba(255, 255, 255, ${0.55 + wallShimmer * 0.15})`);
    leftHighlightGrad.addColorStop(0.4, `rgba(255, 255, 255, ${0.18 + wallShimmer * 0.08})`);
    leftHighlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = leftHighlightGrad;
    ctx.beginPath();
    ctx.moveTo(jarLeft + 6, jarTop + 24);
    ctx.lineTo(jarLeft + 6, jarBottom - 30);
    ctx.quadraticCurveTo(jarLeft + 6, jarBottom - 14, jarLeft + 20, jarBottom - 14);
    ctx.lineTo(jarLeft + 24, jarBottom - 22);
    ctx.lineTo(jarLeft + 22, jarTop + 36);
    ctx.closePath();
    ctx.fill();

    // Маленький круглый блик-точка в верхней части (рефлекс источника света)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 + wallShimmer * 0.10})`;
    ctx.beginPath();
    ctx.ellipse(jarLeft + 14, jarTop + 60, 3, 14, -0.12, 0, Math.PI * 2);
    ctx.fill();
    // Размытый ореол вокруг блика
    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + wallShimmer * 0.10})`;
    ctx.beginPath();
    ctx.ellipse(jarLeft + 14, jarTop + 60, 7, 20, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // --- 9. Тонкий правый контр-блик ---
    const rightHighlight = ctx.createLinearGradient(jarRight - 14, 0, jarRight - 4, 0);
    rightHighlight.addColorStop(0, 'rgba(255, 255, 255, 0)');
    rightHighlight.addColorStop(1, `rgba(255, 255, 255, ${0.28 + wallShimmer * 0.08})`);
    ctx.fillStyle = rightHighlight;
    ctx.beginPath();
    ctx.moveTo(jarRight - 4, jarTop + 40);
    ctx.lineTo(jarRight - 4, jarBottom - 24);
    ctx.lineTo(jarRight - 10, jarBottom - 30);
    ctx.lineTo(jarRight - 10, jarTop + 48);
    ctx.closePath();
    ctx.fill();

    // --- 10. Передняя дуга дна (видимая часть нижнего края) ---
    // Создаёт ощущение что у банки есть передняя стенка перед монетами
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.30 + wallShimmer * 0.10})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(jarCenterX, jarBottom - 2, bottomRx + 4, bottomRy + 2, 0, Math.PI * 0.95, Math.PI * 2.05);
    ctx.stroke();

    this.bgDirty = false;
    this.bgThemeId = theme.id;
  }

  // -----------------------------------------------------------
  // RENDER — рисует только ЖИВОЙ слой (банка/фон берутся из кэша)
  // -----------------------------------------------------------
  private render(bodies: Matter.Body[]) {
    const ctx = this.ctx;

    // 1) Готовим/обновляем статичный слой и блитим его 1:1 (со смещением shake).
    this.ensureStaticLayer();
    let sdx = 0, sdy = 0;
    if (this.cameraShake > 0) {
      const intensity = (this.cameraShake / 250) * this.cameraShakeStrength;
      sdx = (Math.random() - 0.5) * intensity;
      sdy = (Math.random() - 0.5) * intensity;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.bgCanvas) ctx.drawImage(this.bgCanvas, sdx * this.scaleX, sdy * this.scaleY);
    ctx.restore();

    // 2) Живой слой — в логических координатах, со смещением shake.
    ctx.save();
    if (sdx || sdy) ctx.translate(sdx, sdy);

    const jarLeft = WALL_PADDING;
    const jarRight = W - WALL_PADDING;
    const jarTop = DANGER_LINE_Y;

    // --- Линия проигрыша (danger line) — внутри банки, у горлышка ---
    let anyDanger = false;
    for (const b of bodies) {
      if ((b as any).fruitData?.dangerSince != null) { anyDanger = true; break; }
    }
    const pulse = anyDanger ? 0.5 + 0.5 * Math.sin(performance.now() / 100) : 0.30;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = `rgba(255, 80, 80, ${pulse})`;
    ctx.lineWidth = anyDanger ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(jarLeft + 6, jarTop + 2);
    ctx.lineTo(jarRight - 6, jarTop + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Свечение рисуем только для крупных монет (5+) и только что появившихся —
    // спрайты сами по себе яркие, glow для каждой мелочи зря грузит GPU.
    for (const body of bodies) {
      const data = (body as any).fruitData as FruitData | undefined;
      if (!data) continue;
      if (data.level >= 5 || data.spawnAnim > 0.01) {
        this.drawGlow(body.position.x, body.position.y, FRUITS[data.level], data.spawnAnim);
      }
    }
    for (const body of bodies) {
      const data = (body as any).fruitData as FruitData | undefined;
      if (!data) continue;
      this.drawCoin(body.position.x, body.position.y, body.angle, FRUITS[data.level], data.spawnAnim);
    }

    // Партиклы — поверх всех монет
    this.particles.draw(ctx);

    // Popup-очки (+15, +30 ×2). Вместо дорогого shadowBlur — дешёвая тёмная подложка.
    for (const p of this.comboPopups) {
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(p.text, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (this.aiming && !this.gameOver) {
      // Низ всех прицельных монет на одной линии (AIM_TOP_LINE + radius = центр).
      // Это держит большие монеты внутри горлышка банки, а не свешивает их сверху.
      const aimY = AIM_TOP_LINE + this.aiming.def.radius;
      this.drawGlow(this.aiming.x, aimY, this.aiming.def, 0);
      this.drawCoin(this.aiming.x, aimY, 0, this.aiming.def, 0);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `${this.aiming.def.glow}55`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.aiming.x, aimY + this.aiming.def.radius);
      ctx.lineTo(this.aiming.x, H - WALL_PADDING);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore(); // Завершаем shake transform
  }

  private drawGlow(x: number, y: number, def: FruitDef, spawnAnim: number) {
    const ctx = this.ctx;
    // Размер свечения чуть больше монеты + пульсация при spawnAnim.
    // Чуть мягче, чем раньше — настоящие иконки сами яркие.
    const glowRadius = def.radius * (1.4 + spawnAnim * 0.8);
    const gradient = ctx.createRadialGradient(x, y, def.radius * 0.7, x, y, glowRadius);
    gradient.addColorStop(0, def.glow + '70');
    gradient.addColorStop(0.6, def.glow + '20');
    gradient.addColorStop(1, def.glow + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============================================================
  // ТЕМАТИЧЕСКИЙ ДЕКОР НА КАНВАСЕ.
  // Рисуется под монетами и стенками банки. opacity 0.06-0.12,
  // чтобы было видно но не мешало восприятию игры.
  // ============================================================
  /**
   * Конверсия rgba(R, G, B, A) → rgba(R, G, B, newOpacity).
   * Используется в drawing для применения цвета темы с разной непрозрачностью.
   * Если входит не rgba, возвращает исходник.
   */
  private hexFromRgba(rgba: string, newOpacity: number): string {
    const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!m) return rgba;
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${newOpacity})`;
  }

  private drawThemeDecor(ctx: CanvasRenderingContext2D, themeId: string) {
    const t = performance.now() / 1000;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    switch (themeId) {
      case 'pastel': {
        // Мягкие пузырьки парят
        ctx.globalAlpha = 0.18;
        const bubbles = [
          { x: 0.2, y: 0.3, r: 30 }, { x: 0.8, y: 0.4, r: 40 },
          { x: 0.5, y: 0.7, r: 35 }, { x: 0.3, y: 0.85, r: 25 },
        ];
        bubbles.forEach((b, i) => {
          const yOff = Math.sin(t * 0.3 + i) * 8;
          ctx.fillStyle = i % 2 === 0 ? '#aadce6' : '#e87fad';
          ctx.beginPath();
          ctx.arc(W * b.x, H * b.y + yOff, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'acki_nacki': {
        // Полупрозрачные NACKL-смайлы в фоне канваса
        const sprite = getSprite('NACKL');
        if (sprite) {
          ctx.globalAlpha = 0.08;
          const layout = [
            { x: 0.15, y: 0.25, size: 80, rot: -0.2 },
            { x: 0.82, y: 0.35, size: 65, rot: 0.3 },
            { x: 0.25, y: 0.65, size: 70, rot: 0.1 },
            { x: 0.75, y: 0.8, size: 90, rot: -0.15 },
          ];
          layout.forEach((l, i) => {
            ctx.save();
            ctx.translate(W * l.x, H * l.y);
            ctx.rotate(l.rot + Math.sin(t * 0.2 + i) * 0.1);
            ctx.drawImage(sprite, -l.size/2, -l.size/2, l.size, l.size);
            ctx.restore();
          });
        }
        break;
      }

      case 'exchange': {
        // Свечной график на фоне
        ctx.globalAlpha = 0.16;
        const candles = 22;
        for (let i = 0; i < candles; i++) {
          const x = (i / candles) * W + 6;
          const seed = Math.sin(i * 12.345);
          const isGreen = seed > -0.1;
          const baseY = H * 0.5 + Math.sin(i * 0.5) * 60;
          const bodyH = 8 + Math.abs(seed) * 22;
          const wickH = bodyH + 6 + Math.abs(Math.cos(i * 3.7)) * 12;
          ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, baseY - wickH/2);
          ctx.lineTo(x, baseY + wickH/2);
          ctx.stroke();
          ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.fillRect(x - 3, baseY - bodyH/2, 6, bodyH);
        }
        // Линия тренда
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#f0b90b';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, H * 0.5);
        for (let x = 0; x <= W; x += 10) {
          const y = H * 0.5 + Math.sin(x * 0.02 + t * 0.3) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }

      case 'pizza': {
        // Кружки-пиццы с пеппероной на фоне
        ctx.globalAlpha = 0.12;
        const pizzas = [
          { x: 0.15, y: 0.3, r: 35 }, { x: 0.85, y: 0.45, r: 30 },
          { x: 0.25, y: 0.7, r: 28 }, { x: 0.78, y: 0.78, r: 38 },
        ];
        pizzas.forEach((p, i) => {
          const cx = W * p.x;
          const cy = H * p.y + Math.sin(t * 0.2 + i) * 5;
          // Тесто
          ctx.fillStyle = '#d4a574';
          ctx.beginPath();
          ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
          ctx.fill();
          // Сыр
          ctx.fillStyle = '#ffd84d';
          ctx.beginPath();
          ctx.arc(cx, cy, p.r * 0.85, 0, Math.PI * 2);
          ctx.fill();
          // Пепперони — 3-4 шт
          ctx.fillStyle = '#c83020';
          for (let j = 0; j < 4; j++) {
            const a = (j / 4) * Math.PI * 2 + i;
            const px = cx + Math.cos(a) * p.r * 0.5;
            const py = cy + Math.sin(a) * p.r * 0.5;
            ctx.beginPath();
            ctx.arc(px, py, p.r * 0.18, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        break;
      }

      case 'terminal': {
        // ASCII-сетка + сканлайны
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#00ff80';
        ctx.font = 'bold 10px "Courier New", monospace';
        const cols = 18;
        const rows = 30;
        const chars = '01アイウエオカキクケコサシスセソタチツ';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const seed = (r * 31 + c * 17) + Math.floor(t * 2);
            const ch = chars[seed % chars.length];
            // Лёгкий fade сверху-вниз
            const alpha = 0.4 + ((r * 0.5 + Math.sin(t + c * 0.3)) % 1) * 0.6;
            ctx.globalAlpha = 0.12 * alpha;
            ctx.fillText(ch, c * (W / cols) + 4, r * (H / rows) + 12);
          }
        }
        // Сканлайны (горизонтальные тонкие полоски)
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#00ff80';
        for (let y = 0; y < H; y += 3) {
          ctx.fillRect(0, y, W, 1);
        }
        break;
      }

      case 'cyberpunk': {
        // Тонкая неоновая сетка + горизонтальные линии
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#beff32';
        ctx.lineWidth = 0.5;
        // Перспективная сетка снизу
        const horizonY = H * 0.55;
        for (let i = 0; i <= 16; i++) {
          const xb = (i / 16) * W;
          ctx.beginPath();
          ctx.moveTo(xb, horizonY);
          ctx.lineTo(W * 0.5 + (xb - W * 0.5) * 0.3, H);
          ctx.stroke();
        }
        // Горизонтальные линии
        for (let i = 1; i <= 6; i++) {
          const yh = horizonY + (i / 6) * (H - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, yh);
          ctx.lineTo(W, yh);
          ctx.stroke();
        }
        // Несколько ярких розовых вспышек
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#b432ff';
        const flares = [{ x: 0.2, y: 0.15 }, { x: 0.8, y: 0.25 }, { x: 0.5, y: 0.4 }];
        flares.forEach((f, i) => {
          const flicker = 0.5 + 0.5 * Math.sin(t * 3 + i);
          ctx.globalAlpha = 0.18 * flicker;
          ctx.beginPath();
          ctx.arc(W * f.x, H * f.y, 25, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'bitcoin': {
        // Гигантские золотые ₿ полупрозрачные
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = '#f7931a';
        ctx.font = 'bold 120px "Fredoka", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbols = [
          { x: 0.25, y: 0.25, rot: -0.15, scale: 1 },
          { x: 0.78, y: 0.45, rot: 0.2, scale: 0.7 },
          { x: 0.3, y: 0.75, rot: 0.1, scale: 0.85 },
        ];
        symbols.forEach((s, i) => {
          ctx.save();
          ctx.translate(W * s.x, H * s.y + Math.sin(t * 0.15 + i) * 4);
          ctx.rotate(s.rot);
          ctx.scale(s.scale, s.scale);
          ctx.fillText('₿', 0, 0);
          ctx.restore();
        });
        // Лёгкая золотая сетка
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (i / 6) * H);
          ctx.lineTo(W, (i / 6) * H);
          ctx.stroke();
        }
        break;
      }

      case 'ocean': {
        // Поднимающиеся пузыри + волны
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < 12; i++) {
          const x = ((i * 47 + t * 8) % W);
          const y = (H - ((t * 30 + i * 80) % H));
          const r = 4 + (i % 5) * 2;
          ctx.strokeStyle = '#a0ffe8';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Волнистые линии — поверхность воды
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#40dcff';
        ctx.lineWidth = 1;
        for (let lineY = 80; lineY < H; lineY += 90) {
          ctx.beginPath();
          for (let x = 0; x <= W; x += 8) {
            const y = lineY + Math.sin((x + t * 50) * 0.03) * 6;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }

      case 'china': {
        // Красные бумажные фонарики покачиваются + иероглифы
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < 6; i++) {
          const baseX = (i * 0.18 + 0.08) * W;
          const sway = Math.sin(t * 0.4 + i) * 8;
          const x = baseX + sway;
          const y = 80 + (i % 2) * 60;
          const radius = 18 + (i % 3) * 4;
          // Шнур
          ctx.strokeStyle = '#3a1a08';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, y - radius);
          ctx.stroke();
          // Сам фонарик — красный овал
          ctx.fillStyle = '#d83838';
          ctx.beginPath();
          ctx.ellipse(x, y, radius, radius * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Золотая полоска поверху
          ctx.fillStyle = '#f0c040';
          ctx.fillRect(x - radius, y - 1, radius * 2, 2);
          // Кисточка снизу
          ctx.strokeStyle = '#f0c040';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y + radius * 1.2);
          ctx.lineTo(x, y + radius * 1.5);
          ctx.stroke();
        }
        // Плавающие иероглифы — крупные стилизованные знаки
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#f0c040';
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        const chars = ['福', '寿', '財', '龍'];
        for (let i = 0; i < 4; i++) {
          const phaseX = (i * W / 4 + 30 + Math.sin(t * 0.2 + i) * 15);
          const phaseY = 200 + (i % 2) * 200 + Math.cos(t * 0.25 + i) * 12;
          ctx.fillText(chars[i], phaseX, phaseY);
        }
        ctx.textAlign = 'left';
        ctx.font = '';
        break;
      }

      case 'halloween': {
        // Силуэты летучих мышей + звёзды
        ctx.globalAlpha = 0.20;
        ctx.fillStyle = '#a060e0';
        for (let i = 0; i < 4; i++) {
          const x = ((i * 113 + t * 25) % (W + 80) - 40);
          const y = 50 + Math.sin(t * 0.5 + i) * 30 + i * 30;
          // Простой контур мыши — два треугольника крыльев + ромб тела
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 18, y - 8);
          ctx.lineTo(x - 12, y);
          ctx.lineTo(x, y + 4);
          ctx.lineTo(x + 12, y);
          ctx.lineTo(x + 18, y - 8);
          ctx.lineTo(x, y);
          ctx.fill();
        }
        // Звёзды
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 14; i++) {
          const seed = i * 31;
          const sx = (seed * 13) % W;
          const sy = ((seed * 7) % (H / 2));
          const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + i);
          ctx.globalAlpha = 0.4 * twinkle;
          ctx.fillText('✦', sx, sy);
        }
        ctx.font = '14px sans-serif';
        break;
      }

      case 'christmas': {
        // Падающий снег
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        for (let i = 0; i < 22; i++) {
          const x = ((i * 47 + Math.sin(t * 0.3 + i) * 20) % W);
          const y = ((t * 25 + i * 50) % H);
          ctx.fillText('❄', x, y);
        }
        // Гирлянда сверху — мерцающие огоньки
        ctx.globalAlpha = 1;
        const lightColors = ['#e83838', '#50c050', '#ffd700', '#4080ff'];
        for (let i = 0; i < 12; i++) {
          const x = (i / 11) * W;
          const flicker = 0.5 + 0.5 * Math.sin(t * 3 + i);
          ctx.fillStyle = lightColors[i % 4];
          ctx.globalAlpha = 0.7 * flicker;
          ctx.beginPath();
          ctx.arc(x, 15, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'bee_engine': {
        // Соты — гексагональная сетка
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ffc800';
        ctx.lineWidth = 0.8;
        const hexSize = 22;
        const hexW = hexSize * Math.sqrt(3);
        const hexH = hexSize * 1.5;
        for (let row = -1; row < H / hexH + 1; row++) {
          for (let col = -1; col < W / hexW + 2; col++) {
            const cx = col * hexW + (row % 2) * (hexW / 2);
            const cy = row * hexH;
            ctx.beginPath();
            for (let p = 0; p < 6; p++) {
              const a = (p / 6) * Math.PI * 2 + Math.PI / 6;
              const px = cx + Math.cos(a) * hexSize;
              const py = cy + Math.sin(a) * hexSize;
              if (p === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
        // Несколько ярких сот
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffc800';
        const brightHexes = [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.5 }, { x: 0.4, y: 0.7 }];
        brightHexes.forEach((b, i) => {
          const flicker = 0.5 + 0.5 * Math.sin(t * 1.5 + i);
          ctx.globalAlpha = 0.2 * flicker;
          const cx = W * b.x;
          const cy = H * b.y;
          ctx.beginPath();
          for (let p = 0; p < 6; p++) {
            const a = (p / 6) * Math.PI * 2 + Math.PI / 6;
            const px = cx + Math.cos(a) * hexSize;
            const py = cy + Math.sin(a) * hexSize;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        });
        break;
      }
    }
    ctx.restore();
  }

  private drawCoin(x: number, y: number, angle: number, def: FruitDef, spawnAnim: number) {
    const ctx = this.ctx;
    const scale = 1 + spawnAnim * 0.25;
    const r = def.radius * scale;
    const sprite = this.spritesReady ? getSprite(def.ticker) : null;

    // ===== СЛОЙ 1: КОНТАКТНАЯ ТЕНЬ ПОД МОНЕТОЙ =====
    // Создаёт ощущение "монета над поверхностью" — даже на стопке.
    const shadowGradient = ctx.createRadialGradient(
      x, y + r * 0.92, r * 0.1,
      x, y + r * 0.92, r * 1.1
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    shadowGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.18)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.92, r * 1.05, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite) {
      // ===== СЛОЙ 2: САМ ЛОГОТИП МОНЕТЫ =====
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const s = r * 2;
      ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
      ctx.restore();

      // ===== СЛОЙ 3: ВНУТРЕННЯЯ ТЕНЬ СНИЗУ-СПРАВА =====
      // Создаёт ощущение "сферичности" — нижне-правая часть в тени.
      // Используем композит-режим source-atop, чтобы тень была только
      // внутри непрозрачных пикселей монеты.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.98, 0, Math.PI * 2);
      ctx.clip();
      const innerShadow = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.3, r * 0.2,
        x + r * 0.4, y + r * 0.5, r * 1.2
      );
      innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = innerShadow;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ===== СЛОЙ 4: SPECULAR HIGHLIGHT (БЛИК) =====
      // Полупрозрачное белое пятно сверху-слева — отражение источника света.
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      const highlight = ctx.createRadialGradient(
        x - r * 0.35, y - r * 0.4, 0,
        x - r * 0.35, y - r * 0.4, r * 0.55
      );
      highlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      highlight.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
      highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.5, r * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ===== СЛОЙ 5: ОБОДОК ВОКРУГ МОНЕТЫ =====
      // Тонкое кольцо в фирменном цвете — как у чеканенной монеты.
      ctx.strokeStyle = `${def.colorDark}80`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.985, 0, Math.PI * 2);
      ctx.stroke();

      // Светлый кант чуть внутри — даёт "металличность"
      ctx.strokeStyle = `${def.colorLight}50`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.93, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Fallback пока спрайт не загрузился
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = def.colorDark;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  getScore() { return this.score; }
  isGameOver() { return this.gameOver; }
}
