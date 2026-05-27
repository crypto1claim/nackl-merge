// ============================================================
// Acki Nacki Wallet — модуль подключения.
//
// Сейчас это симуляция: фейковая задержка, фейковый адрес.
// Когда GOSH откроет реальный Bee Engine SDK — заменишь
// внутренности функций. Интерфейс снаружи (connect/disconnect/
// getState) не изменится — UI ломаться не будет.
// ============================================================

export interface WalletState {
  connected: boolean;
  address: string | null;
  // В будущем: balance, nackl, mining rate и т.д.
}

const STORAGE_KEY = 'acki_merge_wallet';

// Чтение сохранённого состояния
export function getStoredWallet(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { connected: false, address: null };
}

// Сохранение
function saveWallet(state: WalletState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}

// ============================================================
// Подключение. Возвращает финальное состояние.
//
// Сейчас: ждём 1.2 сек (имитация рукопожатия с кошельком) и
// возвращаем фейковый адрес.
//
// Будет: вызов реального SDK, например:
//   const result = await beeWallet.connect({ appId: DAPP_ID });
//   return { connected: true, address: result.address };
// ============================================================
export async function connectWallet(): Promise<WalletState> {
  // Симулируем латентность настоящего рукопожатия
  await new Promise((r) => setTimeout(r, 1200));

  // Генерим фейковый адрес в стиле Acki Nacki (TVM-формат: 0:... )
  const hex = '0123456789abcdef';
  let addr = '0:';
  for (let i = 0; i < 64; i++) addr += hex[Math.floor(Math.random() * 16)];

  const state: WalletState = { connected: true, address: addr };
  saveWallet(state);
  return state;
}

export function disconnectWallet(): WalletState {
  const state: WalletState = { connected: false, address: null };
  saveWallet(state);
  return state;
}

// Утилита: красиво обрезанный адрес для UI ("0:abcd...wxyz")
export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
