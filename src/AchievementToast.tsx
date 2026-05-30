import { useEffect, useState } from 'react';
import { onUnlock, type AchievementDef } from './achievements';
import { Sound } from './sound';
import { hapticNotification } from './telegram';
import { formatMRG } from './currency';

/** Стек тостов — показывает разблокированные достижения друг за другом */
export default function AchievementToast() {
  const [queue, setQueue] = useState<AchievementDef[]>([]);

  useEffect(() => {
    const unsub = onUnlock((def) => {
      setQueue((q) => [...q, def]);
      Sound.fanfare();
      hapticNotification('success');
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3800);
    return () => clearTimeout(t);
  }, [queue]);

  const current = queue[0];
  if (!current) return null;

  return (
    <div key={current.id + queue.length} className="ach-toast">
      <div className="ach-toast-icon">{current.icon}</div>
      <div className="ach-toast-body">
        <div className="ach-toast-label">ДОСТИЖЕНИЕ</div>
        <div className="ach-toast-title">{current.title}</div>
        <div className="ach-toast-reward">+{formatMRG(current.reward)} MRG</div>
      </div>
    </div>
  );
}
