// ============================================================
// Power-ups (бустеры): покупаются в магазине за MRG, используются
// в игре. Инвентарь хранится в localStorage.
// ============================================================

import { spendMRG } from './currency';

export type PowerUpId = 'removeBottom' | 'boostNext' | 'extraCharge';

export interface PowerUpDef {
  id: PowerUpId;
  title: string;
  description: string;
  icon: string;     // эмодзи для inventory
  price: number;   // MRG за 1 шт
}

export const POWERUPS: PowerUpDef[] = [
  {
    id: 'removeBottom',
    title: 'Убрать монету',
    description: 'Удаляет случайную монету из нижней половины банки',
    icon: '🗑',
    price: 200,
  },
  {
    id: 'boostNext',
    title: 'Буст +1 уровень',
    description: 'Следующая монета будет на 1 уровень выше',
    icon: '⬆️',
    price: 500,
  },
  {
    id: 'extraCharge',
    title: '+1 заряд Shake',
    description: 'Мгновенно даёт готовый заряд Shake Damage',
    icon: '⚡',
    price: 1000,
  },
];

type Inventory = Record<PowerUpId, number>;
const STORAGE_KEY = 'nackl_powerups_inventory';

function emptyInv(): Inventory {
  return { removeBottom: 0, boostNext: 0, extraCharge: 0 };
}

function loadInv(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyInv(), ...parsed };
    }
  } catch { /* */ }
  return emptyInv();
}

function saveInv(inv: Inventory) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inv)); } catch { /* */ }
}

const listeners = new Set<(inv: Inventory) => void>();

export function getInventory(): Inventory {
  return loadInv();
}

export function getCount(id: PowerUpId): number {
  return loadInv()[id] || 0;
}

export function subscribeInventory(cb: (inv: Inventory) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Покупка одного бустера. Списывает MRG и пополняет инвентарь. */
export function buy(id: PowerUpId): boolean {
  const def = POWERUPS.find((p) => p.id === id);
  if (!def) return false;
  if (!spendMRG(def.price)) return false;
  const inv = loadInv();
  inv[id] = (inv[id] || 0) + 1;
  saveInv(inv);
  listeners.forEach((cb) => cb(inv));
  return true;
}

/** Списать один бустер при использовании в игре. */
export function consume(id: PowerUpId): boolean {
  const inv = loadInv();
  if ((inv[id] || 0) <= 0) return false;
  inv[id] -= 1;
  saveInv(inv);
  listeners.forEach((cb) => cb(inv));
  return true;
}
