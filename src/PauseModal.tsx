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
}

export default function PauseModal({ onResume, onRestart, onExit }: Props) {
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
