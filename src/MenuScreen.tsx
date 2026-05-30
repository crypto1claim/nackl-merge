import { useState, useEffect } from 'react';
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
  onPlay: () => void;
  walletConnected: boolean;
  balance: number;
}

export default function MenuScreen({ onConnected, onSettings, onShop, onAbout, onPlay, walletConnected, balance }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState('');
  const [pendingState, setPendingState] = useState<WalletState | null>(null);
  const [waitingConfirm, setWaitingConfirm] = useState(false);
  // Сдвиг контента вверх, когда открыта экранная клавиатура (чтобы поле ввода
  // имени кошелька не пряталось за ней). Считаем по visualViewport.
  const [kbShift, setKbShift] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const recompute = () => {
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const focused = document.activeElement?.classList?.contains('menu-wallet-input');
      // Поднимаем контент примерно на 55% высоты клавиатуры — этого хватает,
      // чтобы поле и кнопка оказались над ней, и не уезжало слишком высоко.
      setKbShift(focused && keyboard > 120 ? Math.min(Math.round(keyboard * 0.55), 240) : 0);
    };
    vv.addEventListener('resize', recompute);
    vv.addEventListener('scroll', recompute);
    return () => { vv.removeEventListener('resize', recompute); vv.removeEventListener('scroll', recompute); };
  }, []);

  // Когда поле теряет фокус — гарантированно возвращаем контент на место.
  useEffect(() => { if (!inputFocused) setKbShift(0); }, [inputFocused]);

  const handleConnect = async () => {
    if (!walletName.trim()) { setError('Введи имя AN Wallet'); return; }
    setConnecting(true);
    setError(null);
    Sound.click();
    hapticImpact('medium');
    try {
      const state = await connectWallet(walletName.trim());
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
        setError('AN Wallet с таким именем не найден. Установи AN Wallet, зарегистрируй имя и введи его точно.');
      } else {
        setError(t('menu.error'));
      }
      hapticNotification('error');
      setConnecting(false);
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
      setError('Подтверждение не получено. Убедись что открыл AN Wallet и подтвердил.');
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

      <div
        className="menu-content"
        style={{ transform: kbShift ? `translateY(-${kbShift}px)` : undefined, transition: 'transform 0.25s ease' }}
      >
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

        {/* Тайлы: Магазин · Об игре · Настройки */}
        <div className="menu-tiles menu-tiles-3">
          <button className="menu-tile" onClick={handleTile(onShop)}>
            <ShopIcon />
            <div className="menu-tile-title">{t('menu.shop')}</div>
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
            <p className="menu-auth-hint">Открой AN Wallet и подтверди подключение:</p>
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
              <WalletIcon /> Открыть AN Wallet
            </button>
            <button
              className={`menu-cta menu-cta-secondary ${waitingConfirm ? 'connecting' : ''}`}
              onClick={handleConfirmAuth}
              disabled={waitingConfirm}
            >
              {waitingConfirm ? <><span className="spinner" />Проверяем...</> : <>✓ Я подтвердил в кошельке</>}
            </button>
            {error && <p className="menu-error">{error}</p>}
          </div>
        ) : (
          <div className="menu-wallet-connect">
            <p className="menu-auth-hint">Нужен установленный AN Wallet с зарегистрированным именем. Введи это имя:</p>
            <input
              className="menu-wallet-input"
              type="text"
              placeholder="Имя AN Wallet (например: alice)"
              value={walletName}
              onChange={e => setWalletName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              onFocus={(e) => {
                setInputFocused(true);
                // На iOS visualViewport обновляется не сразу — подстрахуемся скроллом.
                setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
              }}
              onBlur={() => setInputFocused(false)}
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
              {connecting ? <><span className="spinner" />{t('menu.connecting')}</> : <><WalletIcon />{t('menu.cta')}</>}
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
