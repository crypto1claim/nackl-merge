import { getAllProgress, ACHIEVEMENTS } from './achievements';
import { Sound } from './sound';
import { hapticSelection } from './telegram';
import { formatMRG } from './currency';

interface Props {
  onBack: () => void;
}

export default function AchievementsScreen({ onBack }: Props) {
  const items = getAllProgress();
  const unlockedCount = items.filter((i) => i.unlocked).length;
  const total = ACHIEVEMENTS.length;

  const handleBack = () => { Sound.click(); hapticSelection(); onBack(); };

  return (
    <div className="about-screen">
      <div className="menu-glow menu-glow-1" />
      <div className="menu-glow menu-glow-2" />

      <div className="about-header">
        <button className="skins-back" onClick={handleBack} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="about-header-title">Достижения</div>
      </div>

      <div className="about-content">
        <div className="ach-progress-summary">
          <div className="ach-progress-num">{unlockedCount} / {total}</div>
          <div className="ach-progress-bar">
            <div className="ach-progress-fill" style={{ width: `${(unlockedCount / total) * 100}%` }} />
          </div>
        </div>

        <div className="ach-list">
          {items.map(({ def, unlocked }) => (
            <div key={def.id} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-card-icon">{unlocked ? def.icon : '🔒'}</div>
              <div className="ach-card-body">
                <div className="ach-card-title">{def.title}</div>
                <div className="ach-card-desc">{def.description}</div>
              </div>
              <div className="ach-card-reward">
                +{formatMRG(def.reward)}
                <span>MRG</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
