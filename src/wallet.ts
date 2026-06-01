// ============================================================
// Acki Nacki Wallet — реальная интеграция через Bee Engine SDK
// ============================================================

import {
  initBeeEngine, authorize, waitForAuthorization,
  startMining, disconnectBee, isMinerReady,
} from './beeEngine';

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

export async function connectWallet(
  walletName: string,
  onProgress?: (pct: number) => void,
): Promise<WalletState> {
  await initBeeEngine(onProgress);
  const { deepLink, alreadyAuthorized } = await authorize(walletName);

  if (alreadyAuthorized) {
    startMining();
    const state: WalletState = { connected: true, address: walletName, minerReady: true, pendingDeepLink: null };
    saveWallet(state);
    return state;
  }

  const state: WalletState = { connected: true, address: walletName, minerReady: false, pendingDeepLink: deepLink };
  saveWallet(state);
  return state;
}

export async function confirmAuthorization(walletName: string): Promise<WalletState> {
  await waitForAuthorization(walletName);
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
