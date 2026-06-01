// ============================================================
// OnboardingScreen — экран приветствия для нового пользователя.
// Показывается ОДИН РАЗ при первом запуске.
//
// Спрашивает: уже есть Acki Nacki Wallet или нет?
//   - Если ДА → продолжить к меню (там обычное подключение)
//   - Если НЕТ → переадресация на майнинг-ферму бота
//                 (внешняя ссылка, открывается в Telegram)
//
// Язык: первый запуск на английском (см. i18n detectInitialLang).
// На этом экране есть переключатель RU/EN — выбор сохраняется и
// действует во всей игре.
//
// Флаг "пользователь видел onboarding" хранится в localStorage.
// ============================================================

import { useState } from 'react';
import { tg, hapticNotification, hapticSelection } from './telegram';
import { Sound } from './sound';
import { MINING_FARM_URL } from './config';
import { t, getLang, setLang, type Lang } from './i18n';
import { track } from './analytics';

const STORAGE_KEY = 'nackl_merge_onboarding_seen';

/** Проверка показывали ли онбординг */
export function hasSeenOnboarding(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* */ }
}

interface Props {
  onProceed: () => void;
}

export default function OnboardingScreen({ onProceed }: Props) {
  const [, force] = useState(0);
  const lang = getLang();

  const handleLang = (next: Lang) => {
    if (next === lang) return;
    Sound.select();
    hapticSelection();
    setLang(next);
    force((n) => n + 1);
  };

  const handleHaveWallet = () => {
    Sound.unlock();
    hapticNotification('success');
    track('onboarding_have_wallet');
    markSeen();
    onProceed();
  };

  const handleNeedWallet = () => {
    Sound.unlock();
    hapticNotification('warning');
    track('onboarding_need_wallet');
    // Открываем ферму. t.ackinacki.com — это внешний URL (не t.me),
    // используем openLink. Если внутри Telegram — он откроется во встроенном браузере.
    if (tg?.openLink) {
      tg.openLink(MINING_FARM_URL);
    } else {
      window.open(MINING_FARM_URL, '_blank');
    }
  };

  return (
    <div className="onboarding-screen">
      {/* Декоративные свечения */}
      <div className="menu-glow menu-glow-1" />
      <div className="menu-glow menu-glow-2" />

      <div className="onboarding-content">
        {/* Переключатель языка — выбор сохраняется на всю игру */}
        <div className="onboarding-lang">
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => handleLang('en')}
            >EN</button>
            <button
              className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
              onClick={() => handleLang('ru')}
            >RU</button>
          </div>
        </div>

        {/* Брендовый блок с логотипом */}
        <div className="onboarding-hero">
          <img className="onboarding-logo" src="nackl_merge_logo.png" alt="NACKL MERGE" />
          <div className="onboarding-tagline">
            {t('onboarding.tagline')}
          </div>
        </div>

        {/* Вопрос */}
        <div className="onboarding-card">
          <div className="onboarding-q-title">
            {t('onboarding.q_title')}
          </div>
          <div className="onboarding-q-sub">
            {t('onboarding.q_sub')}
          </div>

          {/* Краткое описание ключевых механик */}
          <div className="onboarding-rules">
            <div className="onboarding-rule">
              <span className="onboarding-rule-icon">🪙</span>
              <span>{t('onboarding.rule1')}</span>
            </div>
            <div className="onboarding-rule">
              <span className="onboarding-rule-icon">🏺</span>
              <span>{t('onboarding.rule2')}</span>
            </div>
          </div>

          <div className="onboarding-actions">
            {/* Сценарий 1: есть кошелёк */}
            <button
              className="btn-primary onboarding-btn onboarding-btn-yes"
              onClick={handleHaveWallet}
            >
              <span className="onboarding-btn-icon">✓</span>
              <div className="onboarding-btn-text">
                <div className="onboarding-btn-title">{t('onboarding.yes_title')}</div>
                <div className="onboarding-btn-sub">{t('onboarding.yes_sub')}</div>
              </div>
            </button>

            {/* Сценарий 2: новичок */}
            <button
              className="btn-primary onboarding-btn onboarding-btn-no"
              onClick={handleNeedWallet}
            >
              <span className="onboarding-btn-icon">⚡</span>
              <div className="onboarding-btn-text">
                <div className="onboarding-btn-title">{t('onboarding.no_title')}</div>
                <div className="onboarding-btn-sub">{t('onboarding.no_sub')}</div>
              </div>
            </button>
          </div>

          <div className="onboarding-disclaimer">
            {t('onboarding.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}
