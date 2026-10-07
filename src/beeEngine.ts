// ============================================================
// Bee Engine SDK v3 — интеграция для Acki Merge
// DApp ID: 0x0000000000000000000000000000000000000000000000000000000000000018
//
// Подключение кошелька — сессионный протокол BeeConnect (v3), как в
// официальном примере gosh-sh/bee-engine/examples/javascript/miner-react:
//   1. create_shared_key_session → диплинк/QR для AN Wallet
//   2. wait_wallet_hello — кошелёк открывает ссылку, подтверждает, шлёт hello
//      (имя кошелька приходит от кошелька — игрок его больше не вводит)
//   3. request_set_mining_keys — запрос регистрации майнинг-ключей
//   4. ensure_mining_keys_propagated → Miner.new → майнинг
// Старый флоу (ввод имени + диплинк с pubkey) актуальные версии AN Wallet
// больше не обрабатывают — кошелёк открывался без окна подтверждения.
// ============================================================

import __wbg_init, {
  BeeConnect,
  Miner,
  gen_mining_keys,
  get_miner_address_by_wallet_name,
  ensure_mining_keys_propagated,
} from '@teamgosh/bee-sdk';
// WASM через Vite (?url): в прод-сборке получает контент-хэш в имени файла,
// поэтому годовой immutable-кэш (vercel.json) безопасен — при апгрейде SDK
// URL меняется сам. Руками копировать wasm в public/ больше НЕ нужно
// (раньше файл лежал в public/ под фиксированным именем, и после апгрейда
// SDK игроки получали из кэша старый несовместимый движок).
import wasmUrl from '@teamgosh/bee-sdk/bee_sdk_bg.wasm?url';

export const APP_ID   = '0x0000000000000000000000000000000000000000000000000000000000000018';
// ВАЖНО: схему https:// указывать обязательно. Без неё SDK строит запрос на
// http://mainnet.ackinacki.org:8600 — этот адрес недоступен из браузера и
// блокируется как mixed-content на https-деплое (Vercel) → кошелёк не подключается.
const ENDPOINTS       = ['https://mainnet.ackinacki.org'];
// Пуш-бэкенд Acki Nacki: fire-and-forget уведомление, чтобы кошелёк быстрее
// заметил запрос майнинг-ключей (без него кошелёк тоже увидит запрос — поллингом).
// URL взят из официального примера miner-react.
const PUSH_API_URL    = 'https://app-backend-dev.ackinacki.org/api';
// Длительность одной сессии майнинга = сетевая эпоха Acki Nacki (~330с).
// Доказательство отправляется в сеть по завершении сессии, поэтому держим
// её короткой и согласованной с эпохой — иначе вклады копятся локально, но
// на блокчейн не уходят (confirmed taps = 0). «Хранитель сессии» ниже
// перезапускает следующую сессию, пока майнер жив.
const MINING_DURATION = 330 * 1000;
const STORAGE_PREFIX  = 'acki_merge_bee_';
// Бесплатная раздача движка через jsDelivr (файл публично лежит в npm).
// ⚠️ При апгрейде @teamgosh/bee-sdk обнови ВЕРСИЮ в URL и ХЭШ:
//    sha256sum node_modules/@teamgosh/bee-sdk/bee_sdk_bg.wasm
const CDN_WASM_URL = 'https://cdn.jsdelivr.net/npm/@teamgosh/bee-sdk@5.1.1/bee_sdk_bg.wasm';
const WASM_SHA256  = 'deb6f6ea9278f82fab58ed9167adb3cbf3644ecb73a5f7b71acac227a6797e95';
const SESSION_TTL_SECS = 600;          // сколько живёт сессия подключения
const HELLO_ATTEMPTS   = 150;          // ~2.5 мин на «открыл кошелёк и подтвердил»
const PROPAGATION_ATTEMPTS = 120;      // ~4 мин на он-чейн распространение ключей

interface StoredKeys {
  publicKey: string;
  secretKey: string;
  minerAddress: string;
  walletName: string;
}

function loadKeys(walletName: string): StoredKeys | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + walletName);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveKeys(data: StoredKeys) {
  currentWallet = data.walletName;
  try { localStorage.setItem(STORAGE_PREFIX + data.walletName, JSON.stringify(data)); } catch { /* */ }
}

// Имя подключённого кошелька — нужно для пересоздания майнера после сбоя
// отправки (загружаем ключи из localStorage по этому имени).
let currentWallet: string | null = null;

// Прогресс регистрации майнинг-ключей персистится: iOS замораживает webview,
// пока игрок подтверждает в кошельке, и ожидание в игре обрывается сетевой
// ошибкой — хотя кошелёк всё подтвердил. Ключи и флаг «запрос уже отправлен»
// позволяют продолжить с места обрыва (доп-проверка он-чейн) без новых окон
// подтверждения в кошельке — и даже после полной перезагрузки страницы.
interface PendingMining {
  walletName: string;
  publicKey: string;
  secretKey: string;
  requested: boolean;
}

const PENDING_MINING_KEY = STORAGE_PREFIX + 'pending_mining';

function loadPendingMining(): PendingMining | null {
  try {
    const raw = localStorage.getItem(PENDING_MINING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePendingMining(p: PendingMining) {
  try { localStorage.setItem(PENDING_MINING_KEY, JSON.stringify(p)); } catch { /* */ }
}

export function clearPendingMining(): void {
  try { localStorage.removeItem(PENDING_MINING_KEY); } catch { /* */ }
}

// ── Живой статус майнинга (для индикатора в HUD) ──────────────
// off    — майнер не создан (кошелёк не подключён)
// idle   — майнер есть, но сессия майнинга не идёт (истекла/остановлена)
// mining — сессия активна (SDK шлёт computing/submitting)
// error  — миннер упал (SDK прислал error) — лечится ensureMining/переподключением
export type MiningStatus = 'off' | 'idle' | 'mining' | 'error';

let miningStatus: MiningStatus = 'off';
const miningStatusSubs = new Set<(s: MiningStatus) => void>();

function setMiningStatus(s: MiningStatus): void {
  if (miningStatus === s) return;
  miningStatus = s;
  miningStatusSubs.forEach((cb) => { try { cb(s); } catch { /* */ } });
}

/** Подписка на статус майнинга. Сразу вызывает cb с текущим значением. */
export function subscribeMiningStatus(cb: (s: MiningStatus) => void): () => void {
  miningStatusSubs.add(cb);
  try { cb(miningStatus); } catch { /* */ }
  return () => { miningStatusSubs.delete(cb); };
}

export function getMiningStatus(): MiningStatus {
  return miningStatus;
}

// ── Живой счётчик тапов + диагностика майнинга ───────────────
// tap_sum — всего зачтённых вкладов за эпоху (накопительно, только растёт);
// tap_sum_5m — за текущее 5-мин окно. Для HUD показываем накопительный tap_sum.
let tapSum = 0;
let tapSum5m = 0;
let localTaps = 0;              // сколько add_tap() вызвала игра (клиентская сторона)
let lastMinerMsg = '';          // последнее сырое сообщение от SDK-миннера
let lastMinerError = '';        // последняя ошибка миннера
let lastPollError = '';         // последняя ошибка get_miner_data
const tapSubs = new Set<(taps: number) => void>();
let tapPollTimer: number | null = null;

export interface MiningDebug {
  status: MiningStatus;
  tapSum: number;
  tapSum5m: number;
  localTaps: number;
  lastMsg: string;
  lastError: string;
  pollError: string;
}
export function getMiningDebug(): MiningDebug {
  return {
    status: miningStatus, tapSum, tapSum5m, localTaps,
    lastMsg: lastMinerMsg.slice(0, 200),
    lastError: lastMinerError.slice(0, 200),
    pollError: lastPollError.slice(0, 200),
  };
}

function setTapSum(total: number, win: number): void {
  tapSum5m = win;
  if (tapSum === total) return;
  tapSum = total;
  tapSubs.forEach((cb) => { try { cb(total); } catch { /* */ } });
}

export function subscribeMiningTaps(cb: (taps: number) => void): () => void {
  tapSubs.add(cb);
  try { cb(tapSum); } catch { /* */ }
  return () => { tapSubs.delete(cb); };
}

function startTapPoll(): void {
  if (tapPollTimer !== null) return;
  const poll = async () => {
    if (!miner) { stopTapPoll(); return; }
    try {
      const data = await miner.get_miner_data();
      const total = Number(data.tap_sum ?? 0n);
      const win = Number(data.tap_sum_5m ?? 0n);
      try { data.free?.(); } catch { /* */ }
      lastPollError = '';
      setTapSum(Number.isFinite(total) ? total : 0, Number.isFinite(win) ? win : 0);
    } catch (e) {
      lastPollError = String((e as any)?.message ?? e);
    }
  };
  void poll();
  tapPollTimer = window.setInterval(poll, 5000);
}

function stopTapPoll(): void {
  if (tapPollTimer !== null) { clearInterval(tapPollTimer); tapPollTimer = null; }
}

// Сообщения миннера — JSON вида {action, data: {status}, error}
// (формат из официального примера miner-react).
function handleMinerMessage(msg: string): void {
  lastMinerMsg = msg;
  try {
    const payload = JSON.parse(msg) as { action?: string; data?: { status?: string } | null; error?: string | null };
    if (payload.error) {
      lastMinerError = String(payload.error);
      // Отказ отправки корня сессии / порча инстанса — ИЗВЕСТНОЕ явление на
      // загруженном mainnet (Bee Engine). Он портит майнер (miner_state_corrupted)
      // и расходует seed; can_start() становится false, и майнинг заклинивает
      // навсегда. Лечение (как в десктоп-майнере Dastic): пересоздать майнер из
      // актуального состояния контракта и начать новую сессию. НЕ оставляем
      // статус 'error' навсегда — запускаем восстановление.
      void recoverMiner();
      return;
    }
    const status = payload.data?.status;
    if (payload.action === 'status_updated' && status) {
      if (status === 'computing' || status === 'submitting') setMiningStatus('mining');
      else if (status === 'finished' || status === 'removed') setMiningStatus('idle');
    }
  } catch { /* не-JSON сообщения игнорируем */ }
}

// Пересоздание майнера после сбоя отправки. Бэкофф: сбои нормальны на busy
// mainnet, поэтому восстанавливаемся не чаще раза в 12с, чтобы не долбить сеть.
let recoverInFlight = false;
let lastRecoverAt = 0;

async function recoverMiner(): Promise<void> {
  if (recoverInFlight) return;
  const now = Date.now();
  if (now - lastRecoverAt < 12000) return;
  recoverInFlight = true;
  lastRecoverAt = now;
  setMiningStatus('error');          // кратковременно: идёт пересоздание
  try {
    const wname = currentWallet;
    const stored = wname ? loadKeys(wname) : null;
    if (!stored) return;
    try { miner?.free(); } catch { /* */ }
    // Свежий инстанс из сохранённых ключей = чистая очередь seed'ов.
    miner = await Miner.new(ENDPOINTS, APP_ID, stored.minerAddress, stored.publicKey, stored.secretKey);
    beginSession();                  // сразу новая сессия (can_start снова true)
  } catch {
    // Сеть недоступна — session keeper/ещё одно сообщение об ошибке
    // попробуют восстановить позже.
  } finally {
    recoverInFlight = false;
  }
}

let wasmReady = false;
let miner: Miner | null = null;
let connect: BeeConnect | null = null;

// Активная сессия подключения (существует только пока открыта страница —
// TTL короткий, после перезагрузки игрок просто начинает подключение заново).
interface ConnectSession {
  sessionId: string;
  description: string;
  clientDhSecret: string;
  createdAt: bigint;
  deepLink: string;
}
let session: ConnectSession | null = null;
// Токен отмены: инкремент инвалидирует результаты уже запущенных ожиданий.
let connectEpoch = 0;

export async function initBeeEngine(onProgress?: (pct: number) => void): Promise<void> {
  if (wasmReady) return;
  // WASM ~8.5 МБ — на мобильной сети это заметная пауза. Грузим вручную через
  // fetch со стримом, чтобы показать прогресс, и передаём готовые байты в init.
  //
  // Экономия трафика Vercel (бесплатный тариф — 100 ГБ/мес, движок — 80%
  // веса игры): сначала пробуем бесплатный CDN jsDelivr, который раздаёт
  // файл прямо из npm-пакета SDK. Байты с CDN проверяются по SHA-256 —
  // чужому CDN не доверяем вслепую. При любом сбое (сеть/404/битый хэш) —
  // фолбэк на собственный домен (тот же файл, собранный Vite).
  try {
    let bytes: ArrayBuffer | null = null;
    try {
      bytes = await fetchWasmBytes(CDN_WASM_URL, onProgress);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
      if (hex !== WASM_SHA256) throw new Error('WASM checksum mismatch');
    } catch {
      bytes = await fetchWasmBytes(wasmUrl, onProgress);
    }
    await __wbg_init({ module_or_path: bytes });
  } catch {
    await __wbg_init({ module_or_path: wasmUrl });
  }
  wasmReady = true;
  onProgress?.(100);
}

async function fetchWasmBytes(url: string, onProgress?: (pct: number) => void): Promise<ArrayBuffer> {
  const resp = await fetch(url);
  if (!resp.ok || !resp.body) throw new Error(`WASM HTTP ${resp.status}`);
  const total = Number(resp.headers.get('Content-Length')) || 0;
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    loaded += value.length;
    // С CDN Content-Length может быть размером СЖАТОГО файла (gzip/brotli),
    // а loaded считает распакованные байты — поэтому жёсткий потолок 99%.
    const pct = total > 0
      ? Math.min(99, Math.round((loaded / total) * 100))
      : Math.min(95, Math.round((loaded / (9 * 1024 * 1024)) * 100));
    onProgress?.(pct);
  }
  const merged = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return merged.buffer;
}

/**
 * Шаг 1: создаёт сессию подключения и возвращает диплинк для AN Wallet
 * (его же показываем как QR). Дальше вызывается waitWalletAndSetupMining().
 */
export async function startConnectSession(onProgress?: (pct: number) => void): Promise<string> {
  if (!wasmReady) await initBeeEngine(onProgress);
  connectEpoch++;
  connect ??= new BeeConnect();
  const s = connect.create_shared_key_session(APP_ID, SESSION_TTL_SECS, null);
  session = {
    sessionId: s.session_id,
    description: s.description,
    clientDhSecret: s.client_dh_secret,
    createdAt: s.created_at,
    deepLink: s.deep_link,
  };
  try { s.free(); } catch { /* */ }
  return session.deepLink;
}

export type ConnectStage = 'waiting_hello' | 'confirm_mining' | 'propagating';

/**
 * Шаг 2: ждёт подтверждение сессии кошельком (wallet_hello), затем
 * регистрирует майнинг-ключи и создаёт майнер. Возвращает имя кошелька.
 * Бросает исключение при таймауте/отмене — UI показывает ошибку и ретрай.
 */
export async function waitWalletAndSetupMining(
  onStage?: (stage: ConnectStage, walletName?: string) => void,
): Promise<string> {
  if (!connect || !session) throw new Error('Сначала вызови startConnectSession()');
  const s = session;
  const epoch = connectEpoch;
  const assertActive = () => {
    if (epoch !== connectEpoch) throw new Error('cancelled');
  };

  try {
    return await doWalletSetup(s, epoch, assertActive, onStage);
  } catch (e) {
    // Игрок нажал «Отмена» пока ожидание висело — любая ошибка этой
    // попытки (в т.ч. таймаут) не должна показываться как новая проблема.
    if (epoch !== connectEpoch) throw new Error('cancelled');
    throw e;
  }
}

async function doWalletSetup(
  s: ConnectSession,
  _epoch: number,
  assertActive: () => void,
  onStage?: (stage: ConnectStage, walletName?: string) => void,
): Promise<string> {
  if (!connect) throw new Error('Сначала вызови startConnectSession()');
  onStage?.('waiting_hello');
  const hello = await connect.wait_wallet_hello(
    ENDPOINTS, s.sessionId, s.description, s.clientDhSecret, s.createdAt,
    HELLO_ATTEMPTS, 1000,
  );
  assertActive();
  const walletName = hello.wallet_name;
  let sessionState = hello.session_state_json;

  // Ключи для этого кошелька уже есть с прошлого подключения — второе
  // подтверждение в кошельке не нужно, сразу поднимаем майнер.
  const stored = loadKeys(walletName);
  if (stored) {
    try { miner?.free(); } catch { /* */ }
    miner = await Miner.new(ENDPOINTS, APP_ID, stored.minerAddress, stored.publicKey, stored.secretKey);
    currentWallet = walletName;
    setMiningStatus('idle');
    assertActive();
    return walletName;
  }

  // Прошлая попытка оборвалась ПОСЛЕ отправки запроса ключей (игрок уже
  // подтвердил его в кошельке) — не запрашиваем заново (иначе лишнее окно
  // в кошельке), сразу переходим к проверке он-чейн регистрации.
  const pending = loadPendingMining();
  let publicKey: string;
  let secretKey: string;
  if (pending && pending.walletName === walletName && pending.requested) {
    publicKey = pending.publicKey;
    secretKey = pending.secretKey;
  } else {
    onStage?.('confirm_mining', walletName);
    const keys = await gen_mining_keys(APP_ID);
    publicKey = keys.public;
    secretKey = keys.secret;
    savePendingMining({ walletName, publicKey, secretKey, requested: false });
    const req = await connect.request_set_mining_keys(
      ENDPOINTS, s.sessionId, s.description, sessionState, APP_ID, publicKey,
      30, 1000,
    );
    savePendingMining({ walletName, publicKey, secretKey, requested: true });
    assertActive();
    sessionState = req.updated_session_state_json || sessionState;

    // Пуш кошельку, чтобы он сразу показал запрос (не критично при сбое).
    try {
      fetch(`${PUSH_API_URL}/v1/push/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_address: hello.wallet_address,
          kind: 'connect_set_mining_keys',
          request_id: crypto.randomUUID(),
          origin_name: window.location.hostname,
        }),
      }).catch(() => { /* */ });
    } catch { /* */ }
  }

  onStage?.('propagating', walletName);
  const minerAddress = await get_miner_address_by_wallet_name({
    client_config: { network: { endpoints: ENDPOINTS } },
    wallet_name: walletName,
  });

  const built = await waitMinerReady(minerAddress, publicKey, secretKey, assertActive);
  try { miner?.free(); } catch { /* */ }  // освобождаем прежний WASM-Miner перед пересозданием
  miner = built;
  miner.add_tap(0, 0);
  setMiningStatus('idle');

  saveKeys({ walletName, publicKey, secretKey, minerAddress });
  clearPendingMining();
  return walletName;
}

/**
 * Ждёт готовности майнера и возвращает рабочий Miner. Кошелёк уже подтвердил
 * ключи — осталась он-чейн регистрация. Вместо слепого ожидания подтверждения
 * (до нескольких минут) мы НАПРЯМУЮ пробуем поднять майнер: как только он
 * строится и `can_start()` = true, ключи на месте и подключение успешно.
 * Это и быстрее (не ждём лишнего, если ключи уже видны), и надёжнее
 * (проверяем ровно то, что нужно для майнинга, а не косвенный индикатор).
 * Параллельно крутим ensure_mining_keys_propagated как ранний сигнал.
 */
async function waitMinerReady(
  minerAddress: string,
  publicKey: string,
  secretKey: string,
  assertActive: () => void,
): Promise<Miner> {
  // Ранний сигнал: как только сеть подтвердит распространение ключей —
  // промис резолвится, и следующая проба Miner.new точно удастся.
  let propagated = false;
  ensure_mining_keys_propagated({
    client_config: { network: { endpoints: ENDPOINTS } },
    miner_address: minerAddress,
    app_id: APP_ID,
    expected_owner_public: publicKey,
    max_attempts: PROPAGATION_ATTEMPTS,
    interval_ms: 2000,
  }).then(() => { propagated = true; }).catch(() => { /* пробуем билдом ниже */ });

  let lastErr: unknown = null;
  // ~2.5 мин проб (как и обещает UI «минуту-две» + запас)
  for (let attempt = 0; attempt < 50; attempt++) {
    assertActive();
    try {
      const m = await Miner.new(ENDPOINTS, APP_ID, minerAddress, publicKey, secretKey);
      // Майнер построился И может стартовать → ключи зарегистрированы.
      if (m.can_start()) return m;
      // Построился, но пока не может — значит распространение подтверждено
      // сетью (propagated) или вот-вот: отдаём как есть, startMining проверит
      // can_start повторно (сессия поднимется, когда сеть будет готова).
      if (propagated) return m;
      try { m.free(); } catch { /* */ }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw lastErr ?? new Error('mining keys propagation timeout');
}

/**
 * Возобновление оборванной регистрации майнинг-ключей после перезагрузки
 * страницы: запрос уже подтверждён игроком в кошельке, осталось дождаться
 * он-чейн распространения и поднять майнер. null — возобновлять нечего.
 */
export async function resumePendingMining(): Promise<string | null> {
  const pending = loadPendingMining();
  if (!pending || !pending.requested) return null;
  if (!wasmReady) await initBeeEngine();
  const minerAddress = await get_miner_address_by_wallet_name({
    client_config: { network: { endpoints: ENDPOINTS } },
    wallet_name: pending.walletName,
  });
  // Та же оптимистичная проба, что и в основном флоу: поднимаем майнер,
  // как только ключи видны, не ожидая слепо полного подтверждения.
  try { miner?.free(); } catch { /* */ }
  miner = await waitMinerReady(minerAddress, pending.publicKey, pending.secretKey, () => {});
  setMiningStatus('idle');
  saveKeys({
    walletName: pending.walletName,
    publicKey: pending.publicKey,
    secretKey: pending.secretKey,
    minerAddress,
  });
  clearPendingMining();
  return pending.walletName;
}

/** Отмена текущей попытки подключения (результаты ожиданий игнорируются). */
export function cancelConnectSession(): void {
  connectEpoch++;
  session = null;
}

/**
 * Пересоздаёт майнер из сохранённых ключей после перезагрузки страницы.
 * localStorage помнит «подключено», но WASM-Miner живёт только в памяти —
 * без этого вызова майнинг после перезагрузки молча не работал.
 * Возвращает false, если сохранённых ключей нет (нужна полная авторизация).
 */
export async function restoreMiner(walletName: string): Promise<boolean> {
  const stored = loadKeys(walletName);
  if (!stored) return false;
  if (!wasmReady) await initBeeEngine();
  try { miner?.free(); } catch { /* */ }
  miner = await Miner.new(ENDPOINTS, APP_ID, stored.minerAddress, stored.publicKey, stored.secretKey);
  currentWallet = walletName;
  setMiningStatus('idle');
  return true;
}

let minerEventCb: ((msg: string) => void) | undefined;

/** Запускает одну сессию майнинга, если майнер свободен (can_start). */
function beginSession(): boolean {
  if (!miner || !miner.can_start()) return false;
  miner.start(MINING_DURATION, (msg: string) => {
    handleMinerMessage(msg);
    if (minerEventCb) minerEventCb(msg);
  });
  setMiningStatus('mining');
  return true;
}

// «Хранитель сессии»: сессия майнинга длится MINING_DURATION и по истечении
// завершается (доказательство уходит в сеть). SDK НЕ всегда присылает сигнал
// 'finished', поэтому вместо того чтобы полагаться только на статус, мы
// периодически проверяем can_start() — если майнер снова свободен, значит
// прошлая сессия закрылась (вклады отправлены), и запускаем следующую.
// Без этого одна 15-мин сессия никогда не завершалась и ничего не отправляла.
const SESSION_KEEP_INTERVAL = 20 * 1000;
let sessionKeeperTimer: number | null = null;

function startSessionKeeper(): void {
  if (sessionKeeperTimer !== null) return;
  sessionKeeperTimer = window.setInterval(() => {
    if (!miner) { stopSessionKeeper(); return; }
    let startable = false;
    try { startable = miner.can_start(); } catch { /* */ }
    if (startable) {
      // Сессия завершилась (вклады отправлены) → начинаем новую.
      beginSession();
    } else if (miningStatus === 'error') {
      // Майнер заклинило после сбоя отправки (can_start=false, seed-очередь
      // пуста) — пересоздаём из состояния контракта (с бэкоффом внутри).
      void recoverMiner();
    }
  }, SESSION_KEEP_INTERVAL);
}

function stopSessionKeeper(): void {
  if (sessionKeeperTimer !== null) { clearInterval(sessionKeeperTimer); sessionKeeperTimer = null; }
}

export function startMining(onEvent?: (msg: string) => void): void {
  if (!miner) return;
  minerEventCb = onEvent;
  beginSession();
  startRewardClaimLoop();
  startTapPoll();
  startSessionKeeper();
}

// Клейм намайненной награды. В официальном примере Acki Nacki это ОТДЕЛЬНЫЙ
// шаг (miner.get_reward()): start() накапливает вклад и шлёт доказательства,
// но начисленный NACKL надо забрать в кошелёк — без get_reward награда
// «висит» неполученной. Клеймим периодически, пока идёт майнинг.
const REWARD_CLAIM_INTERVAL = 90 * 1000;
let rewardClaimTimer: number | null = null;
let claimInFlight = false;

async function claimReward(): Promise<void> {
  if (!miner || claimInFlight) return;
  claimInFlight = true;
  try {
    await miner.get_reward();
  } catch {
    // Нечего клеймить / сеть недоступна — не критично, попробуем в следующий раз.
  } finally {
    claimInFlight = false;
  }
}

function startRewardClaimLoop(): void {
  if (rewardClaimTimer !== null) return;
  rewardClaimTimer = window.setInterval(() => {
    if (miner) void claimReward();
    else stopRewardClaimLoop();
  }, REWARD_CLAIM_INTERVAL);
}

function stopRewardClaimLoop(): void {
  if (rewardClaimTimer !== null) {
    clearInterval(rewardClaimTimer);
    rewardClaimTimer = null;
  }
}

/** Забрать награду немедленно (напр. при выходе из партии). Тихо, без ошибок. */
export async function claimRewardNow(): Promise<void> {
  await claimReward();
}

export function addTap(x: number, y: number): void {
  if (!miner) return;
  miner.add_tap(x, y);
  localTaps++;
}

export function stopMining(): void {
  miner?.stop();
  stopRewardClaimLoop();
  stopTapPoll();
  stopSessionKeeper();
  // Финальный клейм при остановке сессии — не терять последний вклад.
  void claimReward();
  if (miner) setMiningStatus('idle');
}

export function isMinerReady(): boolean {
  return miner !== null;
}

export function disconnectBee(walletName: string): void {
  try { localStorage.removeItem(STORAGE_PREFIX + walletName); } catch { /* */ }
  clearPendingMining();
  cancelConnectSession();
  stopRewardClaimLoop();
  stopTapPoll();
  stopSessionKeeper();
  setTapSum(0, 0);
  localTaps = 0;
  miner?.free();
  miner = null;
  setMiningStatus('off');
}
