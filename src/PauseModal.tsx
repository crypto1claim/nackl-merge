// ============================================================
// Модалка паузы во время игры.
// Три действия: продолжить / рестарт / выйти в меню.
// Выход в меню требует подтверждения, потому что счёт пропадёт.
// ============================================================

import { useState } from 'react';
import { t } from './i18n';
import { hapticSelection } from './telegram';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  onSettings: () => void;
}

export default function PauseModal({ onResume, onRestart, onExit, onSettings }: Props) {
  const [confirmExit, setConfirmExit] = useState(false);

  const haptic = () => hapticSelection();

  if (confirmExit) {
    return (
      <div className="modal-backdrop">
        <div className="modal-panel confirm-panel" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-text">{t('pause.confirm_exit')}</div>
          <div className="confirm-buttons">
            <button className="confirm-btn no" onClick={() => { haptic(); setConfirmExit(false); }}>
              {t('settings.no')}
            </button>
            <button className="confirm-btn yes" onClick={() => { haptic(); onExit(); }}>
              {t('settings.yes')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel pause-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pause-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        </div>
        <div className="pause-title">{t('pause.title')}</div>

        <div className="pause-buttons">
          <button className="btn-primary" onClick={() => { haptic(); onResume(); }}>
            ▶ {t('pause.resume')}
          </button>
          <button className="action-btn pause-action" onClick={() => { haptic(); onSettings(); }}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span> {t('settings.title')}
          </button>
          <button className="action-btn pause-action" onClick={() => { haptic(); onRestart(); }}>
            <span>🔄</span> {t('pause.restart')}
          </button>
          <button className="action-btn pause-action" onClick={() => { haptic(); setConfirmExit(true); }}>
            <span>🚪</span> {t('pause.menu')}
          </button>
        </div>
      </div>
    </div>
  );
}
