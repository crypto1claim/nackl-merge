// ============================================================
// Магазин: вкладки "Темы" и "Монеты".
// Темы: одна карточка на тему.
// Монеты: 11 строк по уровням, в каждой 2 варианта default/alt.
// ============================================================

import { useState } from 'react';
import { t } from './i18n';
import { hapticSelection, hapticNotification } from './telegram';
import { Sound } from './sound';
import { THEMES, getTheme, setTheme } from './themes';
import { ThemePreview } from './ThemePreview';
import {
  COIN_SET_DEFAULT, COIN_SET_ALT, getVariant, setVariant, type CoinVariant,
} from './coin_sets';
import { isOwned, buyItem, getPrice, type ItemId } from './shop';
import { track } from './analytics';
import { getBalance, formatMRG } from './currency';
import { POWERUPS, buy as buyPowerup, getCount as getPowerupCount } from './powerups';

interface Props {
  onBack: () => void;
}

type Tab = 'themes' | 'coins' | 'boosters';

export default function ShopScreen({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('themes');
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  return (
    <div className="shop-screen">
      <div className="menu-glow menu-glow-1" />
      <div className="menu-glow menu-glow-2" />

      <div className="shop-header">
        <button className="skins-back" onClick={() => { Sound.click(); onBack(); }} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="shop-header-title">{t('shop.title')}</div>
        <div className="shop-balance">
          <span className="shop-balance-value">{formatMRG(getBalance())}</span>
          <span className="shop-balance-currency">MRG</span>
        </div>
      </div>

      <div className="shop-tabs">
        <button
          className={`shop-tab ${tab === 'themes' ? 'active' : ''}`}
          onClick={() => { Sound.select(); setTab('themes'); }}
        >{t('shop.tab_themes')}</button>
        <button
          className={`shop-tab ${tab === 'coins' ? 'active' : ''}`}
          onClick={() => { Sound.select(); setTab('coins'); }}
        >{t('shop.tab_coins')}</button>
        <button
          className={`shop-tab ${tab === 'boosters' ? 'active' : ''}`}
          onClick={() => { Sound.select(); setTab('boosters'); }}
        >{t('shop.tab_boosters')}</button>
      </div>

      <div className="shop-content">
        {tab === 'themes'   ? <ThemesTab   onChange={rerender} /> :
         tab === 'coins'    ? <CoinsTab    onChange={rerender} /> :
                              <BoostersTab onChange={rerender} />}
      </div>
    </div>
  );
}

// ============================================================
// Вкладка ТЕМЫ
// ============================================================
function ThemesTab({ onChange }: { onChange: () => void }) {
  const current = getTheme();
  return (
    <div className="shop-list">
      {Object.values(THEMES).filter((theme) => !theme.hidden).map((theme) => {
        const itemId: ItemId = `theme:${theme.id}`;
        const owned = isOwned(itemId);
        const price = getPrice(itemId);
        const active = current.id === theme.id;

        return (
          <ShopRow
            key={theme.id}
            owned={owned}
            active={active}
            price={price}
            title={t(theme.nameKey as any)}
            preview={<ThemePreview themeId={theme.id} />}
            onBuy={() => {
              if (buyItem(itemId)) {
                Sound.purchase();
                hapticNotification('success');
                track('theme_purchase', { theme: theme.id, price });
                onChange();
              } else {
                Sound.click();
                hapticNotification('error');
              }
            }}
            onApply={() => {
              setTheme(theme.id);
              Sound.select();
              hapticSelection();
              onChange();
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// Вкладка МОНЕТЫ — 11 строк по уровням
// ============================================================
function CoinsTab({ onChange }: { onChange: () => void }) {
  return (
    <div className="coins-grid">
      {COIN_SET_DEFAULT.map((_, level) => (
        <CoinLevelRow key={level} level={level} onChange={onChange} />
      ))}
    </div>
  );
}

function CoinLevelRow({ level, onChange }: { level: number; onChange: () => void }) {
  const def = COIN_SET_DEFAULT[level];
  const alt = COIN_SET_ALT[level];
  const activeVariant = getVariant(level);

  return (
    <div className="coin-level-row">
      <div className="coin-level-label">LV {level + 1}</div>
      <CoinSlot
        level={level}
        ticker={def.ticker}
        variant="default"
        active={activeVariant === 'default'}
        onChange={onChange}
      />
      <div className="coin-level-vs">vs</div>
      <CoinSlot
        level={level}
        ticker={alt.ticker}
        variant="alt"
        active={activeVariant === 'alt'}
        onChange={onChange}
      />
    </div>
  );
}

function CoinSlot({
  level, ticker, variant, active, onChange,
}: {
  level: number;
  ticker: string;
  variant: CoinVariant;
  active: boolean;
  onChange: () => void;
}) {
  const itemId: ItemId = `coin:${level}:${variant}`;
  const owned = isOwned(itemId);
  const price = getPrice(itemId);
  const balance = getBalance();
  const canAfford = balance >= price;

  const handleClick = () => {
    if (active) return; // уже активно
    if (!owned) {
      // покупаем
      if (buyItem(itemId)) {
        Sound.purchase();
        hapticNotification('success');
        // После покупки — сразу активируем
        setVariant(level, variant);
        onChange();
      } else {
        Sound.click();
        hapticNotification('error');
      }
    } else {
      // переключаем
      setVariant(level, variant);
      Sound.select();
      hapticSelection();
      onChange();
    }
  };

  const ext = ['NACKL', 'SHELL', 'NOT', 'SUI', 'MON', 'CORE', 'NEAR'].includes(ticker) ? 'png' : 'svg';
  const fileMap: Record<string, string> = { TRX: 'trx' };
  const base = fileMap[ticker] ?? ticker.toLowerCase();

  return (
    <button
      className={`coin-slot ${active ? 'active' : ''} ${!owned ? 'locked' : ''}`}
      onClick={handleClick}
      disabled={!owned && !canAfford}
    >
      {owned ? (
        <>
          <img
            src={`coins/${base}.${ext}`}
            alt={ticker}
            className="coin-slot-img"
          />
          <div className="coin-slot-ticker">{ticker}</div>
        </>
      ) : (
        <>
          {/* Скрытая монета — мистический силуэт с ? */}
          <div className="coin-slot-mystery">
            <svg viewBox="0 0 64 64" className="coin-slot-mystery-svg" aria-hidden="true">
              <defs>
                <radialGradient id={`mystery-${level}-${variant}`}>
                  <stop offset="0%" stopColor="#3a3845" stopOpacity="0.95"/>
                  <stop offset="70%" stopColor="#1a1820" stopOpacity="0.95"/>
                  <stop offset="100%" stopColor="#0a0810" stopOpacity="0.95"/>
                </radialGradient>
              </defs>
              <circle cx="32" cy="32" r="28" fill={`url(#mystery-${level}-${variant})`} stroke="#5a5870" strokeWidth="1" strokeDasharray="3 2"/>
              <text x="32" y="42" textAnchor="middle" fontSize="28" fill="#8a88a0" fontWeight="900">?</text>
            </svg>
          </div>
          <div className="coin-slot-ticker mystery">???</div>
        </>
      )}
      {!owned && (
        <div className={`coin-slot-price ${!canAfford ? 'unaffordable' : ''}`}>
          {formatMRG(price)}
        </div>
      )}
      {active && (
        <div className="coin-slot-check">✓</div>
      )}
    </button>
  );
}

// ============================================================
// Универсальная строка магазина (для тем)
// ============================================================
interface RowProps {
  owned: boolean;
  active: boolean;
  price: number;
  title: string;
  preview: React.ReactNode;
  onBuy: () => void;
  onApply: () => void;
}

function ShopRow({ owned, active, price, title, preview, onBuy, onApply }: RowProps) {
  const balance = getBalance();
  const canAfford = balance >= price;

  return (
    <div className={`shop-card ${active ? 'active' : ''}`}>
      <div className="shop-card-preview">{preview}</div>
      <div className="shop-card-info">
        <div className="shop-card-title">{title}</div>
        {!owned ? (
          <div className="shop-card-price">
            <span className="shop-card-price-value">{formatMRG(price)}</span>
            <span className="shop-card-price-currency">MRG</span>
          </div>
        ) : active ? (
          <div className="shop-card-active-label">✓ {t('shop.active')}</div>
        ) : null}
        {!owned && (
          <button
            className={`shop-card-btn shop-card-btn-buy ${!canAfford ? 'disabled' : ''}`}
            onClick={canAfford ? onBuy : undefined}
            disabled={!canAfford}
          >
            {canAfford ? t('shop.buy') : `${t('shop.need_more')} ${formatMRG(price - balance)}`}
          </button>
        )}
        {owned && !active && (
          <button className="shop-card-btn shop-card-btn-apply" onClick={onApply}>
            {t('shop.apply')}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Вкладка БУСТЕРЫ
// ============================================================
function BoostersTab({ onChange }: { onChange: () => void }) {
  const balance = getBalance();
  return (
    <div className="shop-list">
      <div className="boosters-hint">
        {t('shop.boosters_hint')}
      </div>
      {POWERUPS.map((pu) => {
        const owned = getPowerupCount(pu.id);
        const canAfford = balance >= pu.price;
        const handleBuy = () => {
          if (buyPowerup(pu.id)) {
            Sound.purchase();
            hapticNotification('success');
            onChange();
          } else {
            Sound.click();
            hapticNotification('error');
          }
        };
        return (
          <div key={pu.id} className="booster-card">
            <div className="booster-icon">{pu.icon}</div>
            <div className="booster-body">
              <div className="booster-title">
                {pu.title}
                {owned > 0 && <span className="booster-count">×{owned}</span>}
              </div>
              <div className="booster-desc">{pu.description}</div>
              <div className="booster-price-row">
                <span className="booster-price">{formatMRG(pu.price)} MRG</span>
                <button
                  className={`booster-buy ${!canAfford ? 'disabled' : ''}`}
                  onClick={canAfford ? handleBuy : undefined}
                  disabled={!canAfford}
                >
                  {canAfford ? t('shop.buy') : `${t('shop.need_more')} ${formatMRG(pu.price - balance)}`}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
