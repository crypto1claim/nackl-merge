// ============================================================
// Acki Nacki Wallet — интеграция через Bee Engine SDK v3 (BeeConnect)
// Имя кошелька игрок больше не вводит — оно приходит от кошелька
// в wallet_hello после подтверждения сессии.
// ============================================================

import {
  startConnectSession, waitWalletAndSetupMining, cancelConnectSession,
  startMining, disconnectBee, isMinerReady, restoreMiner, resumePendingMining,
  type ConnectStage,
} from './beeEngine';

export type { ConnectStage };

export interface WalletState {
  connected: boolean;
  address: string | null;
  minerReady: boolean;
  pendingDeepLink: string | null;
}

const STORAGE_KEY = 'acki_merge_wallet_v2';

export function getStoredWallet(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { connected: false, address: null, minerReady: false, pendingDeepLink: null };
}

function saveWallet(state: WalletState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}

/**
 * Шаг 1 подключения: создаёт сессию BeeConnect и возвращает диплинк
 * (для кнопки «Открыть AN Wallet» и QR-кода).
 */
export async function startConnect(onProgress?: (pct: number) => void): Promise<string> {
  return startConnectSession(onProgress);
}

/**
 * Шаг 2: ждёт подтверждение в кошельке, регистрирует майнинг-ключи,
 * запускает майнинг. Состояние сохраняется ТОЛЬКО после полного успеха.
 */
export async function completeConnect(
  onStage?: (stage: ConnectStage, walletName?: string) => void,
): Promise<WalletState> {
  const walletName = await waitWalletAndSetupMining(onStage);
  startMining();
  const state: WalletState = { connected: true, address: walletName, minerReady: true, pendingDeepLink: null };
  saveWallet(state);
  return state;
}

/** Отмена текущей попытки подключения. */
export function cancelConnect(): void {
  cancelConnectSession();
}

/**
 * Тихое восстановление майнинга после перезагрузки страницы: localStorage
 * помнит «подключено», но WASM-Miner живёт только в памяти. Вызывается при
 * старте приложения; не трогает состояние, если ключей нет.
 */
export async function resumeWallet(): Promise<boolean> {
  const stored = getStoredWallet();
  if (!stored.connected || !stored.minerReady || !stored.address) return false;
  const ok = await restoreMiner(stored.address);
  if (ok) startMining();
  return ok;
}

/**
 * Довершение подключения, оборванного перезагрузкой страницы: игрок уже
 * подтвердил майнинг-ключи в кошельке, осталась он-чейн проверка.
 * null — довершать нечего (обычный старт).
 */
export async function resumePendingConnect(): Promise<WalletState | null> {
  const walletName = await resumePendingMining();
  if (!walletName) return null;
  startMining();
  const state: WalletState = { connected: true, address: walletName, minerReady: true, pendingDeepLink: null };
  saveWallet(state);
  return state;
}

export function disconnectWallet(): WalletState {
  const stored = getStoredWallet();
  if (stored.address) disconnectBee(stored.address);
  const state: WalletState = { connected: false, address: null, minerReady: false, pendingDeepLink: null };
  saveWallet(state);
  return state;
}

export function shortAddress(address: string): string {
  // AN Wallet name — это короткое читаемое имя (напр. "cryptoclaim"), его
  // не надо урезать. Урезаем только длинные строки вида ethereum-адреса.
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function checkMinerReady(): boolean {
  return isMinerReady();
}
