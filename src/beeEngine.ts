// ============================================================
// Bee Engine SDK — интеграция для Acki Merge
// DApp ID: 0x0000000000000000000000000000000000000000000000000000000000000018
// ============================================================

import __wbg_init, {
  Miner,
  gen_mining_keys,
  get_miner_address_by_wallet_name,
  ensure_mining_keys_propagated,
  type ResultOfGenMiningKeys,
} from '@teamgosh/bee-sdk';

export const APP_ID   = '0x0000000000000000000000000000000000000000000000000000000000000018';
// ВАЖНО: схему https:// указывать обязательно. Без неё SDK строит запрос на
// http://mainnet.ackinacki.org:8600 — этот адрес недоступен из браузера и
// блокируется как mixed-content на https-деплое (Vercel) → кошелёк не подключается.
const ENDPOINTS       = ['https://mainnet.ackinacki.org'];
const MINING_DURATION = 15 * 60 * 1000;
const STORAGE_PREFIX  = 'acki_merge_bee_';

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
let pendingKeys: ResultOfGenMiningKeys | null = null;
let pendingMinerAddress: string | null = null;

export async function initBeeEngine(onProgress?: (pct: number) => void): Promise<void> {
  if (wasmReady) return;
  // WASM ~7.7 МБ — на мобильной сети это заметная пауза. Грузим вручную через
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
        : Math.min(95, Math.round((loaded / (8 * 1024 * 1024)) * 100));
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

export async function authorize(walletName: string): Promise<{ deepLink: string | null; alreadyAuthorized: boolean }> {
  if (!wasmReady) await initBeeEngine();

  const stored = loadKeys(walletName);
  if (stored) {
    miner = await Miner.new(ENDPOINTS, APP_ID, stored.minerAddress, stored.publicKey, stored.secretKey);
    return { deepLink: null, alreadyAuthorized: true };
  }

  pendingMinerAddress = await get_miner_address_by_wallet_name({
    client_config: { network: { endpoints: ENDPOINTS } },
    wallet_name: walletName,
  });

  pendingKeys = await gen_mining_keys(APP_ID);
  return { deepLink: pendingKeys.deep_link, alreadyAuthorized: false };
}

export async function waitForAuthorization(walletName: string, maxAttempts = 30): Promise<void> {
  if (!pendingKeys || !pendingMinerAddress) throw new Error('Сначала вызови authorize()');

  await ensure_mining_keys_propagated({
    client_config: { network: { endpoints: ENDPOINTS } },
    miner_address: pendingMinerAddress,
    app_id: APP_ID,
    expected_owner_public: pendingKeys.public,
    max_attempts: maxAttempts,
    interval_ms: 1000,
  });

  miner = await Miner.new(ENDPOINTS, APP_ID, pendingMinerAddress, pendingKeys.public, pendingKeys.secret);
  miner.add_tap(0, 0);

  saveKeys({ walletName, publicKey: pendingKeys.public, secretKey: pendingKeys.secret, minerAddress: pendingMinerAddress });
  pendingKeys = null;
  pendingMinerAddress = null;
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
  miner?.free();
  miner = null;
}
