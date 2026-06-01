import { useState } from 'react';
import { connectWallet, confirmAuthorization, type WalletState } from './wallet';
import { hapticSelection, hapticImpact, hapticNotification, tg } from './telegram';
import { t } from './i18n';
import { COIN_SET_DEFAULT, COIN_SET_ALT } from './coin_sets';
import { Sound } from './sound';
import ThemeDecor from './ThemeDecor';
import { formatMRG } from './currency';

interface Props {
  onConnected: (state: WalletState) => void;
  onSettings: () => void;
  onShop: () => void;
  onAbout: () => void;
  onAchievements: () => void;
  onPlay: () => void;
  walletConnected: boolean;
  balance: number;
}

export default function MenuScreen({ onConnected, onSettings, onShop, onAbout, onAchievements, onPlay, walletConnected, balance }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState('');
  const [pendingState, setPendingState] = useState<WalletState | null>(null);
  const [waitingConfirm, setWaitingConfirm] = useState(false);
  // Прогресс загрузки WASM-движка (~7.7МБ): null = ещё не грузим / уже готов.
  const [wasmProgress, setWasmProgress] = useState<number | null>(null);

  const handleConnect = async () => {
    if (!walletName.trim()) { setError(t('menu.err_enter_name')); return; }
    setConnecting(true);
    setError(null);
    setWasmProgress(0);
    Sound.click();
    hapticImpact('medium');
    try {
      const state = await connectWallet(walletName.trim(), (pct) => setWasmProgress(pct));
      if (state.minerReady) {
        Sound.fanfare();
        hapticNotification('success');
        onConnected(state);
      } else {
        setPendingState(state);
        setConnecting(false);
      }
    } catch (e) {
      const msg = String((e as any)?.message ?? e);
      // Самая частая причина — пользователь ввёл имя, которого нет в сети
      // (get_miner_address_by_wallet_name → KitError Account 205).
      if (/wallet name|miner address|account|205|not found/i.test(msg)) {
        setError(t('menu.err_not_found'));
      } else if (/wasm|fetch|network|load|http|abort/i.test(msg)) {
        // Сбой загрузки движка (плохая сеть/таймаут). Кнопка остаётся —
        // повторное нажатие = ретрай (initBeeEngine докачает с нуля).
        setError(t('menu.error_engine'));
      } else {
        setError(t('menu.error'));
      }
      hapticNotification('error');
      setConnecting(false);
    } finally {
      setWasmProgress(null);
    }
  };

  const handleConfirmAuth = async () => {
    if (!pendingState?.address) return;
    setWaitingConfirm(true);
    setError(null);
    try {
      const state = await confirmAuthorization(pendingState.address);
      Sound.fanfare();
      hapticNotification('success');
      onConnected(state);
    } catch {
      setError(t('menu.err_not_confirmed'));
      hapticNotification('error');
    } finally {
      setWaitingConfirm(false);
    }
  };

  const handlePlay = () => {
    Sound.click();
    hapticImpact('medium');
    onPlay();
  };

  const handleTile = (cb: () => void) => () => {
    Sound.select();
    hapticSelection();
    cb();
  };

  return (
    <div className="menu-screen">
      <ThemeDecor />
      <div className="menu-glow menu-glow-1" />
      <div className="menu-glow menu-glow-2" />
      <div className="menu-glow menu-glow-3" />

      <div className="menu-content">
        {/* Брендовая композиция: NACKL MERGE по центру без отвлекающих элементов */}
        <div className="brand-stage">
          {/* Центральный логотип — полная композиция NACKL MERGE с короной и банкой */}
          <div className="brand-nackl-wrap">
            <div className="brand-nackl-halo" />
            <img className="brand-nackl brand-nackl-full" src="nackl_merge_logo.png" alt="NACKL MERGE" />
          </div>
        </div>

        <h1 className="menu-hero-brand">NACKL MERGE</h1>
        <p className="menu-tagline">{t('menu.subtitle')}</p>

        {/* Баланс MRG — показывается всегда, даже когда 0 */}
        <div className="menu-balance">
          <span className="menu-balance-label">{t('hud.balance')}</span>
          <span className="menu-balance-value">{formatMRG(balance)}</span>
          <span className="menu-balance-currency">MRG</span>
        </div>

        {/* Эволюционная лестница — все 22 монеты с автопрокруткой */}
        <div className="evolution-strip">
          <div className="evolution-marquee">
            {/* Два прохода подряд для seamless loop */}
            {[0, 1].map((pass) => (
              <div key={pass} className="evolution-track" aria-hidden={pass === 1}>
                {/* Default набор */}
                {COIN_SET_DEFAULT.map((c, i) => (
                  <div key={`d${pass}-${i}`} className="evolution-coin-wrap">
                    <CoinThumb ticker={c.ticker} size={32} />
                    <span className="evolution-arrow">›</span>
                  </div>
                ))}
                {/* Разделитель между наборами */}
                <div className="evolution-divider">|</div>
                {/* Alt набор */}
                {COIN_SET_ALT.map((c, i) => (
                  <div key={`a${pass}-${i}`} className="evolution-coin-wrap">
                    <CoinThumb ticker={c.ticker} size={32} />
                    {i < COIN_SET_ALT.length - 1 && <span className="evolution-arrow">›</span>}
                  </div>
                ))}
                {/* Заглушка-разделитель между повторами */}
                <div className="evolution-divider">|</div>
              </div>
            ))}
          </div>
        </div>

        {/* Тайлы: Магазин · Достижения · Об игре · Настройки */}
        <div className="menu-tiles menu-tiles-4">
          <button className="menu-tile" onClick={handleTile(onShop)}>
            <ShopIcon />
            <div className="menu-tile-title">{t('menu.shop')}</div>
          </button>
          <button className="menu-tile" onClick={handleTile(onAchievements)}>
            <TrophyIcon />
            <div className="menu-tile-title">{t('menu.rewards')}</div>
          </button>
          <button className="menu-tile" onClick={handleTile(onAbout)}>
            <InfoIcon />
            <div className="menu-tile-title">{t('menu.about_short')}</div>
          </button>
          <button className="menu-tile" onClick={handleTile(onSettings)}>
            <SettingsIcon />
            <div className="menu-tile-title">{t('settings.title')}</div>
          </button>
        </div>

        {error && <div className="menu-error">{error}</div>}

        {walletConnected ? (
          <button className="menu-cta" onClick={handlePlay}>
            <PlayIcon /> {t('menu.play')}
          </button>
        ) : pendingState?.pendingDeepLink ? (
          <div className="menu-wallet-connect">
            <p className="menu-auth-hint">{t('menu.auth_hint')}</p>
            <button
              className="menu-cta menu-cta-deeplink"
              onClick={() => {
                const url = pendingState.pendingDeepLink!;
                Sound.click();
                hapticImpact('medium');
                // Внутри Telegram обычный target="_blank" часто не открывает внешнюю
                // ссылку — нужно дёргать нативный openLink. Фолбэк на window.open для браузера.
                if (tg?.openLink) tg.openLink(url);
                else window.open(url, '_blank', 'noopener');
              }}
            >
              <WalletIcon /> {t('menu.open_wallet')}
            </button>
            <button
              className={`menu-cta menu-cta-secondary ${waitingConfirm ? 'connecting' : ''}`}
              onClick={handleConfirmAuth}
              disabled={waitingConfirm}
            >
              {waitingConfirm ? <><span className="spinner" />{t('menu.checking')}</> : <>{t('menu.confirmed_btn')}</>}
            </button>
            {error && <p className="menu-error">{error}</p>}
          </div>
        ) : (
          <div className="menu-wallet-connect">
            <p className="menu-auth-hint">{t('menu.need_wallet_hint')}</p>
            <input
              className="menu-wallet-input"
              type="text"
              placeholder={t('menu.name_placeholder')}
              value={walletName}
              onChange={e => setWalletName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              onFocus={(e) => {
                // На iOS клавиатура поднимается ~300мс — после её появления
                // прокручиваем поле так, чтобы оно гарантированно было над ней.
                setTimeout(() => {
                  e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }, 350);
              }}
              disabled={connecting}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              className={`menu-cta ${connecting ? 'connecting' : ''}`}
              onClick={handleConnect}
              disabled={connecting || !walletName.trim()}
            >
              {connecting
                ? <><span className="spinner" />{
                    wasmProgress !== null && wasmProgress < 100
                      ? `${t('menu.loading_engine')} ${wasmProgress}%`
                      : t('menu.connecting')
                  }</>
                : <><WalletIcon />{t('menu.cta')}</>}
            </button>
            {error && <p className="menu-error">{error}</p>}
          </div>
        )}

        <p className="menu-footer">{t('menu.footer')}</p>
      </div>
    </div>
  );
}

function CoinThumb({ ticker, size }: { ticker: string; size: number }) {
  const ext = ['NACKL', 'SHELL', 'NOT', 'SUI', 'MON', 'CORE', 'NEAR'].includes(ticker) ? 'png' : 'svg';
  const fileMap: Record<string, string> = { TRX: 'trx' };
  const base = fileMap[ticker] ?? ticker.toLowerCase();
  return (
    <img
      src={`coins/${base}.${ext}`}
      alt={ticker}
      width={size}
      height={size}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
    />
  );
}

function ShopIcon() {
  return (
    <svg className="tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/>
      <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 10}}>
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 10}}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg className="tile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
