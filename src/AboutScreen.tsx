// ============================================================
// Подробное описание игры — что такое Acki Merge,
// энтропия касаний и верификация блоков.
// Отдельный полноэкранный экран, не модалка.
// ============================================================

import { useState } from 'react';
import { t } from './i18n';
import { Sound } from './sound';
import { hapticSelection } from './telegram';
import DonateModal from './DonateModal';
import { FARCASTER_URL } from './config';

interface Props {
  onBack: () => void;
}

export default function AboutScreen({ onBack }: Props) {
  const [showDonate, setShowDonate] = useState(false);

  const handleBack = () => {
    Sound.click();
    hapticSelection();
    onBack();
  };

  return (
    <div className="about-screen">
      <div className="menu-glow menu-glow-1" />
      <div className="menu-glow menu-glow-2" />

      <div className="about-header">
        <button className="skins-back" onClick={handleBack} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="about-header-title">{t('about.title')}</div>
      </div>

      <div className="about-content">
        {/* Херо */}
        <div className="about-hero">
          <img className="about-hero-logo about-hero-logo-full" src="nackl_merge_logo.png" alt="NACKL MERGE"/>
          <div className="about-hero-brand">NACKL MERGE</div>
          <div className="about-hero-tag">{t('about.hero_tag')}</div>
        </div>

        {/* Главный смысл */}
        <div className="about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.entropy_title')}</div>
          <div className="about-card-text">{t('about.entropy_text')}</div>
        </div>

        {/* MRG — игровая валюта */}
        <div className="about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 9h6M9 12h6M9 15h4"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.mrg_title')}</div>
          <div className="about-card-text">{t('about.mrg_text')}</div>
        </div>

        {/* Как зарабатывать */}
        {/* Как играть */}
        <div className="about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.how_title')}</div>
          <ol className="about-steps">
            <li>{t('about.how_step1')}</li>
            <li>{t('about.how_step2')}</li>
            <li>{t('about.how_step3')}</li>
            <li>{t('about.how_step4')}</li>
          </ol>
        </div>

        {/* Карточка про механику BOMB */}
        <div className="about-card">
          <div className="about-card-icon" style={{ background: 'linear-gradient(135deg, #ff5a3a, #c01a10)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 L4 14 h7 l-2 8 L20 10 h-7 l2-8z"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.bomb_title')}</div>
          <div className="about-card-text">{t('about.bomb_text')}</div>
        </div>

        {/* Карточка про бустеры */}
        <div className="about-card">
          <div className="about-card-icon" style={{ background: 'linear-gradient(135deg, #6affe0, #2a8870)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 L18 2 L20 6 L12 22 L4 6 Z"/>
              <path d="M12 6 L12 12"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.boosters_title')}</div>
          <div className="about-card-text">{t('about.boosters_text')}</div>
          <ul className="about-steps">
            <li>{t('about.boosters_list1')}</li>
            <li>{t('about.boosters_list2')}</li>
            <li>{t('about.boosters_list3')}</li>
          </ul>
        </div>

        {/* Карточка "Поддержать автора" — кнопки канала и доната */}
        <div className="about-card about-card-support">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="about-card-title">{t('about.support_title')}</div>
          <div className="about-card-text">{t('about.support_text')}</div>
          <div className="support-buttons">
            <a
              className="support-btn support-btn-farcaster"
              href={FARCASTER_URL}
              target="_blank" rel="noopener noreferrer"
              onClick={() => Sound.click()}
            >
              <img src="farcaster.png" alt="Farcaster" className="support-btn-icon-img"/>
              <span>{t('about.support_farcaster')}</span>
            </a>
            <button
              className="support-btn support-btn-donate"
              onClick={() => { Sound.click(); setShowDonate(true); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{t('about.support_donate')}</span>
            </button>
          </div>
        </div>

        {/* Мета-инфо */}
        <div className="about-meta-row">
          <div className="about-meta-item">
            <div className="about-meta-label">{t('about.version')}</div>
            <div className="about-meta-value">1.0.0</div>
          </div>
          <div className="about-meta-item">
            <div className="about-meta-label">{t('about.network')}</div>
            <div className="about-meta-value">Acki Nacki</div>
          </div>
        </div>
      </div>

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
    </div>
  );
}
