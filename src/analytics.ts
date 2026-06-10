// ============================================================
// Аналитика — единая точка отправки событий (Vercel Web Analytics).
//
// Зачем: видеть воронку (открыл → подключил кошелёк → играет) и краши на
// проде. Без неё запуск на 100k вслепую.
//
// Провайдер — Vercel Analytics: бэкенд не нужен, включается одной галочкой
// в дашборде Vercel (Project → Analytics → Enable). Если не включить —
// track() просто ничего не делает, игра работает как обычно.
//
// Все события проходят через track() ниже. Чтобы сменить провайдера
// (Plausible, PostHog, свой эндпоинт) — достаточно переписать только этот
// файл, остальной код трогать не нужно.
//
// ВАЖНО: аналитика обёрнута в try/catch и НИКОГДА не должна ронять игру.
// ============================================================

import { track as vercelTrack } from '@vercel/analytics';

export type AnalyticsEvent =
  | 'app_open'                 // игра открылась
  | 'onboarding_have_wallet'   // нажал «у меня есть кошелёк»
  | 'onboarding_need_wallet'   // нажал «я новичок» (ушёл создавать кошелёк)
  | 'wallet_connect_start'     // начал подключение кошелька
  | 'wallet_connect_success'   // кошелёк подключён, майнинг пошёл
  | 'wallet_connect_fail'      // ошибка подключения (имя не найдено и т.п.)
  | 'wallet_engine_load_fail'  // не загрузился WASM-движок (плохая сеть)
  | 'wallet_resume_fail'       // не восстановился майнер после перезагрузки
  | 'wallet_link_copied'       // скопировал диплинк (фолбэк подключения)
  | 'wallet_qr_shown'          // открыл QR-код (фолбэк подключения)
  | 'game_start'               // началась партия
  | 'game_over'                // партия закончилась (props: earned)
  | 'theme_purchase'           // куплена тема (props: theme, price)
  | 'app_error';               // краш (props: where, message)

type Props = Record<string, string | number | boolean | null>;

/** Отправить событие аналитики. Безопасно: при любой ошибке — тихий no-op. */
export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    vercelTrack(event, props);
  } catch {
    /* аналитика не имеет права ломать игру */
  }
}
