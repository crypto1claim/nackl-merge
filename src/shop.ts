// ============================================================
// Магазин. Каталог: 4 темы + 22 монеты (по уровню × вариант).
// Все темы — платные кроме acki_nacki (стартовая).
// Все default-монеты — бесплатные (стартовые).
// Альты — платные, цена растёт с уровнем.
// ============================================================

import { spendMRG } from './currency';
import type { ThemeId } from './themes';
import type { CoinVariant } from './coin_sets';

// ID товара. Для монет — `coin:LEVEL:VARIANT`
export type ItemId =
  | `theme:${ThemeId}`
  | `coin:${number}:${CoinVariant}`;

export interface ShopItem {
  id: ItemId;
  price: number;
}

// Цены альт-монет растут с уровнем 0..10
// NEAR=500, TRX=750, LTC=1100, NOT=1500, SUI=2000, LINK=2500,
// AVAX=3000, XLM=3500, MON=4000, CORE=4500, SHELL=5000
const ALT_PRICES = [500, 750, 1100, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

// Темы — фиксированные цены: 0 (Пастель) → 60000 MRG (Acki Nacki флагман).
// Acki Nacki — флагман: твой брендовый токен должен быть венцом коллекции.
// Bitcoin — премиум, но не флагман.
const THEME_PRICES: Record<ThemeId, number> = {
  pastel:     0,        // стартовая бесплатная
  exchange:   10000,
  ocean:      12000,
  pizza:      15000,
  china:      18000,
  halloween:  22000,
  christmas:  24000,
  terminal:   28000,
  cyberpunk:  30000,
  bee_engine: 35000,
  bitcoin:    45000,
  acki_nacki: 60000,    // ФЛАГМАН
};

export const SHOP_ITEMS: ShopItem[] = [
  // Темы — 12 шт
  { id: 'theme:pastel',     price: THEME_PRICES.pastel },
  { id: 'theme:exchange',   price: THEME_PRICES.exchange },
  { id: 'theme:ocean',      price: THEME_PRICES.ocean },
  { id: 'theme:pizza',      price: THEME_PRICES.pizza },
  { id: 'theme:china',      price: THEME_PRICES.china },
  { id: 'theme:halloween',  price: THEME_PRICES.halloween },
  { id: 'theme:christmas',  price: THEME_PRICES.christmas },
  { id: 'theme:terminal',   price: THEME_PRICES.terminal },
  { id: 'theme:cyberpunk',  price: THEME_PRICES.cyberpunk },
  { id: 'theme:bee_engine', price: THEME_PRICES.bee_engine },
  { id: 'theme:bitcoin',    price: THEME_PRICES.bitcoin },
  { id: 'theme:acki_nacki', price: THEME_PRICES.acki_nacki },
  // Default-монеты на каждом уровне — бесплатно
  ...Array.from({ length: 11 }, (_, lvl) => ({
    id: `coin:${lvl}:default` as ItemId, price: 0,
  })),
  // Alt-монеты — растут с уровнем
  ...Array.from({ length: 11 }, (_, lvl) => ({
    id: `coin:${lvl}:alt` as ItemId, price: ALT_PRICES[lvl],
  })),
];

export function getPrice(id: ItemId): number {
  return SHOP_ITEMS.find((i) => i.id === id)?.price ?? 0;
}

// ============================================================
// Состояние покупок
// ============================================================
const OWNED_KEY = 'acki_merge_shop_owned';

function readOwned(): Set<ItemId> {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (raw) return new Set(JSON.parse(raw) as ItemId[]);
  } catch { /* */ }
  return new Set();
}

function writeOwned(s: Set<ItemId>) {
  try { localStorage.setItem(OWNED_KEY, JSON.stringify(Array.from(s))); } catch { /* */ }
}

const owned = (() => {
  const s = readOwned();
  // Стартовые товары всегда owned
  for (const item of SHOP_ITEMS) {
    if (item.price === 0) s.add(item.id);
  }
  writeOwned(s);
  return s;
})();

const listeners = new Set<() => void>();

export function isOwned(id: ItemId): boolean { return owned.has(id); }

export function buyItem(id: ItemId): boolean {
  if (owned.has(id)) return true;
  const price = getPrice(id);
  if (!spendMRG(price)) return false;
  owned.add(id);
  writeOwned(owned);
  listeners.forEach((cb) => cb());
  return true;
}

export function subscribeShop(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
