// ============================================================
// Спрайты монет: загрузка из public/coins/*.
// Только NACKL — .png (твоё фото). Остальные — .svg.
// Файлы именуются по тикеру в нижнем регистре, кроме TRX (это USDT-альт TRON).
// ============================================================

import { COIN_SET_DEFAULT, COIN_SET_ALT } from './coin_sets';

// Карта тикер → имя файла. Большинство совпадают, но TRON в библиотеке как 'trx'.
const FILE_OVERRIDES: Record<string, string> = {
  // Тикер -> базовое имя файла
  TRX: 'trx',
  NOT: 'not',
};

function fileFor(ticker: string): string {
  const base = FILE_OVERRIDES[ticker] ?? ticker.toLowerCase();
  // NACKL и SHELL — это твои настоящие PNG-логотипы
  const ext = ['NACKL', 'SHELL', 'NOT', 'SUI', 'MON', 'CORE', 'NEAR'].includes(ticker) ? 'png' : 'svg';
  return `coins/${base}.${ext}`;
}

// Кэш: ключ — тикер, значение — Image
const cache = new Map<string, HTMLImageElement>();

export function getSprite(ticker: string): HTMLImageElement | null {
  return cache.get(ticker) ?? null;
}

/**
 * Грузим спрайты ОБОИХ наборов один раз —
 * чтобы переключение в магазине было мгновенным.
 */
export async function preloadSprites(): Promise<void> {
  const allTickers = new Set<string>();
  COIN_SET_DEFAULT.forEach((c) => allTickers.add(c.ticker));
  COIN_SET_ALT.forEach((c) => allTickers.add(c.ticker));

  await Promise.all(
    Array.from(allTickers).map(async (ticker) => {
      const url = fileFor(ticker);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
        cache.set(ticker, img);
      } catch (e) {
        console.warn(`Failed to load ${url}`, e);
      }
    })
  );
}
