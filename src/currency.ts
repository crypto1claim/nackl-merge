// ============================================================
// MRG — внутриигровая валюта.
// Заменяет старую систему "очки + общий прогресс".
// Зарабатывается во время игры (1 очко = 1 MRG), тратится в магазине.
// ============================================================

const BALANCE_KEY = 'acki_merge_mrg';
const BEST_KEY    = 'acki_merge_best_session'; // лучший single-game (для рекорда)

function readNumber(key: string, def = 0): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return parseInt(raw, 10) || 0;
  } catch { /* */ }
  return def;
}

function writeNumber(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* */ }
}

let balance = readNumber(BALANCE_KEY);
let best = readNumber(BEST_KEY);
const listeners = new Set<(b: number) => void>();

// (Полный ресет с установкой стартового баланса 300 000 MRG
//  выполняется в bootstrap.ts при первом запуске сборки.
//  currency.ts читает балансы из localStorage уже после ресета.)

/** Текущий баланс MRG (то, что игрок может тратить). */
export function getBalance(): number { return balance; }

/** Лучший single-game счёт. */
export function getBest(): number { return best; }

/** Заработано — добавляется к балансу. НЕ трогает «рекорд партии»:
 *  раньше любой бонус (daily/достижения) перезаписывал best, и HUD
 *  показывал неправильный рекорд. Рекорд обновляется только recordBest(). */
export function earnMRG(amount: number) {
  if (amount <= 0) return;
  balance += amount;
  writeNumber(BALANCE_KEY, balance);
  listeners.forEach((cb) => cb(balance));
}

/** Обновить лучший single-game счёт. Вызывается ТОЛЬКО по итогам партии. */
export function recordBest(score: number) {
  if (score > best) {
    best = score;
    writeNumber(BEST_KEY, best);
  }
}

/** Списать MRG. Возвращает true если успешно. */
export function spendMRG(amount: number): boolean {
  // Защита инварианта: только положительные суммы и не больше баланса
  // (иначе отрицательный amount «начислил» бы баланс).
  if (amount <= 0 || amount > balance) return false;
  balance -= amount;
  writeNumber(BALANCE_KEY, balance);
  listeners.forEach((cb) => cb(balance));
  return true;
}

export function subscribeBalance(cb: (b: number) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Полный сброс — для меню "Disconnect wallet". */
export function resetCurrency() {
  balance = 0;
  best = 0;
  writeNumber(BALANCE_KEY, 0);
  writeNumber(BEST_KEY, 0);
  listeners.forEach((cb) => cb(balance));
}

/** Форматирование 12540 → "12 540" для UI. */
export function formatMRG(value: number): string {
  return value.toLocaleString('ru-RU').replace(/,/g, ' ');
}
