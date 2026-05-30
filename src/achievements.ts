// ============================================================
// Достижения: набор целей с условиями и наградой в MRG.
// Хранятся в localStorage. Проверяются через checkAchievements()
// после игровых событий — engine эмитит сигналы, App смотрит и
// показывает popup при разблокировке.
// ============================================================

import { earnMRG } from './currency';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;       // эмодзи
  reward: number;     // MRG
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === Прогресс по монетам ===
  { id: 'first_merge',   title: 'Первое слияние',   description: 'Слей две одинаковые монеты',          icon: '🪙',  reward: 100 },
  { id: 'reach_l3',      title: 'Полёт TON',        description: 'Достигни TON',                         icon: '💎',  reward: 200 },
  { id: 'reach_l5',      title: 'Solana пилот',     description: 'Достигни SOL',                         icon: '🌅',  reward: 500 },
  { id: 'reach_l7',      title: 'USDC накоплено',   description: 'Достигни USDC',                        icon: '💵',  reward: 1000 },
  { id: 'reach_l8',      title: 'Ethereum пройден', description: 'Достигни ETH',                         icon: '⚡', reward: 2000 },
  { id: 'reach_l9',      title: 'Биткоин достигнут',description: 'Достигни BTC',                         icon: '₿',  reward: 5000 },
  { id: 'reach_nackl',   title: 'NACKL МАСТЕР',     description: 'Самая редкая монета — твоя!',          icon: '👑',  reward: 25000 },

  // === Комбо ===
  { id: 'combo_5',       title: 'Каскад',           description: 'Сделай комбо ×5',                      icon: '🔥',  reward: 200 },
  { id: 'combo_10',      title: 'Цепная реакция',   description: 'Сделай комбо ×10',                     icon: '💥',  reward: 1000 },
  { id: 'combo_15',      title: 'Грандмастер',      description: 'Сделай комбо ×15',                     icon: '🌟', reward: 5000 },

  // === Shake Damage ===
  { id: 'shake_first',   title: 'Первый удар',      description: 'Использовал Shake Damage',             icon: '⚡', reward: 300 },
  { id: 'shake_all',     title: 'Полный разгром',   description: 'Использовал все 3 заряда за партию',   icon: '💣',  reward: 1500 },

  // === Накопления / стрик ===
  { id: 'mrg_100k',      title: 'Сто тысяч',        description: 'Накопи 100 000 MRG',                   icon: '💰',  reward: 2000 },
  { id: 'streak_7',      title: 'Неделя со мной',   description: 'Стрик ежедневного захода 7 дней',     icon: '📅',  reward: 3000 },
];

const STORAGE_KEY = 'nackl_achievements_unlocked';

interface UnlockedState {
  [id: string]: number; // timestamp разблокировки
}

function load(): UnlockedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {};
}

function save(state: UnlockedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}

export function isUnlocked(id: string): boolean {
  return id in load();
}

export function getUnlocked(): Set<string> {
  return new Set(Object.keys(load()));
}

export function getAllProgress(): { def: AchievementDef; unlocked: boolean; at: number | null }[] {
  const state = load();
  return ACHIEVEMENTS.map((def) => ({
    def,
    unlocked: def.id in state,
    at: state[def.id] || null,
  }));
}

// Слушатели — App подписывается, чтобы показать popup при разблокировке
const listeners = new Set<(def: AchievementDef) => void>();
export function onUnlock(cb: (def: AchievementDef) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Разблокировать достижение по id. Если уже было — ничего не делает. */
export function unlock(id: string) {
  const state = load();
  if (id in state) return;
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return;
  state[id] = Date.now();
  save(state);
  earnMRG(def.reward);
  listeners.forEach((cb) => cb(def));
}

// === Хелперы для проверки конкретных условий ===
// engine вызывает их при событиях, мы решаем что разблокировать.

export function onMerge(level: number) {
  // level — уровень получившейся монеты (0..10, где 0=USDT после первого слияния MATIC)
  unlock('first_merge');
  if (level >= 3) unlock('reach_l3');
  if (level >= 5) unlock('reach_l5');
  if (level >= 7) unlock('reach_l7');
  if (level >= 8) unlock('reach_l8');
  if (level >= 9) unlock('reach_l9');
  if (level >= 10) unlock('reach_nackl');
}

export function onCombo(combo: number) {
  if (combo >= 5) unlock('combo_5');
  if (combo >= 10) unlock('combo_10');
  if (combo >= 15) unlock('combo_15');
}

export function onShakeUsed(totalUsedThisGame: number) {
  unlock('shake_first');
  if (totalUsedThisGame >= 3) unlock('shake_all');
}

export function onBalanceChange(balance: number) {
  if (balance >= 100000) unlock('mrg_100k');
}

export function onDailyStreak(streak: number) {
  if (streak >= 7) unlock('streak_7');
}
