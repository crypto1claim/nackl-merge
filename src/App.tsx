import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine';
import { tg, hapticSelection } from './telegram';
import MenuScreen from './MenuScreen';
import SettingsModal from './SettingsModal';
import PauseModal from './PauseModal';
import ShopScreen from './ShopScreen';
import AboutScreen from './AboutScreen';
import Tutorial, { hasSeenTutorial } from './Tutorial';
import OnboardingScreen, { hasSeenOnboarding } from './OnboardingScreen';
import { getStoredWallet, shortAddress, type WalletState } from './wallet';
import { t, subscribeLang } from './i18n';
import { applyTheme, subscribeTheme } from './themes';
import { Sound } from './sound';
import { FRUITS } from './fruits';
import { earnMRG, recordBest, getBalance, getBest, subscribeBalance, formatMRG } from './currency';
import { track } from './analytics';
import { subscribeCoinSet } from './coin_sets';
import { claimDailyBonus } from './dailyBonus';
import DailyBonusModal from './DailyBonusModal';
import AchievementToast from './AchievementToast';
import AchievementsScreen from './AchievementsScreen';
import * as Achievements from './achievements';
import { POWERUPS, subscribeInventory, getInventory } from './powerups';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [wallet, setWallet] = useState<WalletState>(() => getStoredWallet());
  // sessionEarned — сколько MRG заработал в ТЕКУЩЕЙ игре. Показывается в HUD.
  const [sessionEarned, setSessionEarned] = useState(0);
  // balance — общий накопленный (между играми)
  const [balance, setBalance] = useState<number>(() => getBalance());
  const [best, setBest] = useState<number>(() => getBest());
  const [gameOver, setGameOver] = useState(false);
  const [finalEarned, setFinalEarned] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const [paused, setPaused] = useState(false);
  // Ежедневный бонус: показываем модалку при первом заходе за день.
  // Не блокируем онбординг — новый пользователь сначала пройдёт его.
  const [dailyBonus, setDailyBonus] = useState<{amount: number; streak: number} | null>(null);

  useEffect(() => {
    if (showOnboarding) return; // ждём окончания онбординга
    const result = claimDailyBonus();
    if (result.isNew && result.amount > 0) {
      setDailyBonus({ amount: result.amount, streak: result.streak });
      Achievements.onDailyStreak(result.streak);
    }
  }, [showOnboarding]);

  // Проверка баланса для достижения «100k MRG»
  useEffect(() => { Achievements.onBalanceChange(balance); }, [balance]);
  const [inGame, setInGame] = useState(false);
  const [nextLevel, setNextLevel] = useState<number>(0);
  const [comboBanner, setComboBanner] = useState<{ count: number; key: number } | null>(null);
  const [bombState, setBombState] = useState<{
    charge: number;
    ready: number;
    used: number;
    maxUses: number;
  }>({ charge: 0, ready: 0, used: 0, maxUses: 3 });
  const [shakeFlash, setShakeFlash] = useState(0);  // ключ для триггера вспышки
  const [, force] = useState(0);
  // Инвентарь бустеров — подписан, чтобы кнопки в HUD обновлялись после покупки/использования
  const [powerupInv, setPowerupInv] = useState(() => getInventory());
  useEffect(() => subscribeInventory(setPowerupInv), []);

  useEffect(() => {
    // tg.ready() / expand() уже вызваны в main.tsx до рендера React
    applyTheme();
    // Также разблокируем звук на любом тапе/клике + touchstart (для iOS Safari)
    const unlockSound = () => {
      Sound.unlock();
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
    window.addEventListener('pointerdown', unlockSound, { once: true });
    window.addEventListener('touchstart', unlockSound, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
  }, []);

  useEffect(() => {
    const u1 = subscribeLang(() => force((n) => n + 1));
    const u2 = subscribeTheme(() => { force((n) => n + 1); engineRef.current?.onThemeChange(); });
    const u3 = subscribeBalance((b) => setBalance(b));
    const u4 = subscribeCoinSet(() => force((n) => n + 1));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  useEffect(() => {
    if (!comboBanner) return;
    const t = setTimeout(() => setComboBanner(null), 1000);
    return () => clearTimeout(t);
  }, [comboBanner]);

  useEffect(() => {
    if (!engineRef.current) return;
    if (showTutorial) engineRef.current.pause();
    else engineRef.current.resume();
  }, [showTutorial]);

  // Запуск движка
  useEffect(() => {
    if (!wallet.connected || !inGame || !canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onScoreChange: (s) => setSessionEarned(s),
      onNextLevelChange: (lvl) => setNextLevel(lvl),
      onCombo: (count) => setComboBanner({ count, key: Date.now() }),
      onBombStateChange: (s) => setBombState(s),
      onShakeDamageDetonated: () => setShakeFlash(Date.now()),
      onPowerupChange: () => setPowerupInv(getInventory()),
      onGameOver: (earned) => {
        setFinalEarned(earned);
        // Записываем в общий баланс
        earnMRG(earned);
        // Проверка single-game рекорда (best обновляется ТОЛЬКО здесь)
        const prevBest = getBest();
        if (earned > prevBest) {
          recordBest(earned);
          setBest(earned);
          setNewRecord(earned > 0);
        } else {
          setNewRecord(false);
        }
        setGameOver(true);
        track('game_over', { earned });
        try {
          (tg as any)?.sendData?.(JSON.stringify({
            type: 'game_result', game: 'acki_merge',
            earned, wallet: wallet.address,
          }));
        } catch { /* */ }
      },
    });
    engineRef.current = engine;
    engine.start();
    return () => engine.stop();
  }, [wallet.connected, wallet.address, inGame]);

  // === BOMB CONTROLS: Space на десктопе + Shake на мобиле ===
  useEffect(() => {
    if (!inGame || gameOver || paused) return;

    // Десктоп: зажатие Space ≥ 500ms активирует взрыв
    let spaceHoldTimer: number | null = null;
    let spacePressed = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || spacePressed) return;
      e.preventDefault();
      spacePressed = true;
      // Запускаем таймер: если 500мс держит — взрыв
      spaceHoldTimer = window.setTimeout(() => {
        if (engineRef.current?.isBombReady()) {
          engineRef.current.detonateBomb();
        }
      }, 500);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spacePressed = false;
      if (spaceHoldTimer) { clearTimeout(spaceHoldTimer); spaceHoldTimer = null; }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Мобила: shake-detection через DeviceMotion API
    let lastShake = 0;
    const SHAKE_THRESHOLD = 25;        // ускорение в м/с² на тряску
    const SHAKE_COOLDOWN_MS = 1500;
    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const now = Date.now();
      if (mag > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN_MS) {
        lastShake = now;
        if (engineRef.current?.isBombReady()) {
          engineRef.current.detonateBomb();
        }
      }
    };
    // Запрашиваем разрешение на iOS 13+
    const DM: any = (window as any).DeviceMotionEvent;
    if (DM && typeof DM.requestPermission === 'function') {
      DM.requestPermission()
        .then((res: string) => {
          if (res === 'granted') window.addEventListener('devicemotion', onMotion);
        })
        .catch(() => {});
    } else {
      window.addEventListener('devicemotion', onMotion);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('devicemotion', onMotion);
      if (spaceHoldTimer) clearTimeout(spaceHoldTimer);
    };
  }, [inGame, gameOver, paused]);

  const handleRestart = () => {
    setGameOver(false);
    setPaused(false);
    setSessionEarned(0);
    setNewRecord(false);
    setBombState({ charge: 0, ready: 0, used: 0, maxUses: 3 });
    engineRef.current?.restart();
  };

  const handleWalletDisconnect = (state: WalletState) => {
    setWallet(state);
    setShowSettings(false);
    setGameOver(false);
    setSessionEarned(0);
    setBombState({ charge: 0, ready: 0, used: 0, maxUses: 3 });
    setInGame(false);
    // НЕ сбрасываем баланс и покупки — игрок может вернуться
  };

  const handleExitToMenu = () => {
    setPaused(false);
    setGameOver(false);
    setSessionEarned(0);
    setBombState({ charge: 0, ready: 0, used: 0, maxUses: 3 });
    setInGame(false);
  };

  const handlePauseClick = () => {
    if (gameOver || paused) return;
    Sound.click();
    setPaused(true);
    engineRef.current?.pause();
    hapticSelection();
  };

  const handleResume = () => {
    setPaused(false);
    engineRef.current?.resume();
  };

  const handlePlayClick = () => {
    setInGame(true);
    setGameOver(false);
    setSessionEarned(0);
    setBombState({ charge: 0, ready: 0, used: 0, maxUses: 3 });
    track('game_start');
    if (!hasSeenTutorial()) setShowTutorial(true);
  };

  // Стартовое меню или вложенные экраны
  if (!wallet.connected || !inGame) {
    return (
      <>
        {showOnboarding ? (
          <OnboardingScreen onProceed={() => setShowOnboarding(false)} />
        ) : showAbout ? (
          <AboutScreen onBack={() => setShowAbout(false)} />
        ) : showShop ? (
          <ShopScreen onBack={() => setShowShop(false)} />
        ) : showAchievements ? (
          <AchievementsScreen onBack={() => setShowAchievements(false)} />
        ) : (
          <MenuScreen
            onConnected={(state) => {
              setWallet(state);
              setInGame(true);
              track('game_start');
              // Если игрок впервые входит в игру — показать туториал
              if (!hasSeenTutorial()) setShowTutorial(true);
            }}
            onSettings={() => setShowSettings(true)}
            onShop={() => setShowShop(true)}
            onAbout={() => setShowAbout(true)}
            onAchievements={() => setShowAchievements(true)}
            balance={balance}
            walletConnected={wallet.connected}
            onPlay={handlePlayClick}
          />
        )}
        <AchievementToast />
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onWalletDisconnect={handleWalletDisconnect}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="hud">
        {/* Левая группа: кошелёк + след монета + заработано */}
        <div className="hud-left">
          <div className="hud-pill hud-pill-wallet" title={wallet.address || ''}>
            <span className="wallet-dot" />
            <span className="hud-pill-text">{wallet.address ? shortAddress(wallet.address) : t('hud.connected')}</span>
          </div>
          <div className="hud-pill hud-pill-next" title={t('hud.next')}>
            <img
              src={`coins/${spriteFile(FRUITS[nextLevel].ticker)}`}
              alt={FRUITS[nextLevel].ticker}
              width="22" height="22"
            />
            <span className="hud-pill-arrow">›</span>
          </div>
          <div className="hud-pill hud-pill-earned" title={t('hud.earned')}>
            <span className="hud-pill-text">+{formatMRG(sessionEarned)}</span>
            <span className="hud-pill-suffix">MRG</span>
          </div>
        </div>
        <div className="hud-right">
          {/* Бустеры — 3 слота ВСЕГДА видны пока партия идёт.
              Статус определяет вид:
              - Не куплен → тусклая иконка без бейджа, тап → магазин
              - Куплен и доступен → яркая, жёлтый бейдж с числом
              - Куплен но исчерпан за партию → серая, серый бейдж */}
          {inGame && (
            <div className="powerup-group">
              {POWERUPS.map((pu) => {
                const e = engineRef.current;
                const inInventory = powerupInv[pu.id] > 0;
                const remaining = e ? e.getPowerupRemaining(pu.id) : powerupInv[pu.id];
                const isLocked = !inInventory;     // не куплен — тап ведёт в магазин
                const isSpent = inInventory && remaining <= 0; // исчерпан за партию
                const isActive = inInventory && remaining > 0;
                let cls = `powerup-mini powerup-mini-${pu.id}`;
                if (isLocked) cls += ' is-locked';
                else if (isSpent) cls += ' is-spent';
                return (
                  <button
                    key={pu.id}
                    className={cls}
                    onClick={() => {
                      Sound.click();
                      if (isLocked) {
                        // Не куплен — открываем магазин на вкладке бустеров
                        engineRef.current?.pause();
                        setPaused(true);
                        setShowShop(true);
                        return;
                      }
                      if (isSpent || !e) {
                        hapticSelection();
                        return;
                      }
                      let ok = false;
                      if (pu.id === 'extraCharge')   ok = e.applyExtraCharge();
                      if (pu.id === 'boostNext')     ok = e.applyBoostNext();
                      if (pu.id === 'removeBottom')  ok = e.applyRemoveBottom();
                      if (!ok) hapticSelection();
                    }}
                    title={isLocked ? `${pu.title} — купить в магазине` : pu.title}
                  >
                    <PowerUpIcon id={pu.id} />
                    {isActive && <span className="powerup-mini-count">{remaining}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {/* Shake Damage — круглая кнопка с круговым прогрессом и 3 точками */}
          <ShakeDamageButton
            state={bombState}
            onClick={() => engineRef.current?.detonateBomb()}
          />
          {/* Кнопка Settings перенесена в PauseModal — это освобождает
              место в HUD и логичнее: настройки доступны на паузе,
              как в большинстве игр. */}
          <button className="settings-fab hud-pause" onClick={handlePauseClick} aria-label={t('pause.title')}>
            <PauseIcon />
          </button>
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} />
      </div>

      {comboBanner && comboBanner.count >= 2 && (
        <div key={comboBanner.key} className="combo-banner">
          <span className="combo-x">×{comboBanner.count}</span>
          <span className="combo-text">{t('hud.combo')}</span>
        </div>
      )}

      {/* Вспышка экрана при детонации Shake Damage */}
      {shakeFlash > 0 && (
        <div key={shakeFlash} className="shake-damage-flash" />
      )}

      {gameOver && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-title">
              {newRecord ? t('over.record') : t('over.title')}
            </div>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">{t('hud.earned')}</div>
                <div className="stat-value">+{formatMRG(finalEarned)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">{t('over.best')}</div>
                <div className="stat-value">{formatMRG(best)}</div>
              </div>
            </div>
            <div className="total-progress">
              <span className="total-progress-label">{t('hud.balance')}:</span>
              <span className="total-progress-value">{formatMRG(balance)} MRG</span>
            </div>
            <button className="btn-primary" onClick={handleRestart}>
              {t('over.again')}
            </button>
            <button className="btn-secondary" onClick={handleExitToMenu}>
              {t('pause.menu')}
            </button>
          </div>
        </div>
      )}

      {paused && !gameOver && (
        <PauseModal
          onResume={handleResume}
          onRestart={() => { setPaused(false); handleRestart(); }}
          onExit={handleExitToMenu}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {showTutorial && <Tutorial onDone={() => setShowTutorial(false)} />}

      {dailyBonus && (
        <DailyBonusModal
          amount={dailyBonus.amount}
          streak={dailyBonus.streak}
          onClose={() => setDailyBonus(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onWalletDisconnect={handleWalletDisconnect}
        />
      )}
    </>
  );
}

// Хелпер: имя файла для тикера
function spriteFile(ticker: string): string {
  const ext = ['NACKL', 'SHELL', 'NOT', 'SUI', 'MON', 'CORE', 'NEAR'].includes(ticker) ? 'png' : 'svg';
  const fileMap: Record<string, string> = { TRX: 'trx' };
  const base = fileMap[ticker] ?? ticker.toLowerCase();
  return `${base}.${ext}`;
}

/**
 * Shake Damage кнопка в HUD — круглая, с круговым прогрессом charge
 * и тремя точками-индикаторами зарядов сверху.
 */
function ShakeDamageButton({
  state,
  onClick,
}: {
  state: { charge: number; ready: number; used: number; maxUses: number };
  onClick: () => void;
}) {
  const isReady = state.ready > 0;
  // Радиус кругового прогресса
  const R = 18;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - state.charge / 100);

  return (
    <div className="shake-damage-wrap">
      {/* Три точки сверху над кнопкой — индикатор зарядов */}
      <div className="shake-damage-dots">
        {[0, 1, 2].map((i) => {
          let cls = 'idle';
          if (i < state.used) cls = 'spent';
          else if (i < state.used + state.ready) cls = 'active';
          return <div key={i} className={`shake-dot ${cls}`} />;
        })}
      </div>

      {/* Сама круглая кнопка */}
      <button
        className={`shake-damage-btn ${isReady ? 'is-ready' : ''}`}
        disabled={!isReady}
        onClick={onClick}
        aria-label="Shake Damage"
      >
        {/* SVG: круговой прогресс шкалы charge вокруг кнопки */}
        <svg className="shake-damage-progress" viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="shake-progress-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff8830"/>
              <stop offset="50%" stopColor="#ffe060"/>
              <stop offset="100%" stopColor="#ff4030"/>
            </linearGradient>
          </defs>
          {/* Фоновый круг */}
          <circle
            cx="22" cy="22" r={R}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2.5"
          />
          {/* Прогресс — заполняется по часовой стрелке от верха */}
          <circle
            cx="22" cy="22" r={R}
            fill="none"
            stroke="url(#shake-progress-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>

        {/* Пульсирующие кольца когда готов */}
        {isReady && (
          <>
            <span className="shake-damage-ring" />
            <span className="shake-damage-ring shake-damage-ring-2" />
          </>
        )}

        {/* Иконка молнии в центре */}
        <svg className="shake-damage-icon" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <linearGradient id="shake-bolt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff8d0"/>
              <stop offset="40%" stopColor="#ffd040"/>
              <stop offset="100%" stopColor="#ff7020"/>
            </linearGradient>
          </defs>
          <path
            d="M 18 4 L 9 18 L 14 18 L 12 28 L 23 14 L 17 14 L 19 4 Z"
            fill="url(#shake-bolt-grad)"
            stroke="#a04010"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>

        {/* Прогресс заряда виден по круговому индикатору — текстовый процент убран,
            он визуально загромождал кнопку. */}
      </button>
    </div>
  );
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  );
}

/** Иконки бустеров — стиль соответствует Shake Damage кнопке.
 *  removeBottom: корзина, boostNext: стрелка вверх с подложкой,
 *  extraCharge: молния (как Shake Damage). */
function PowerUpIcon({ id }: { id: 'removeBottom' | 'boostNext' | 'extraCharge' }) {
  if (id === 'removeBottom') return (
    <svg className="powerup-pill-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pu-remove-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8080"/>
          <stop offset="100%" stopColor="#c01040"/>
        </linearGradient>
      </defs>
      <path
        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke="url(#pu-remove-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
  if (id === 'boostNext') return (
    <svg className="powerup-pill-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pu-boost-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0ffe0"/>
          <stop offset="100%" stopColor="#10a070"/>
        </linearGradient>
      </defs>
      <path
        d="M12 4 L12 20 M5 11 L12 4 L19 11"
        stroke="url(#pu-boost-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <path d="M5 22 L19 22" stroke="url(#pu-boost-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
  // extraCharge — молния
  return (
    <svg className="powerup-pill-icon" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="pu-bolt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8d0"/>
          <stop offset="50%" stopColor="#ffd040"/>
          <stop offset="100%" stopColor="#ff7020"/>
        </linearGradient>
      </defs>
      <path
        d="M13 2 L4 14 h7 l-2 8 L20 10 h-7 l2-8z"
        fill="url(#pu-bolt-grad)" stroke="#a04010" strokeWidth="0.8" strokeLinejoin="round"
      />
    </svg>
  );
}
