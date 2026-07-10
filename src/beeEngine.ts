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
const MINING_DURATION = 15 * 60 * 1000;
const STORAGE_PREFIX  = 'acki_merge_bee_';
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
  try { localStorage.setItem(STORAGE_PREFIX + data.walletName, JSON.stringify(data)); } catch { /* */ }
}

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

// Сообщения миннера — JSON вида {action, data: {status}, error}
// (формат из официального примера miner-react).
function handleMinerMessage(msg: string): void {
  try {
    const payload = JSON.parse(msg) as { action?: string; data?: { status?: string } | null; error?: string | null };
    if (payload.error) { setMiningStatus('error'); return; }
    const status = payload.data?.status;
    if (payload.action === 'status_updated' && status) {
      if (status === 'computing' || status === 'submitting') setMiningStatus('mining');
      else if (status === 'finished' || status === 'removed') setMiningStatus('idle');
    }
  } catch { /* не-JSON сообщения игнорируем */ }
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
  // При сбое стрима — фоллбэк на стандартную загрузку по URL. Если и она упадёт
  // (сеть недоступна) — ошибка уходит наверх, UI предложит повторить.
  try {
    const resp = await fetch(wasmUrl);
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
      const pct = total > 0
        ? Math.min(99, Math.round((loaded / total) * 100))
        : Math.min(95, Math.round((loaded / (9 * 1024 * 1024)) * 100));
      onProgress?.(pct);
    }
    const merged = new Uint8Array(loaded);
    let off = 0;
    for (const c of chunks) { merged.set(c, off); off += c.length; }
    await __wbg_init({ module_or_path: merged.buffer });
  } catch {
    await __wbg_init({ module_or_path: wasmUrl });
  }
  wasmReady = true;
  onProgress?.(100);
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
  await ensure_mining_keys_propagated({
    client_config: { network: { endpoints: ENDPOINTS } },
    miner_address: minerAddress,
    app_id: APP_ID,
    expected_owner_public: publicKey,
    max_attempts: PROPAGATION_ATTEMPTS,
    interval_ms: 2000,
  });
  assertActive();

  try { miner?.free(); } catch { /* */ }  // освобождаем прежний WASM-Miner перед пересозданием
  miner = await Miner.new(ENDPOINTS, APP_ID, minerAddress, publicKey, secretKey);
  miner.add_tap(0, 0);
  setMiningStatus('idle');

  saveKeys({ walletName, publicKey, secretKey, minerAddress });
  clearPendingMining();
  return walletName;
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
  await ensure_mining_keys_propagated({
    client_config: { network: { endpoints: ENDPOINTS } },
    miner_address: minerAddress,
    app_id: APP_ID,
    expected_owner_public: pending.publicKey,
    max_attempts: 30,
    interval_ms: 2000,
  });
  try { miner?.free(); } catch { /* */ }
  miner = await Miner.new(ENDPOINTS, APP_ID, minerAddress, pending.publicKey, pending.secretKey);
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
  setMiningStatus('idle');
  return true;
}

export function startMining(onEvent?: (msg: string) => void): void {
  if (!miner || !miner.can_start()) return;
  miner.start(MINING_DURATION, (msg: string) => {
    handleMinerMessage(msg);
    if (onEvent) onEvent(msg);
  });
  setMiningStatus('mining');
}

export function addTap(x: number, y: number): void {
  miner?.add_tap(x, y);
}

export function stopMining(): void {
  miner?.stop();
  if (miner) setMiningStatus('idle');
}

export function isMinerReady(): boolean {
  return miner !== null;
}

export function disconnectBee(walletName: string): void {
  try { localStorage.removeItem(STORAGE_PREFIX + walletName); } catch { /* */ }
  clearPendingMining();
  cancelConnectSession();
  miner?.free();
  miner = null;
  setMiningStatus('off');
}
