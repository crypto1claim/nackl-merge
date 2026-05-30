import { useEffect } from 'react';
import { Sound } from './sound';
import { formatMRG } from './currency';
import { hapticNotification } from './telegram';

interface Props {
  amount: number;
  streak: number;
  onClose: () => void;
}

export default function DailyBonusModal({ amount, streak, onClose }: Props) {
  useEffect(() => {
    Sound.fanfare();
    hapticNotification('success');
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel daily-bonus-panel" onClick={(e) => e.stopPropagation()}>
        <div className="daily-bonus-header">
          <div className="daily-bonus-emoji">🎁</div>
          <div className="daily-bonus-title">Ежедневный бонус</div>
          <div className="daily-bonus-streak">
            Стрик: <b>{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</b>
          </div>
        </div>

        <div className="daily-bonus-amount">
          <span className="daily-bonus-plus">+</span>
          <span className="daily-bonus-value">{formatMRG(amount)}</span>
          <span className="daily-bonus-currency">MRG</span>
        </div>

        <div className="daily-bonus-streak-row">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const reached = streak >= d;
            const isCurrent = streak === d;
            return (
              <div
                key={d}
                className={`daily-streak-dot ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}
                title={`День ${d}`}
              >
                {d}
              </div>
            );
          })}
        </div>

        <p className="daily-bonus-hint">
          Заходи каждый день — стрик растёт, награды больше!
        </p>

        <button className="btn-primary" onClick={() => { Sound.click(); onClose(); }}>
          Забрать
        </button>
      </div>
    </div>
  );
}
