/** DApp ID приложения в сети Acki Nacki */
export const DAPP_ID = '0x0000000000000000000000000000000000000000000000000000000000000018';

// ============================================================
// КОНФИГУРАЦИЯ ВНЕШНИХ ССЫЛОК
// ============================================================
// Всё что должно быть заменено перед публикацией — здесь.
// Используется в About-экране, DonateModal, и т.д.
// ============================================================

/** Канал автора в Telegram */
export const CHANNEL_URL = 'https://t.me/crypto_claim_invite';

/** Farcaster профиль автора */
export const FARCASTER_URL = 'https://farcaster.xyz/crypto1claim';

/**
 * Майнинг-ферма Acki Nacki в Telegram (другой бот).
 * Сюда направляем НОВЫХ пользователей которые ещё не знают что такое AN.
 */
export const MINING_FARM_URL = 'https://t.ackinacki.com?startapp=eyJyZWZlcnJlciI6Impvbl9iXzEifQ';

/** Донат-кошельки */
export const DONATE_WALLETS = {
  ton:   'UQAYM8ouOvM6qDwnyCAu9AE9TjbrILx3e1mtzxPaJfNnlpJR',
  // Acki Nacki Wallet — human-readable wallet name (cryptoclaim), не on-chain адрес.
  // Bee Engine SDK абстрагирует это через wallet name.
  nackl: 'cryptoclaim',
  evm:   '0x7cc6C8B78844732953FBe92771dFCcfce3ec301a',
};
