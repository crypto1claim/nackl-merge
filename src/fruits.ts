// ============================================================
// Лестница уровней — единая для обоих наборов монет.
// Только радиус + базовая стоимость (в MRG) фиксированы.
// Тикер/название/цвета берутся из активного набора (coin_sets.ts).
// ============================================================

import { getActiveCoins, subscribeCoinSet, type CoinDef } from './coin_sets';

export interface FruitDef {
  level: number;
  ticker: string;
  name: string;
  radius: number;
  color: string;
  colorDark: string;
  colorLight: string;
  glow: string;
  score: number;
}

// Фиксированные параметры уровней
// score = базовая награда MRG за слияние ДО этого уровня.
// Награды сбалансированы так, чтобы:
//   - Покупка дешёвой темы (10к MRG) ≈ 20-30 нормальных игр
//   - Флагман Acki Nacki (50к MRG) ≈ 100+ игр, многодневный progression
//   - Альт-монеты доступны после нескольких игр
const LEVEL_PARAMS = [
  { radius: 16,  score: 1   },   // спавн — почти ничего
  { radius: 20,  score: 1   },   // USDT
  { radius: 26,  score: 2   },   // XRP
  { radius: 32,  score: 3   },   // TON
  { radius: 40,  score: 4   },   // ADA
  { radius: 48,  score: 6   },   // SOL
  { radius: 56,  score: 8   },   // BNB
  { radius: 66,  score: 11  },   // USDC
  { radius: 78,  score: 14  },   // ETH
  { radius: 90,  score: 18  },   // BTC
  { radius: 104, score: 30  },   // NACKL — главный приз
];

/**
 * Получить FRUITS для активного набора монет.
 * Вызывается каждый раз когда движку нужны определения —
 * благодаря этому смена набора сразу даёт новые тикеры/цвета.
 */
// ПРОИЗВОДИТЕЛЬНОСТЬ: getFruits() раньше пересобирал 11-элементный массив
// новых объектов на КАЖДОЕ обращение к FRUITS (включая FRUITS[level] и
// FRUITS.length в горячем цикле рендера) → сотни аллокаций в секунду, лаги
// и нагрев на iPhone 14. Теперь результат кэшируется и пересобирается только
// при смене набора/варианта монет (через subscribeCoinSet ниже).
let _fruitsCache: FruitDef[] | null = null;

export function getFruits(): FruitDef[] {
  if (_fruitsCache) return _fruitsCache;
  const coins: CoinDef[] = getActiveCoins();
  _fruitsCache = coins.map((c, level) => ({
    level,
    ticker: c.ticker,
    name: c.name,
    radius: LEVEL_PARAMS[level].radius,
    color: c.color,
    colorDark: c.colorDark,
    colorLight: c.colorLight,
    glow: c.glow,
    score: LEVEL_PARAMS[level].score,
  }));
  return _fruitsCache;
}

// Сбрасываем кэш при смене варианта монет — getFruits() пересоберётся 1 раз.
subscribeCoinSet(() => { _fruitsCache = null; });

/**
 * Обратная совместимость: экспортируем геттер как массив через Proxy.
 *
 * Важно: когда возвращаем метод массива (map, forEach...), нужно его
 * .bind(arr), иначе при вызове FRUITS.map(...) внутри метод теряет
 * связь с массивом и возвращает undefined/пусто.
 *
 * Так же — числовые индексы (FRUITS[0]) обрабатываем напрямую.
 */
export const FRUITS = new Proxy([] as FruitDef[], {
  get(_target, prop) {
    const arr = getFruits();
    const value = (arr as any)[prop];
    if (typeof value === 'function') {
      return value.bind(arr);
    }
    return value;
  },
});

export const SPAWNABLE_LEVELS = [0, 1, 2, 3, 4];

// ============================================================
// DEBUG: режим демонстрации всех монет.
// Включи DEBUG_CYCLE_ALL=true, чтобы спавн циклически перебирал
// все 11 уровней (MATIC → ... → NACKL → снова MATIC).
// Это нужно для проверки качества отрисовки каждой монеты.
// Выключи (false) перед релизом.
// ============================================================
const DEBUG_CYCLE_ALL = false;
let _debugCounter = -1;

export function randomSpawnLevel(): number {
  if (DEBUG_CYCLE_ALL) {
    _debugCounter = (_debugCounter + 1) % 11;  // 11 уровней: 0..10
    return _debugCounter;
  }
  return SPAWNABLE_LEVELS[Math.floor(Math.random() * SPAWNABLE_LEVELS.length)];
}
