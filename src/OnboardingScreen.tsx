// ============================================================
// OnboardingScreen — экран приветствия для нового пользователя.
// Показывается ОДИН РАЗ при первом запуске.
//
// Спрашивает: уже есть Acki Nacki Wallet или нет?
//   - Если ДА → продолжить к меню (там обычное подключение)
//   - Если НЕТ → переадресация на майнинг-ферму бота
//                 (внешняя ссылка, открывается в Telegram)
//
// Флаг "пользователь видел onboarding" хранится в localStorage.
// ============================================================

import { tg, hapticNotification } from './telegram';
import { Sound } from './sound';
import { MINING_FARM_URL } from './config';

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
  const handleHaveWallet = () => {
    Sound.unlock();
    hapticNotification('success');
    markSeen();
    onProceed();
  };

  const handleNeedWallet = () => {
    Sound.unlock();
    hapticNotification('warning');
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
        {/* Брендовый блок с логотипом */}
        <div className="onboarding-hero">
          <img className="onboarding-logo" src="nackl_merge_logo.png" alt="NACKL MERGE" />
          <div className="onboarding-tagline">
            Suika-style merge game в экосистеме Acki Nacki
          </div>
        </div>

        {/* Вопрос */}
        <div className="onboarding-card">
          <div className="onboarding-q-title">
            У тебя уже есть Acki Nacki Wallet?
          </div>
          <div className="onboarding-q-sub">
            Это нужно для подключения к игре и получения наград $NACKL
          </div>

          {/* Краткое описание ключевых механик */}
          <div className="onboarding-rules">
            <div className="onboarding-rule">
              <span className="onboarding-rule-icon">🪙</span>
              <span>Сливай одинаковые монеты — собирай $NACKL, копи MRG</span>
            </div>
            <div className="onboarding-rule">
              <span className="onboarding-rule-icon">⚡</span>
              <span>Делай комбо ×3+ → заряжай Shake Damage. Максимум 3 использования за партию</span>
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
                <div className="onboarding-btn-title">Да, есть кошелёк</div>
                <div className="onboarding-btn-sub">Перейти в игру и подключить</div>
              </div>
            </button>

            {/* Сценарий 2: новичок */}
            <button
              className="btn-primary onboarding-btn onboarding-btn-no"
              onClick={handleNeedWallet}
            >
              <span className="onboarding-btn-icon">⚡</span>
              <div className="onboarding-btn-text">
                <div className="onboarding-btn-title">Нет, я новичок</div>
                <div className="onboarding-btn-sub">Создать кошелёк и начать майнить →</div>
              </div>
            </button>
          </div>

          <div className="onboarding-disclaimer">
            Без подключённого Acki Nacki Wallet играть нельзя — это часть экосистемы.
          </div>
        </div>
      </div>
    </div>
  );
}
