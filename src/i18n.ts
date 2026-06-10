// ============================================================
// Простая i18n-система без зависимостей.
// Два языка: RU и EN. Первый запуск — на английском, дальше по выбору юзера.
// ============================================================

export type Lang = 'ru' | 'en';

const STORAGE_KEY = 'acki_merge_lang';

// Все строки игры. При добавлении новой — добавь в оба объекта.
const TRANSLATIONS = {
  ru: {
    // Меню
    'menu.subtitle': 'Играй и добывай NACKL',
    'menu.feat1': '11 монет: от MATIC до NACKL',
    'menu.feat2': 'Сливай одинаковые, побей рекорд',
    'menu.feat3': 'Открывай скины за прогресс',
    'menu.cta': 'Подключить Acki Nacki Wallet',
    'menu.play': 'Играть',
    'menu.shop': 'Магазин',
    'menu.shop_subtitle': 'темы и монеты',
    'menu.about_short': 'Об игре',
    'menu.about_subtitle': 'энтропия и NACKL',
    'menu.connecting': 'Подключение...',
    'menu.loading_engine': 'Загрузка движка',
    'menu.error': 'Подключение не удалось, попробуй ещё раз',
    'menu.error_engine': 'Не удалось загрузить движок игры. Проверь соединение и попробуй снова.',
    'menu.rewards': 'Награды',
    'menu.err_enter_name': 'Введи имя AN Wallet',
    'menu.err_not_found': 'AN Wallet с таким именем не найден. Установи AN Wallet, зарегистрируй имя и введи его точно.',
    'menu.err_not_confirmed': 'Подтверждение не получено. Убедись что открыл AN Wallet и подтвердил.',
    'menu.auth_hint': 'Открой AN Wallet и подтверди подключение:',
    'menu.open_wallet': 'Открыть AN Wallet',
    'menu.checking': 'Проверяем...',
    'menu.confirmed_btn': '✓ Я подтвердил в кошельке',
    'menu.copy_link': 'Скопировать ссылку',
    'menu.copied': '✓ Скопировано',
    'menu.qr_toggle': 'Не появилось окно в кошельке? Показать QR-код',
    'menu.qr_hint': 'Отсканируй QR сканером внутри AN Wallet (например, с экрана другого устройства)',
    'menu.need_wallet_hint': 'Нужен установленный AN Wallet с зарегистрированным именем. Введи это имя:',
    'menu.name_placeholder': 'Имя AN Wallet (например: alice)',
    'menu.footer': 'Powered by Acki Nacki',
    'menu.settings': 'Настройки',

    // Пауза
    'pause.title': 'Пауза',
    'pause.resume': 'Продолжить',
    'pause.restart': 'Начать заново',
    'pause.menu': 'Выйти в меню',
    'pause.confirm_exit': 'Выйти в меню? Текущий счёт не сохранится.',

    // Skins screen
    'skins.title': 'Скины',
    'skins.current': 'Активен',
    'skins.unlocked_at': 'Откроется при',

    // HUD
    'hud.score': 'СЧЁТ',
    'hud.best': 'РЕКОРД',
    'hud.next': 'СЛЕД.',
    'hud.combo': 'КОМБО',
    'hud.bomb_ready': 'SHAKE DMG',
    'hud.connected': 'Подключен',

    // Game over
    'over.title': 'Игра окончена',
    'over.record': '🏆 Новый рекорд!',
    'over.score': 'Счёт',
    'over.best': 'Рекорд',
    'over.again': 'Играть снова',

    // Settings
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.sound': 'Звук',
    'settings.vibration': 'Вибрация',
    'settings.reset_record': 'Сбросить рекорд',
    'settings.disconnect': 'Отключить кошелёк',
    'settings.about': 'О игре',
    'settings.close': 'Закрыть',
    'settings.confirm_reset': 'Точно сбросить рекорд?',
    'settings.confirm_disconnect': 'Точно отключить кошелёк?',
    'settings.yes': 'Да',
    'settings.no': 'Нет',
    'settings.tutorial_reset_done': 'Обучение будет показано при следующем входе в игру.',

    // Themes
    'theme.pastel':     'Пастель',
    'theme.acki_nacki': 'Acki Nacki',
    'theme.exchange':   'Биржа',
    'theme.ocean':      'Океан',
    'theme.pizza':      'Пицца',
    'theme.china':      'Китай',
    'theme.halloween':  'Хэллоуин',
    'theme.christmas':  'Рождество',
    'theme.terminal':   'Терминал',
    'theme.cyberpunk':  'Cyberpunk',
    'theme.bee_engine': 'Bee Engine',
    'theme.bitcoin':    'Bitcoin',

    // About
    'about.title': 'Об игре',
    'about.hero_tag': 'Сливай монеты. Зарабатывай MRG. Добывай NACKL.',
    'about.entropy_title': 'Энтропия за каждое касание',
    'about.entropy_text': 'Каждое движение пальца и каждое слияние создают случайные данные. Эта энтропия отправляется в сеть Acki Nacki — там она помогает верифицировать блоки блокчейна. Ты играешь — сеть становится сильнее.',
    'about.mrg_title': 'MRG — игровая валюта',
    'about.mrg_text': 'За каждое слияние ты получаешь MRG. Комбо из нескольких слияний подряд умножают награду. MRG копится между играми и тратится в магазине — на темы и редкие монеты-скины.',
    'about.earn_title': 'Путь к NACKL',
    'about.earn_text': 'Финальная монета в лестнице — NACKL, фирменный токен сети Acki Nacki. Когда ты её собираешь, ты делаешь свой главный вклад в безопасность сети.',
    'about.how_title': 'Как играть',
    'about.how_step1': 'Двигай монету пальцем влево-вправо вверху банки.',
    'about.how_step2': 'Отпусти — монета падает вниз.',
    'about.how_step3': 'Две одинаковые монеты сливаются в следующую по уровню.',
    'about.how_step4': 'Дойди до NACKL и не дай монетам переполнить банку.',
    'about.bomb_title': '💥 Shake Damage',
    'about.bomb_text': 'Спецспособность для критических моментов. Заряд копится только за КРУПНЫЕ каскады — комбо ×10 и выше. ×10 даёт 35% шкалы, ×11→50%, ×12→70%, ×13+→полный заряд сразу. При 100% — готовый заряд (точка над молнией загорается). Тратится по нажатию кнопки с молнией или встряхиванием телефона: все монеты в банке взрываются волной из центра, ты получаешь крупный бонус MRG. Лимит — 3 использования за партию.',
    'about.boosters_title': '🛒 Бустеры',
    'about.boosters_text': 'Покупаются в магазине за MRG. В партии активируются кнопками в HUD рядом со Shake Damage. Каждого бустера можно использовать максимум 3 раза за партию (купить можно больше — останется на следующие).',
    'about.boosters_list1': '🗑 Убрать монету (200 MRG) — удаляет случайную монету из нижней половины банки.',
    'about.boosters_list2': '⬆️ Буст +1 уровень (500 MRG) — следующая монета будет на 1 уровень выше.',
    'about.boosters_list3': '⚡ +1 заряд Shake (1000 MRG) — мгновенно даёт готовый заряд Shake Damage.',
    'about.support_title': 'Поддержать автора',
    'about.support_text': 'Игра сделана независимым разработчиком в экосистеме Acki Nacki. Если она тебе нравится — поддержи разработку донатом.',
    'about.support_channel': 'Канал автора',
    'about.support_farcaster': 'Farcaster',
    'about.support_donate': 'Донат разработчику',
    'about.version': 'Версия',
    'about.network': 'Сеть',

    // Прогресс / разблокировки
    'progress.total': 'Прогресс',
    'unlock.locked': 'Заблокировано',
    'unlock.need': 'Нужно',
    'unlock.title': '🎉 Тема разблокирована!',
    'unlock.apply': 'Применить',
    'unlock.later': 'Позже',

    // Tutorial
    'tutorial.skip': 'Пропустить',
    'tutorial.next': 'Дальше',
    'tutorial.start': 'Начать',
    'tutorial.step1_title': 'Двигай монету',
    'tutorial.step1_text': 'Веди пальцем влево или вправо вверху банки — монета будет следовать за тобой.',
    'tutorial.step2_title': 'Отпусти — упадёт',
    'tutorial.step2_text': 'Подняв палец, ты бросишь монету вниз. Целься так, чтобы она встретила свою пару.',
    'tutorial.step3_title': 'Сливай одинаковые',
    'tutorial.step3_text': 'Две одинаковые монеты сливаются в следующую по уровню. Дойди до NACKL!',
    'tutorial.step4_title': '⚡ Shake Damage',
    'tutorial.step4_text': 'Шкала Shake Damage растёт только от КРУПНЫХ комбо — ×10 и выше. Когда заполнится — точка над молнией загорится. Нажми молнию в HUD ИЛИ потряси телефон: все монеты в банке взорвутся волной. Лимит — 3 заряда за партию.',
    'tutorial.step5_title': '🛒 Бустеры',
    'tutorial.step5_text': 'Покупай в магазине за MRG: 🗑 убрать монету, ⬆️ следующая монета выше на 1 уровень, ⚡ +1 заряд Shake Damage. Кнопки появятся в HUD. Каждого бустера — максимум 3 раза за партию.',

    // Donate
    'donate.title': 'Поддержать автора',
    'donate.subtitle': 'Выбери удобный кошелёк и отправь любую сумму. Спасибо за поддержку!',
    'donate.address': 'Адрес кошелька',
    'donate.wallet_name': 'Имя кошелька',
    'donate.copy': 'Копировать',
    'donate.copied': 'Скопировано',
    'donate.note': 'Сканируй QR-код в приложении кошелька или нажми «Копировать» чтобы вставить адрес вручную.',
    'donate.note_wallet_name': 'Это имя кошелька в Acki Nacki Wallet. Открой приложение, найди функцию «Send by name» и введи имя.',
    'donate.wallet_name_hint': 'В сети Acki Nacki используется human-readable wallet name вместо длинного адреса.',

    // Shop
    'shop.title': 'Магазин',
    'shop.tab_themes': 'Темы',
    'shop.tab_coins': 'Монеты',
    'shop.tab_boosters': 'Бустеры',
    'shop.boosters_hint': 'Бустеры активируются прямо в игре — кнопки появляются в HUD.',
    'shop.buy': 'Купить',
    'shop.apply': 'Применить',
    'shop.active': 'Активно',
    'shop.need_more': 'Нужно ещё',
    'shop.set_default': 'Основной набор',
    'shop.set_alt': 'Альт-набор',

    // HUD
    'hud.balance': 'БАЛАНС',
    'hud.earned': 'ЗАРАБОТАНО',

    // Онбординг (первый экран)
    'onboarding.tagline': 'Suika-style merge game в экосистеме Acki Nacki',
    'onboarding.q_title': 'У тебя уже есть Acki Nacki Wallet?',
    'onboarding.q_sub': 'Это нужно для подключения к игре и получения наград $NACKL',
    'onboarding.rule1': 'Сливай одинаковые монеты — собирай $NACKL, копи MRG',
    'onboarding.rule2': 'Дойди до монеты NACKL и не дай банке переполниться',
    'onboarding.yes_title': 'Да, есть кошелёк',
    'onboarding.yes_sub': 'Перейти в игру и подключить',
    'onboarding.no_title': 'Нет, я новичок',
    'onboarding.no_sub': 'Создать кошелёк и начать майнить →',
    'onboarding.disclaimer': 'Без подключённого Acki Nacki Wallet играть нельзя — это часть экосистемы.',
  },
  en: {
    'menu.subtitle': 'Play and mine NACKL',
    'menu.feat1': '11 coins: from MATIC to NACKL',
    'menu.feat2': 'Merge same coins, beat the record',
    'menu.feat3': 'Unlock skins as you progress',
    'menu.cta': 'Connect Acki Nacki Wallet',
    'menu.play': 'Play',
    'menu.about_short': 'About',
    'menu.about_subtitle': 'entropy & NACKL',
    'menu.shop': 'Shop',
    'menu.shop_subtitle': 'themes & coins',
    'menu.connecting': 'Connecting...',
    'menu.loading_engine': 'Loading engine',
    'menu.error': 'Connection failed, try again',
    'menu.error_engine': 'Failed to load the game engine. Check your connection and try again.',
    'menu.rewards': 'Rewards',
    'menu.err_enter_name': 'Enter your AN Wallet name',
    'menu.err_not_found': 'No AN Wallet found with this name. Install AN Wallet, register a name, and enter it exactly.',
    'menu.err_not_confirmed': 'Confirmation not received. Make sure you opened AN Wallet and confirmed.',
    'menu.auth_hint': 'Open AN Wallet and confirm the connection:',
    'menu.open_wallet': 'Open AN Wallet',
    'menu.checking': 'Checking...',
    'menu.confirmed_btn': '✓ I confirmed in the wallet',
    'menu.copy_link': 'Copy link',
    'menu.copied': '✓ Copied',
    'menu.qr_toggle': 'No window in the wallet? Show QR code',
    'menu.qr_hint': 'Scan the QR with the scanner inside AN Wallet (e.g. from another device’s screen)',
    'menu.need_wallet_hint': 'You need AN Wallet installed with a registered name. Enter that name:',
    'menu.name_placeholder': 'AN Wallet name (e.g. alice)',
    'menu.footer': 'Powered by Acki Nacki',
    'menu.settings': 'Settings',

    'pause.title': 'Paused',
    'pause.resume': 'Resume',
    'pause.restart': 'Restart',
    'pause.menu': 'Exit to menu',
    'pause.confirm_exit': 'Exit to menu? Current score will be lost.',

    'skins.title': 'Skins',
    'skins.current': 'Active',
    'skins.unlocked_at': 'Unlocks at',

    'hud.score': 'SCORE',
    'hud.best': 'BEST',
    'hud.next': 'NEXT',
    'hud.combo': 'COMBO',
    'hud.bomb_ready': 'SHAKE DMG',
    'hud.connected': 'Connected',

    'over.title': 'Game Over',
    'over.record': '🏆 New Record!',
    'over.score': 'Score',
    'over.best': 'Best',
    'over.again': 'Play again',

    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.sound': 'Sound',
    'settings.vibration': 'Vibration',
    'settings.reset_record': 'Reset record',
    'settings.disconnect': 'Disconnect wallet',
    'settings.about': 'About',
    'settings.close': 'Close',
    'settings.confirm_reset': 'Reset record for sure?',
    'settings.confirm_disconnect': 'Disconnect wallet for sure?',
    'settings.yes': 'Yes',
    'settings.no': 'No',
    'settings.tutorial_reset_done': 'The tutorial will be shown the next time you enter the game.',

    'theme.pastel':     'Pastel',
    'theme.acki_nacki': 'Acki Nacki',
    'theme.exchange':   'Exchange',
    'theme.ocean':      'Ocean',
    'theme.pizza':      'Pizza',
    'theme.china':      'China',
    'theme.halloween':  'Halloween',
    'theme.christmas':  'Christmas',
    'theme.terminal':   'Terminal',
    'theme.cyberpunk':  'Cyberpunk',
    'theme.bee_engine': 'Bee Engine',
    'theme.bitcoin':    'Bitcoin',

    'about.title': 'About',
    'about.hero_tag': 'Merge coins. Earn MRG. Mine NACKL.',
    'about.entropy_title': 'Entropy from every tap',
    'about.entropy_text': 'Every finger movement and every merge generates random data. This entropy is sent to the Acki Nacki network — where it helps verify blocks on the blockchain. You play — the network gets stronger.',
    'about.mrg_title': 'MRG — in-game currency',
    'about.mrg_text': 'Each merge earns you MRG. Consecutive merges build up combos that multiply your reward. MRG accumulates between games and is spent in the shop — on themes and rare coin skins.',
    'about.earn_title': 'The path to NACKL',
    'about.earn_text': 'The final coin in the ladder is NACKL — the flagship token of the Acki Nacki network. When you reach it, you make your biggest contribution to network security.',
    'about.how_title': 'How to play',
    'about.how_step1': 'Move the coin left or right at the top of the jar with your finger.',
    'about.how_step2': 'Release — the coin drops.',
    'about.how_step3': 'Two identical coins merge into the next level up.',
    'about.how_step4': 'Goal: reach $NACKL without overflowing the jar.',
    'about.bomb_title': '💥 Shake Damage',
    'about.bomb_text': 'A special ability for critical moments. Charge only fills from BIG cascades — combos ×10 and higher. ×10 gives 35% of the bar, ×11→50%, ×12→70%, ×13+→full charge instantly. When the bar hits 100%, the dot lights up — ready to use. Tap the lightning or shake your phone: all coins in the jar explode in a wave from the center, giving you a big MRG bonus. Limit — 3 uses per game.',
    'about.boosters_title': '🛒 Boosters',
    'about.boosters_text': 'Bought in the shop for MRG. In game, activated with buttons in HUD next to Shake Damage. Each booster can be used max 3 times per game (you can buy more — they carry over).',
    'about.boosters_list1': '🗑 Remove coin (200 MRG) — deletes a random coin from the bottom half of the jar.',
    'about.boosters_list2': '⬆️ Boost +1 level (500 MRG) — your next coin spawns one level higher.',
    'about.boosters_list3': '⚡ +1 Shake charge (1000 MRG) — instantly grants one ready Shake Damage charge.',
    'about.support_title': 'Support the author',
    'about.support_text': 'The game is made by an independent developer in the Acki Nacki ecosystem. If you like it — support development with a donation.',
    'about.support_channel': "Author's channel",
    'about.support_farcaster': 'Farcaster',
    'about.support_donate': 'Donate to developer',
    'about.version': 'Version',
    'about.network': 'Network',

    // Progress / unlocks
    'progress.total': 'Progress',
    'unlock.locked': 'Locked',
    'unlock.need': 'Need',
    'unlock.title': '🎉 Theme unlocked!',
    'unlock.apply': 'Apply',
    'unlock.later': 'Later',

    'tutorial.skip': 'Skip',
    'tutorial.next': 'Next',
    'tutorial.start': 'Start',
    'tutorial.step1_title': 'Move the coin',
    'tutorial.step1_text': 'Drag your finger left or right at the top — the coin follows you.',
    'tutorial.step2_title': 'Release to drop',
    'tutorial.step2_text': 'Lift your finger and the coin drops. Aim so it meets its pair.',
    'tutorial.step3_title': 'Merge same coins',
    'tutorial.step3_text': 'Two identical coins merge into the next level up. Reach NACKL!',
    'tutorial.step4_title': '⚡ Shake Damage',
    'tutorial.step4_text': 'The Shake Damage bar fills ONLY from BIG combos — ×10 and higher. When full, the dot above the lightning lights up. Tap the lightning in HUD OR shake your phone: all coins in the jar explode in a wave. Limit — 3 charges per game.',
    'tutorial.step5_title': '🛒 Boosters',
    'tutorial.step5_text': 'Buy in shop for MRG: 🗑 remove a coin, ⬆️ next coin one level higher, ⚡ +1 Shake Damage charge. Buttons appear in HUD. Each booster — max 3 uses per game.',

    'donate.title': 'Support the author',
    'donate.subtitle': 'Choose a wallet and send any amount. Thanks for your support!',
    'donate.address': 'Wallet address',
    'donate.wallet_name': 'Wallet name',
    'donate.copy': 'Copy',
    'donate.copied': 'Copied',
    'donate.note': 'Scan the QR code in your wallet app or tap "Copy" to paste the address manually.',
    'donate.note_wallet_name': 'This is a wallet name in Acki Nacki Wallet. Open the app, find "Send by name" feature and enter the name.',
    'donate.wallet_name_hint': 'Acki Nacki network uses human-readable wallet names instead of long addresses.',

    'shop.title': 'Shop',
    'shop.tab_themes': 'Themes',
    'shop.tab_coins': 'Coins',
    'shop.tab_boosters': 'Boosters',
    'shop.boosters_hint': 'Boosters are activated in-game — buttons appear in the HUD.',
    'shop.buy': 'Buy',
    'shop.apply': 'Apply',
    'shop.active': 'Active',
    'shop.need_more': 'Need',
    'shop.set_default': 'Default set',
    'shop.set_alt': 'Alt set',

    'hud.balance': 'BALANCE',
    'hud.earned': 'EARNED',

    // Onboarding (first screen)
    'onboarding.tagline': 'Suika-style merge game in the Acki Nacki ecosystem',
    'onboarding.q_title': 'Do you already have an Acki Nacki Wallet?',
    'onboarding.q_sub': 'Needed to connect to the game and earn $NACKL rewards',
    'onboarding.rule1': 'Merge identical coins — collect $NACKL, stack MRG',
    'onboarding.rule2': "Reach the NACKL coin and don't let the jar overflow",
    'onboarding.yes_title': 'Yes, I have a wallet',
    'onboarding.yes_sub': 'Go to the game and connect',
    'onboarding.no_title': "No, I'm new",
    'onboarding.no_sub': 'Create a wallet and start mining →',
    'onboarding.disclaimer': "You can't play without a connected Acki Nacki Wallet — it's part of the ecosystem.",
  },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS['ru'];

// Определяем язык при первом запуске.
// По умолчанию игра стартует на АНГЛИЙСКОМ. Дальше — как выберет сам
// пользователь (выбор сохраняется в localStorage и имеет приоритет).
function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') return saved;
  } catch { /* */ }
  return 'en';
}

// Текущее значение и подписчики
let currentLang: Lang = detectInitialLang();
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  if (currentLang === lang) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* */ }
  listeners.forEach((cb) => cb(lang));
}

export function subscribeLang(cb: (lang: Lang) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Главная функция: t('menu.cta') → 'Подключить Acki Nacki Wallet'
export function t(key: TranslationKey): string {
  return TRANSLATIONS[currentLang][key] ?? key;
}
