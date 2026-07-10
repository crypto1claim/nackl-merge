import { useEffect, useRef, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import { startConnect, completeConnect, cancelConnect, type ConnectStage, type WalletState } from './wallet';
import { hapticSelection, hapticImpact, hapticNotification, tg } from './telegram';
import { t } from './i18n';
import { COIN_SET_DEFAULT, COIN_SET_ALT } from './coin_sets';
import { Sound } from './sound';
import ThemeDecor from './ThemeDecor';
import { formatMRG } from './currency';
import { track } from './analytics';

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
  // Диплинк активной сессии подключения: не null = показан экран «подтверди
  // в кошельке» (QR + кнопки), completeConnect ждёт подтверждения в фоне.
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [stage, setStage] = useState<ConnectStage | null>(null);
  // Прогресс загрузки WASM-движка (~8.5МБ): null = ещё не грузим / уже готов.
  const [wasmProgress, setWasmProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  // Защита от параллельных ожиданий: авторетрай при возврате из кошелька
  // не должен запускать второй completeConnect поверх ещё живого первого.
  const waitingRef = useRef(false);

  // QR — штатный путь подключения AN Wallet (сканер внутри кошелька),
  // показываем сразу вместе с кнопкой-диплинком.
  useEffect(() => {
    if (!deepLink) { setQrDataUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(deepLink, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then((data) => { if (!cancelled) setQrDataUrl(data); })
      .catch(() => { /* QR не критичен — остаются кнопки */ });
    return () => { cancelled = true; };
  }, [deepLink]);

  const handleCopyLink = async () => {
    if (!deepLink) return;
    Sound.click();
    hapticSelection();
    try {
      await navigator.clipboard.writeText(deepLink);
    } catch {
      // Telegram-webview может не дать clipboard API — фолбэк через textarea
      const ta = document.createElement('textarea');
      ta.value = deepLink;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    track('wallet_link_copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetConnectUi = () => {
    setDeepLink(null);
    setStage(null);
    setQrDataUrl(null);
    setConnecting(false);
    setWasmProgress(null);
  };

  const handleCancelConnect = () => {
    Sound.select();
    hapticSelection();
    cancelConnect();
    resetConnectUi();
    setError(null);
  };

  // Шаг 2 подключения: ожидание подтверждений кошелька + регистрация ключей.
  // Вынесен отдельно, потому что вызывается повторно: iOS замораживает
  // webview, пока игрок подтверждает в кошельке, и ожидание рвётся сетевой
  // ошибкой — хотя кошелёк всё подтвердил. Повторный вызов продолжает с места
  // обрыва (прогресс персистится в beeEngine) без новых окон в кошельке.
  const awaitWallet = async () => {
    if (waitingRef.current) return;
    waitingRef.current = true;
    setError(null);
    try {
      const state = await completeConnect((st) => {
        setStage(st);
        if (st === 'confirm_mining') track('wallet_hello_ok');
      });
      Sound.fanfare();
      hapticNotification('success');
      track('wallet_connect_success');
      resetConnectUi();
      onConnected(state);
    } catch (e) {
      const msg = String((e as any)?.message ?? e);
      if (msg === 'cancelled') return; // игрок нажал «Отмена» — UI уже сброшен
      // Экран подключения НЕ сбрасываем: «Проверить ещё раз» (или возврат
      // в игру — см. visibilitychange) продолжит с того же места.
      setError(t('menu.err_timeout'));
      setStage(null);
      track('wallet_connect_fail', { reason: 'timeout_or_error', message: msg.slice(0, 120) });
      hapticNotification('error');
    } finally {
      waitingRef.current = false;
    }
  };

  // Возврат из кошелька в игру: если ожидание оборвалось в фоне —
  // продолжаем автоматически, игроку не нужно ничего нажимать.
  useEffect(() => {
    if (!deepLink) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !waitingRef.current) void awaitWallet();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    setWasmProgress(0);
    Sound.click();
    hapticImpact('medium');
    track('wallet_connect_start');
    try {
      // Шаг 1: сессия + диплинк (грузит WASM при первом вызове)
      const link = await startConnect((pct) => setWasmProgress(pct));
      setWasmProgress(null);
      setConnecting(false);
      setDeepLink(link);
      setStage('waiting_hello');
    } catch (e) {
      // До создания сессии виноваты сеть/WASM. Кнопка остаётся —
      // повторное нажатие = ретрай (initBeeEngine докачает с нуля).
      setError(t('menu.error_engine'));
      track('wallet_engine_load_fail');
      hapticNotification('error');
      resetConnectUi();
      return;
    }
    void awaitWallet();
  };

  const stageText =
    stage === 'confirm_mining' ? t('menu.stage_mining')
    : stage === 'propagating' ? t('menu.stage_propagating')
    : t('menu.stage_hello');

  // Пока кошелёк не подключён, в меню виден блок подключения (на этапе
  // подтверждения — QR + статусы), и контент выше экрана. База в styles.css
  // ставит overflow: hidden (меню должно влезать целиком), а её исключение
  // для скролла висело на :has(.menu-wallet-input) — поле убрано при
  // миграции на BeeConnect, и экран срезался без возможности прокрутки.
  // `safe center`: короткий контент по центру, длинный скроллится с верха.
  const menuScrollStyle: CSSProperties | undefined = walletConnected
    ? undefined
    : { overflowY: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'safe center' };

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
    <div className="menu-screen" style={menuScrollStyle}>
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
        ) : deepLink ? (
          <div className="menu-wallet-connect">
            <p className="menu-auth-hint">{t('menu.auth_hint')}</p>
            {/* Настоящий <a> вместо window.open: programmatic-открытие universal
                link на iOS ненадёжно (кошелёк открывается без payload). Внутри
                Telegram якорь не работает — там по-прежнему нативный openLink. */}
            <a
              className="menu-cta menu-cta-deeplink"
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                Sound.click();
                hapticImpact('medium');
                if (tg?.openLink) {
                  e.preventDefault();
                  tg.openLink(deepLink);
                }
              }}
            >
              <WalletIcon /> {t('menu.open_wallet')}
            </a>
            <div className="menu-qr-block">
              {qrDataUrl
                ? <div className="menu-qr-box"><img src={qrDataUrl} alt="QR" width={180} height={180} /></div>
                : <span className="spinner" />}
              <p className="menu-auth-hint">{t('menu.qr_hint')}</p>
            </div>
            {/* Живой статус: подтверждение сессии → майнинг-ключи → он-чейн */}
            {stage && (
              <p className="menu-auth-hint menu-connect-status">
                <span className="spinner" /> {stageText}
              </p>
            )}
            {error && <p className="menu-error">{error}</p>}
            {error && (
              <button className="menu-cta menu-cta-secondary" onClick={() => { Sound.click(); hapticImpact('medium'); void awaitWallet(); }}>
                {t('menu.retry')}
              </button>
            )}
            <button className="menu-cta menu-cta-secondary" onClick={handleCopyLink}>
              {copied ? t('menu.copied') : t('menu.copy_link')}
            </button>
            <button className="menu-qr-toggle" onClick={handleCancelConnect}>
              {t('menu.cancel')}
            </button>
          </div>
        ) : (
          <div className="menu-wallet-connect">
            <p className="menu-auth-hint">{t('menu.need_wallet_hint')}</p>
            <button
              className={`menu-cta ${connecting ? 'connecting' : ''}`}
              onClick={handleConnect}
              disabled={connecting}
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
