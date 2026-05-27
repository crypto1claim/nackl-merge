# Деплой Acki Merge в Telegram

Пошаговая инструкция от состояния «папка с кодом» до «бот в Telegram открывает игру».

---

## Часть 1. Подготовка аккаунтов (5 минут)

### 1.1 GitHub
1. Открой https://github.com → Sign up (если нет аккаунта)
2. Подтверди email
3. Готово

### 1.2 Vercel
1. Открой https://vercel.com → Sign Up
2. Нажми **Continue with GitHub** — он сам авторизуется через GitHub-логин
3. На вопросах нажимай Skip / I'll do it later
4. Готово, ты в дашборде Vercel

### 1.3 BotFather в Telegram
1. В Telegram найди `@BotFather`
2. Отправь команду `/newbot`
3. На вопрос «name» — введи **Acki Merge** (или как назовёшь)
4. На вопрос «username» — введи что-то уникальное, обязательно с `_bot` на конце, например `acki_merge_game_bot`
5. BotFather пришлёт тебе **TOKEN** вида `7984xxxxxx:AAFxxxxxxxxxxxxxxx`
6. **Сохрани этот токен в безопасное место** — он понадобится позже. НИКОМУ не показывай, не клади в код, не клади в публичный репозиторий

Пока ничего больше с ботом не делай — мы вернёмся к нему после деплоя.

---

## Часть 2. Загрузка кода на GitHub (5 минут)

В терминале на твоём Mac:

```bash
cd /Users/vladislav/Downloads/acki-merge

# Инициализируем git репозиторий
git init
git add .
git commit -m "Initial commit: Acki Merge"

# Создаём репозиторий на GitHub
# Открой https://github.com/new
# - Repository name: acki-merge
# - НЕ ставь галочки на README/gitignore/license — у нас уже есть
# - Нажми Create repository
# GitHub покажет инструкцию. Скопируй команды из секции
# "...or push an existing repository from the command line"
# и выполни их. Будет что-то вроде:

git remote add origin https://github.com/ТВОЙ_USERNAME/acki-merge.git
git branch -M main
git push -u origin main
```

После `git push` обнови страницу GitHub — увидишь свои файлы.

---

## Часть 3. Деплой на Vercel (3 минуты)

1. Открой https://vercel.com/new
2. Найди в списке свой репо **acki-merge**, нажми **Import**
3. На странице «Configure Project»:
   - **Framework Preset**: Vite (определится сам)
   - **Build Command**: оставь по умолчанию (`npm run build`)
   - **Output Directory**: `dist`
   - Environment Variables: пока ничего не добавляй
4. Нажми **Deploy**
5. Подожди 1-2 минуты — Vercel соберёт проект и даст URL вида:
   ```
   https://acki-merge-abcd1234.vercel.app
   ```
6. Открой этот URL в браузере — игра должна работать

**Каждый раз когда сделаешь `git push`** — Vercel автоматически пересоберёт и обновит сайт.

---

## Часть 4. Привязка к Telegram-боту (5 минут)

Теперь подключаем бот к деплоеному сайту.

1. В Telegram открой `@BotFather`, отправь:
   ```
   /mybots
   ```
2. Выбери своего бота
3. Нажми **Bot Settings** → **Menu Button** → **Configure menu button**
4. Введи URL твоего деплоя:
   ```
   https://acki-merge-abcd1234.vercel.app
   ```
5. Введи текст кнопки: `Играть` или `Open game`

Теперь у бота появится постоянная кнопка снизу, открывающая игру в Mini App.

### Дополнительно — настройка через `/setmenubutton`:
```
/setmenubutton
→ выбери бота
→ URL: https://...vercel.app
→ Text: Играть
```

### Тестируй
1. В Telegram найди своего бота по username (например `@acki_merge_game_bot`)
2. Нажми **Start**
3. Внизу появится кнопка — тапни её
4. Игра должна открыться **внутри Telegram** как Mini App

---

## Часть 5. Что обновить ПЕРЕД production-релизом

Открой эти файлы и поменяй placeholder'ы на свои:

### `src/AboutScreen.tsx`
Найди и замени:
- `https://t.me/your_channel` → твой реальный канал в Telegram
- URL для доната (если есть) — в коде сейчас тоже placeholder

### Иконка бота
В BotFather:
```
/setuserpic
→ выбери бота
→ загрузи квадратную картинку 512×512 (логотип игры)
```

### Описание бота
```
/setdescription
→ выбери бота
→ введи 1-2 предложения, например:
"Suika-style merge game в экосистеме Acki Nacki. Объединяй криптомонеты, добывай $NACKL."
```

### Кастомный домен (опционально)
В Vercel дашборде → Project → Settings → Domains
- Купи домен где-нибудь (например acki-merge.io)
- Добавь его в Vercel
- Vercel даст инструкции для DNS-записей
- Через 5-10 минут заработает на твоём домене

---

## Часть 6. Bee Engine SDK (когда будешь готов)

Документация SDK: https://dev.ackinacki.com/bee-engine/bee-engine-sdk-integration-documentation

После того как прочитаешь доки и разберёшься с регистрацией App ID — пришлёшь Claude:
1. Свой `APP_ID` (после регистрации dapp)
2. Информацию о том как у тебя авторизация (AN Wallet name)

Claude интегрирует SDK в проект — добавит вызовы:
- `bee_engine_miner.can_start_mining()` — проверка перед каждой партией
- `bee_engine_miner.start_mining(duration)` — старт майнинга при начале игры
- `bee_engine_miner.add_action()` — на каждый тап/слияние
- `bee_engine_miner.collect_rewards()` — забор наград
- Подключим UI с балансом NACKL вместо плейсхолдеров

---

## Troubleshooting

### «Vercel build failed»
Скорее всего ошибка в коде. Открой логи в Vercel → Deployment → View Function Logs.
Чаще всего проблема — TypeScript-ошибка. Локально проверь:
```bash
npm run build
```
Если локально собирается — пушится без проблем.

### «Telegram Mini App не открывается»
1. Проверь что URL в BotFather начинается с **https://**
2. Открой URL в Safari/Chrome — должна работать вне Telegram
3. В Telegram Desktop часто кэширует — попробуй на телефоне

### «localhost:5173 не помогает разработке»
Это нормально — localhost не работает в Telegram. Всегда деплой и тестируй на live URL.

---

## Чек-лист готовности к публичному запуску

- [ ] Vercel-сайт работает (открывается из браузера, играется)
- [ ] Telegram-бот настроен (Menu Button → URL)
- [ ] Иконка бота загружена
- [ ] Описание бота заполнено
- [ ] Placeholder URL в `AboutScreen.tsx` заменены
- [ ] Bee Engine SDK интегрирован (когда будешь готов)
- [ ] Кастомный домен (опционально)

После всего этого можешь делиться ссылкой на бота — игра пойдёт в люди.
