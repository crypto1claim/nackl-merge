// ============================================================
// Bootstrap — самый ранний модуль, выполняется до всех остальных.
// Делает одноразовый полный ресет состояния игры:
//   - удаляет все купленные предметы
//   - сбрасывает активную тему и варианты монет
//   - обнуляет best score
//   - устанавливает стартовый баланс 300 000 MRG
//
// Срабатывает один раз благодаря флагу 'acki_merge_full_reset_v2'
// в localStorage. Чтобы повторить — поменять номер версии (v3, v4...).
// ============================================================

const RESET_FLAG = 'acki_merge_full_reset_v6';

if (typeof localStorage !== 'undefined' && !localStorage.getItem(RESET_FLAG)) {
  const keysToWipe = [
    'acki_merge_mrg',
    'acki_merge_shop_owned',
    'acki_merge_theme',
    'acki_merge_coin_variants',
    'acki_merge_best_session',
    'acki_merge_tutorial_seen',
    'nackl_merge_onboarding_seen',
    // Новые ключи (бустеры/достижения/daily/wallet)
    'acki_merge_wallet_v2',
    'nackl_powerups_inventory',
    'nackl_achievements_unlocked',
    'nackl_daily_last_date',
    'nackl_daily_streak',
    'nackl_shake_hint_seen',
    // Устаревшие флаги ресетов
    'acki_merge_dev_boost_reset_v1',
    'acki_merge_100k_bonus_v1',
    'acki_merge_full_reset_v2',
    'acki_merge_full_reset_v3',
    'acki_merge_full_reset_v4',
    'acki_merge_full_reset_v5',
  ];
  for (const k of keysToWipe) {
    try { localStorage.removeItem(k); } catch { /* */ }
  }
  // Стартовый баланс 0 MRG — все начнут как новые пользователи.
  try {
    localStorage.setItem('acki_merge_mrg', '0');
    localStorage.setItem('acki_merge_best_session', '0');
  } catch { /* */ }
  try { localStorage.setItem(RESET_FLAG, '1'); } catch { /* */ }
}

export {};
