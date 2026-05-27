// ============================================================
// Настройки. Минимум:
//   - Язык
//   - Звук
//   - Вибрация
//   - Отключить кошелёк
// Темы вынесены в отдельный экран "Скины".
// "Об игре" вынесена в отдельный экран из главного меню.
// ============================================================

import { useState } from 'react';
import { t, getLang, setLang, type Lang } from './i18n';
import { Settings } from './settings';
import { disconnectWallet, type WalletState } from './wallet';
import { hapticSelection, hapticImpact } from './telegram';
import { Sound } from './sound';

interface Props {
  onClose: () => void;
  onWalletDisconnect: (state: WalletState) => void;
}

type View = 'main' | 'confirmDisconnect';

export default function SettingsModal({ onClose, onWalletDisconnect }: Props) {
  const [view, setView] = useState<View>('main');
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const haptic = () => { Sound.select(); hapticSelection(); };

  const handleLang = (lang: Lang) => { setLang(lang); haptic(); rerender(); };
  const handleSound = () => { Settings.setSound(!Settings.sound); haptic(); rerender(); };
  const handleVibration = () => {
    const next = !Settings.vibration;
    Settings.setVibration(next);
    Sound.select();
    // Если включили — даём тестовый удар чтобы пользователь почувствовал что работает
    if (next) hapticImpact('medium');
    rerender();
  };

  if (view === 'confirmDisconnect') {
    return (
      <Confirm
        text={t('settings.confirm_disconnect')}
        onYes={() => onWalletDisconnect(disconnectWallet())}
        onNo={() => setView('main')}
      />
    );
  }

  const currentLang = getLang();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t('settings.title')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-row">
            <div className="setting-label">{t('settings.language')}</div>
            <div className="lang-toggle">
              <button className={`lang-btn ${currentLang === 'ru' ? 'active' : ''}`} onClick={() => handleLang('ru')}>RU</button>
              <button className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`} onClick={() => handleLang('en')}>EN</button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">{t('settings.sound')}</div>
            <Toggle checked={Settings.sound} onChange={handleSound} />
          </div>

          <div className="setting-row">
            <div className="setting-label">{t('settings.vibration')}</div>
            <Toggle checked={Settings.vibration} onChange={handleVibration} />
          </div>

          <div className="setting-actions">
            <button className="action-btn action-btn-danger" onClick={() => { Sound.click(); setView('confirmDisconnect'); }}>
              <DisconnectIcon /> <span>{t('settings.disconnect')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button className={`toggle ${checked ? 'on' : ''}`} onClick={onChange}>
      <span className="toggle-knob" />
    </button>
  );
}

function Confirm({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel confirm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-text">{text}</div>
        <div className="confirm-buttons">
          <button className="confirm-btn no" onClick={() => { Sound.click(); onNo(); }}>{t('settings.no')}</button>
          <button className="confirm-btn yes" onClick={() => { Sound.click(); onYes(); }}>{t('settings.yes')}</button>
        </div>
      </div>
    </div>
  );
}

function DisconnectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
