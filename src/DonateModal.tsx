// ============================================================
// Модалка доната — 3 кошелька (TON / Acki Nacki / EVM)
// с QR-кодом и кнопкой "копировать адрес".
//
// QR генерируется через бесплатный сервис api.qrserver.com.
// (Можно потом заменить на локальную lib, но для MVP — ок.)
// ============================================================

import { useState } from 'react';
import { t } from './i18n';
import { hapticNotification } from './telegram';
import { Sound } from './sound';
import { DONATE_WALLETS } from './config';

// Адреса берутся из config.ts — там их можно поменять одним местом.
// Заметка: для Acki Nacki используется human-readable wallet name
// (не on-chain адрес), это специфика Bee Engine / Acki Nacki Wallet.
const WALLETS = [
  {
    id: 'ton',
    label: 'TON',
    network: 'The Open Network',
    address: DONATE_WALLETS.ton,
    color: '#0098EA',
    icon: 'ton.svg',
    isWalletName: false,
  },
  {
    id: 'nackl',
    label: 'Acki Nacki',
    network: 'Acki Nacki Wallet name',
    address: DONATE_WALLETS.nackl,
    color: '#ffaa40',
    icon: 'nackl.png',
    isWalletName: true,  // это имя кошелька, а не адрес
  },
  {
    id: 'evm',
    label: 'EVM',
    network: 'Ethereum / BSC / Polygon / etc',
    address: DONATE_WALLETS.evm,
    color: '#627EEA',
    icon: 'eth.svg',
    isWalletName: false,
  },
] as const;

interface Props {
  onClose: () => void;
}

export default function DonateModal({ onClose }: Props) {
  const [activeWallet, setActiveWallet] = useState<typeof WALLETS[number]>(WALLETS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      hapticNotification('success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
      hapticNotification('error');
    }
  };

  const handleClose = () => {
    Sound.click();
    onClose();
  };

  // QR-код 200×200 PNG
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(activeWallet.address)}`;

  // Сокращённый показ адреса (первые 8 и последние 8 символов)
  // Для wallet name (короткого) — показываем целиком
  const shortAddr = !activeWallet.isWalletName && activeWallet.address.length > 20
    ? `${activeWallet.address.slice(0, 8)}...${activeWallet.address.slice(-8)}`
    : activeWallet.address;

  return (
    <div className="overlay donate-overlay" onClick={handleClose}>
      <div className="overlay-card donate-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

        <div className="overlay-title">{t('donate.title')}</div>
        <div className="donate-subtitle">{t('donate.subtitle')}</div>

        {/* Табы кошельков */}
        <div className="donate-tabs">
          {WALLETS.map((w) => (
            <button
              key={w.id}
              className={`donate-tab ${activeWallet.id === w.id ? 'active' : ''}`}
              onClick={() => { setActiveWallet(w); setCopied(false); }}
              style={{ '--donate-tab-color': w.color } as React.CSSProperties}
            >
              <img src={`coins/${w.icon}`} alt={w.label} className="donate-tab-icon"/>
              <span>{w.label}</span>
            </button>
          ))}
        </div>

        {/* Сеть */}
        <div className="donate-network">{activeWallet.network}</div>

        {/* Wallet name display ИЛИ QR-код */}
        {activeWallet.isWalletName ? (
          <div className="donate-wallet-name-display">
            <div className="donate-wallet-name-label">Wallet name</div>
            <div className="donate-wallet-name-value">{activeWallet.address}</div>
            <div className="donate-wallet-name-hint">
              {t('donate.wallet_name_hint')}
            </div>
          </div>
        ) : (
          <div className="donate-qr-wrap">
            <img src={qrUrl} alt={`QR ${activeWallet.label}`} className="donate-qr"/>
          </div>
        )}

        {/* Адрес / Имя */}
        <div className="donate-address-wrap">
          <div className="donate-address-label">
            {activeWallet.isWalletName ? t('donate.wallet_name') : t('donate.address')}
          </div>
          <button className="donate-address" onClick={handleCopy}>
            <span className="donate-address-text">{shortAddr}</span>
            <span className="donate-address-copy">
              {copied ? '✓ ' + t('donate.copied') : t('donate.copy')}
            </span>
          </button>
        </div>

        <div className="donate-note">
          {activeWallet.isWalletName ? t('donate.note_wallet_name') : t('donate.note')}
        </div>
      </div>
    </div>
  );
}
