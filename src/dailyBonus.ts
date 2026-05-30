// ============================================================
// Ежедневный бонус: даёт MRG за вход. Стрик растёт за дни подряд.
// Сбрасывается если пропустил день.
// ============================================================

import { earnMRG } from './currency';

const KEY_LAST_DATE = 'nackl_daily_last_date';
const KEY_STREAK    = 'nackl_daily_streak';

// Возврат: { amount, streak, isNew }
//  amount > 0 — игрок зашёл впервые за сегодня, начислить и показать
//  amount = 0 — уже получал сегодня
export interface DailyBonusResult {
  amount: number;
  streak: number;
  isNew: boolean;
}

/** YYYY-MM-DD по локальной таймзоне */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Вызывается при старте игры. Если новый день — начисляет, иначе возвращает 0. */
export function claimDailyBonus(): DailyBonusResult {
  let lastDate = '';
  let streak = 0;
  try {
    lastDate = localStorage.getItem(KEY_LAST_DATE) || '';
    streak = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10) || 0;
  } catch { /* */ }

  const today = todayKey();
  if (lastDate === today) {
    // Уже получал сегодня — ничего не делаем
    return { amount: 0, streak, isNew: false };
  }

  // Считаем стрик: 1 день назад → +1, иначе сброс
  let newStreak: number;
  if (lastDate && daysBetween(lastDate, today) === 1) {
    newStreak = streak + 1;
  } else {
    newStreak = 1;
  }

  // Награды по стрику: 1=500, 2=750, 3=1000, 4=1500, 5=2500, 6=3500, 7+=5000
  const rewards = [500, 750, 1000, 1500, 2500, 3500, 5000];
  const amount = rewards[Math.min(newStreak - 1, rewards.length - 1)];

  earnMRG(amount);
  try {
    localStorage.setItem(KEY_LAST_DATE, today);
    localStorage.setItem(KEY_STREAK, String(newStreak));
  } catch { /* */ }

  return { amount, streak: newStreak, isNew: true };
}
