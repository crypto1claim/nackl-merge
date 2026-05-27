// Минимальный тип Telegram.WebApp — то, что мы реально используем.
// Когда понадобится больше — добавим.
export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  /** Открыть ссылку в браузере (внешнюю) */
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  /** Открыть Telegram-ссылку (t.me/...) — переключает на другой чат/бота */
  openTelegramLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams?: Record<string, string>;
  colorScheme?: 'light' | 'dark';
  version?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = window.Telegram?.WebApp;

// ============================================================
// Haptic helpers с fallback на стандартный Vibration API
// Используются из UI-компонентов (кнопки, выбор, покупки, etc.)
// Engine использует свой haptic() напрямую — там нужен Settings.vibration check.
// ============================================================

/** Лёгкий тактильный отклик (выбор, переключение). */
export function hapticSelection() {
  try {
    if (tg?.HapticFeedback?.selectionChanged) {
      tg.HapticFeedback.selectionChanged();
      return;
    }
  } catch { /* */ }
  try {
    if ('vibrate' in navigator) navigator.vibrate(8);
  } catch { /* */ }
}

/** Удар: light/medium/heavy/rigid/soft */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  try {
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred(style);
      return;
    }
  } catch { /* */ }
  try {
    if ('vibrate' in navigator) {
      const duration =
        style === 'heavy'  ? 30 :
        style === 'medium' ? 15 :
        style === 'rigid'  ? 25 :
        style === 'soft'   ? 8  :
        10;
      navigator.vibrate(duration);
    }
  } catch { /* */ }
}

/** Уведомление об успехе / ошибке / предупреждении. */
export function hapticNotification(type: 'success' | 'error' | 'warning' = 'success') {
  try {
    if (tg?.HapticFeedback?.notificationOccurred) {
      tg.HapticFeedback.notificationOccurred(type);
      return;
    }
  } catch { /* */ }
  try {
    if ('vibrate' in navigator) {
      const pattern =
        type === 'error'   ? [20, 50, 20] :
        type === 'warning' ? [15, 40, 15] :
        [10, 30, 20]; // success
      navigator.vibrate(pattern);
    }
  } catch { /* */ }
}

