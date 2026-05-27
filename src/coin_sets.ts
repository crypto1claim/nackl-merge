// ============================================================
// Скины монет: для КАЖДОГО уровня (0..10) есть основной (default)
// и альтернативный (alt) тикер. Игрок покупает каждую монету
// отдельно и независимо выбирает, какой вариант использовать
// на каждом уровне.
//
// Например: на уровне 0 у тебя MATIC (default), а на уровне 8 — MON (alt).
// ============================================================

export interface CoinDef {
  ticker: string;
  name: string;
  color: string;
  colorDark: string;
  colorLight: string;
  glow: string;
}

// Основной (стартовый) набор
export const COIN_SET_DEFAULT: CoinDef[] = [
  { ticker: 'MATIC', name: 'Polygon',      color: '#8247e5', colorDark: '#3f1885', colorLight: '#b888ff', glow: '#8247e5' },
  { ticker: 'USDT',  name: 'Tether',       color: '#26a17b', colorDark: '#13634a', colorLight: '#5dd4a8', glow: '#26a17b' },
  { ticker: 'XRP',   name: 'Ripple',       color: '#23292f', colorDark: '#0a0d10', colorLight: '#5a6470', glow: '#8a9ab0' },
  { ticker: 'TON',   name: 'Toncoin',      color: '#0098ea', colorDark: '#005580', colorLight: '#5dc8ff', glow: '#0098ea' },
  { ticker: 'ADA',   name: 'Cardano',      color: '#0033ad', colorDark: '#001a5a', colorLight: '#3d6cdb', glow: '#3d6cdb' },
  { ticker: 'SOL',   name: 'Solana',       color: '#9945ff', colorDark: '#5a2599', colorLight: '#14f195', glow: '#14f195' },
  { ticker: 'BNB',   name: 'Binance',      color: '#f3ba2f', colorDark: '#a07b14', colorLight: '#ffd870', glow: '#f3ba2f' },
  { ticker: 'USDC',  name: 'USD Coin',     color: '#2775ca', colorDark: '#13497a', colorLight: '#5da8ff', glow: '#2775ca' },
  { ticker: 'ETH',   name: 'Ethereum',     color: '#627eea', colorDark: '#2a3a85', colorLight: '#a4b4f0', glow: '#8aa0ff' },
  { ticker: 'BTC',   name: 'Bitcoin',      color: '#f7931a', colorDark: '#a06010', colorLight: '#ffc870', glow: '#f7931a' },
  { ticker: 'NACKL', name: 'Acki Nacki',   color: '#ffd84d', colorDark: '#a07b13', colorLight: '#fff4a8', glow: '#ffd84d' },
];

// Альт-набор
export const COIN_SET_ALT: CoinDef[] = [
  { ticker: 'NEAR',  name: 'NEAR Protocol',color: '#00ec97', colorDark: '#008558', colorLight: '#6affc4', glow: '#00ec97' },
  { ticker: 'TRX',   name: 'TRON',         color: '#ff060a', colorDark: '#990408', colorLight: '#ff6064', glow: '#ff060a' },
  { ticker: 'LTC',   name: 'Litecoin',     color: '#345d9d', colorDark: '#1a3056', colorLight: '#6890c8', glow: '#5489d3' },
  { ticker: 'NOT',   name: 'Notcoin',      color: '#ffd84d', colorDark: '#c08020', colorLight: '#fff4a8', glow: '#ffd84d' },
  { ticker: 'SUI',   name: 'Sui',          color: '#4DA2FF', colorDark: '#1a5fa8', colorLight: '#a0d0ff', glow: '#4DA2FF' },
  { ticker: 'LINK',  name: 'Chainlink',    color: '#2a5ada', colorDark: '#13347a', colorLight: '#7a9ce8', glow: '#2a5ada' },
  { ticker: 'AVAX',  name: 'Avalanche',    color: '#e84142', colorDark: '#8a1f20', colorLight: '#ff7878', glow: '#e84142' },
  { ticker: 'XLM',   name: 'Stellar',      color: '#14b6e7', colorDark: '#0a627c', colorLight: '#7adcf2', glow: '#14b6e7' },
  { ticker: 'MON',   name: 'Monad',        color: '#6F4DFF', colorDark: '#3B238F', colorLight: '#A98EFF', glow: '#9D80FF' },
  { ticker: 'CORE',  name: 'Core',         color: '#ff8a3d', colorDark: '#a04510', colorLight: '#ffb878', glow: '#ff8a3d' },
  { ticker: 'SHELL', name: 'Shell',        color: '#c0c5d0', colorDark: '#404858', colorLight: '#ffffff', glow: '#c0c5d0' },
];

// ============================================================
// Активный выбор на каждом уровне: 'default' или 'alt'
// Хранится массив из 11 ID
// ============================================================

export type CoinVariant = 'default' | 'alt';

const STORAGE_KEY = 'acki_merge_coin_variants';
const LEVELS_COUNT = 11;

function readVariants(): CoinVariant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoinVariant[];
      if (Array.isArray(parsed) && parsed.length === LEVELS_COUNT) return parsed;
    }
  } catch { /* */ }
  // По умолчанию — все default
  return Array(LEVELS_COUNT).fill('default');
}

function writeVariants(arr: CoinVariant[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch { /* */ }
}

let variants = readVariants();
const listeners = new Set<() => void>();

/** Получить активный вариант для уровня. */
export function getVariant(level: number): CoinVariant {
  return variants[level] ?? 'default';
}

/** Установить активный вариант для уровня. Проверки покупки делает caller. */
export function setVariant(level: number, variant: CoinVariant) {
  if (variants[level] === variant) return;
  variants = [...variants];
  variants[level] = variant;
  writeVariants(variants);
  listeners.forEach((cb) => cb());
}

export function subscribeCoinSet(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Получить определение монеты для конкретного уровня учитывая активный вариант. */
export function getCoinFor(level: number): CoinDef {
  const v = getVariant(level);
  return (v === 'alt' ? COIN_SET_ALT : COIN_SET_DEFAULT)[level];
}

/** Все активные монеты — массив из 11 шт согласно выбору на каждом уровне. */
export function getActiveCoins(): CoinDef[] {
  const out: CoinDef[] = [];
  for (let i = 0; i < LEVELS_COUNT; i++) out.push(getCoinFor(i));
  return out;
}
