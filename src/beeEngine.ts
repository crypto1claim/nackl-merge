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
    const resp = await fetch('/bee_sdk_bg.wasm');
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
    await __wbg_init({ module_or_path: '/bee_sdk_bg.wasm' });
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
    assertActive();
    return walletName;
  }

  onStage?.('confirm_mining', walletName);
  const keys = await gen_mining_keys(APP_ID);
  const req = await connect.request_set_mining_keys(
    ENDPOINTS, s.sessionId, s.description, sessionState, APP_ID, keys.public,
    30, 1000,
  );
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

  onStage?.('propagating', walletName);
  const minerAddress = await get_miner_address_by_wallet_name({
    client_config: { network: { endpoints: ENDPOINTS } },
    wallet_name: walletName,
  });
  await ensure_mining_keys_propagated({
    client_config: { network: { endpoints: ENDPOINTS } },
    miner_address: minerAddress,
    app_id: APP_ID,
    expected_owner_public: keys.public,
    max_attempts: PROPAGATION_ATTEMPTS,
    interval_ms: 2000,
  });
  assertActive();

  try { miner?.free(); } catch { /* */ }  // освобождаем прежний WASM-Miner перед пересозданием
  miner = await Miner.new(ENDPOINTS, APP_ID, minerAddress, keys.public, keys.secret);
  miner.add_tap(0, 0);

  saveKeys({ walletName, publicKey: keys.public, secretKey: keys.secret, minerAddress });
  return walletName;
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
  return true;
}

export function startMining(onEvent?: (msg: string) => void): void {
  if (!miner || !miner.can_start()) return;
  miner.start(MINING_DURATION, (msg: string) => { if (onEvent) onEvent(msg); });
}

export function addTap(x: number, y: number): void {
  miner?.add_tap(x, y);
}

export function stopMining(): void {
  miner?.stop();
}

export function isMinerReady(): boolean {
  return miner !== null;
}

export function disconnectBee(walletName: string): void {
  try { localStorage.removeItem(STORAGE_PREFIX + walletName); } catch { /* */ }
  cancelConnectSession();
  miner?.free();
  miner = null;
}
