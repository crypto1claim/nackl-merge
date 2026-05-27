// ============================================================
// Тематические превью для карточек тем в магазине.
// Детальные SVG-сцены — не схематические значки.
// ============================================================

export function ThemePreview({ themeId }: { themeId: string }) {
  return (
    <div className="theme-card-preview">
      <svg viewBox="0 0 80 52" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {renderPreview(themeId)}
      </svg>
    </div>
  );
}

function renderPreview(id: string) {
  switch (id) {
    case 'pastel':       return <PastelPreview />;
    case 'exchange':     return <ExchangePreview />;
    case 'ocean':        return <OceanPreview />;
    case 'pizza':        return <PizzaPreview />;
    case 'china':        return <ChinaPreview />;
    case 'halloween':    return <HalloweenPreview />;
    case 'christmas':    return <ChristmasPreview />;
    case 'terminal':     return <TerminalPreview />;
    case 'cyberpunk':    return <CyberpunkPreview />;
    case 'bee_engine':   return <BeePreview />;
    case 'bitcoin':      return <BitcoinPreview />;
    case 'acki_nacki':   return <AckiNackiPreview />;
    default:             return <rect width="80" height="52" fill="#222"/>;
  }
}

// ===== PASTEL =====
function PastelPreview() {
  return (
    <>
      <defs>
        <linearGradient id="ps-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1e3a"/>
          <stop offset="50%" stopColor="#5a6080"/>
          <stop offset="100%" stopColor="#a8b8c8"/>
        </linearGradient>
      </defs>
      <rect width="80" height="52" fill="url(#ps-bg)"/>
      <circle cx="60" cy="30" r="8" fill="#ffc8a0"/>
      <circle cx="60" cy="30" r="11" fill="#ffc8a0" opacity="0.3"/>
      <ellipse cx="20" cy="20" rx="10" ry="2" fill="#c8d0e0" opacity="0.7"/>
      <ellipse cx="55" cy="12" rx="13" ry="2" fill="#c8d0e0" opacity="0.6"/>
      <ellipse cx="14" cy="34" rx="14" ry="2.5" fill="#a0a8c0" opacity="0.4"/>
      <rect x="0" y="42" width="80" height="10" fill="#7a8aa0" opacity="0.85"/>
      <ellipse cx="60" cy="44" rx="3.5" ry="0.8" fill="#ffc8a0" opacity="0.6"/>
    </>
  );
}

// ===== EXCHANGE =====
function ExchangePreview() {
  return (
    <>
      <defs>
        <linearGradient id="ex-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1828"/>
          <stop offset="100%" stopColor="#040810"/>
        </linearGradient>
      </defs>
      <rect width="80" height="52" fill="url(#ex-bg)"/>
      <g stroke="#1a3850" strokeWidth="0.2" opacity="0.7">
        <line x1="0" y1="14" x2="80" y2="14"/>
        <line x1="0" y1="26" x2="80" y2="26"/>
        <line x1="0" y1="38" x2="80" y2="38"/>
      </g>
      <g>
        <line x1="6" y1="36" x2="6" y2="44" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="4.5" y="38" width="3" height="5" fill="#22c266"/>
        <line x1="12" y1="32" x2="12" y2="40" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="10.5" y="34" width="3" height="5" fill="#22c266"/>
        <line x1="18" y1="30" x2="18" y2="38" stroke="#ff4444" strokeWidth="0.5"/>
        <rect x="16.5" y="32" width="3" height="5" fill="#ff4444"/>
        <line x1="24" y1="25" x2="24" y2="34" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="22.5" y="27" width="3" height="6" fill="#22c266"/>
        <line x1="30" y1="20" x2="30" y2="30" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="28.5" y="22" width="3" height="7" fill="#22c266"/>
        <line x1="36" y1="22" x2="36" y2="32" stroke="#ff4444" strokeWidth="0.5"/>
        <rect x="34.5" y="24" width="3" height="6" fill="#ff4444"/>
        <line x1="42" y1="18" x2="42" y2="28" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="40.5" y="20" width="3" height="7" fill="#22c266"/>
        <line x1="48" y1="14" x2="48" y2="22" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="46.5" y="15" width="3" height="6" fill="#22c266"/>
        <line x1="54" y1="10" x2="54" y2="18" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="52.5" y="11" width="3" height="6" fill="#22c266"/>
        <line x1="60" y1="8" x2="60" y2="16" stroke="#22c266" strokeWidth="0.5"/>
        <rect x="58.5" y="9" width="3" height="6" fill="#22c266"/>
      </g>
      <path d="M 5 42 L 11 38 L 17 34 L 23 30 L 29 25 L 35 28 L 41 23 L 47 18 L 53 13 L 59 10"
            stroke="#22c266" strokeWidth="0.6" fill="none" opacity="0.5"/>
      <text x="6" y="6" fill="#22c266" fontSize="3" fontFamily="monospace" fontWeight="700">BTC/USD ↗</text>
    </>
  );
}

// ===== OCEAN =====
function OceanPreview() {
  return (
    <>
      <defs>
        <linearGradient id="oc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2050a0"/>
          <stop offset="50%" stopColor="#0a2050"/>
          <stop offset="100%" stopColor="#040820"/>
        </linearGradient>
        <radialGradient id="jelly-1">
          <stop offset="0%" stopColor="#a0ffff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#40c0e0" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#oc-bg)"/>
      <path d="M 12 0 L 18 0 L 26 30 L 8 30 Z" fill="#80f0ff" opacity="0.10"/>
      <path d="M 44 0 L 50 0 L 60 32 L 38 32 Z" fill="#80f0ff" opacity="0.08"/>
      <g transform="translate(24 24)">
        <path d="M -10 0 Q -10 -8 0 -8 Q 10 -8 10 0 Q 10 3 7 4 L -7 4 Q -10 3 -10 0 Z" fill="url(#jelly-1)"/>
        <ellipse cx="-3" cy="-1" rx="1.2" ry="1.5" fill="#80ffff" opacity="0.6"/>
        <ellipse cx="3" cy="-1" rx="1.2" ry="1.5" fill="#80ffff" opacity="0.6"/>
        <ellipse cx="0" cy="1" rx="1.5" ry="2" fill="#80ffff" opacity="0.5"/>
        <path d="M -10 0 Q -10 -8 0 -8 Q 10 -8 10 0" stroke="#c0ffff" strokeWidth="0.4" fill="none" opacity="0.9"/>
        <path d="M -7 4 Q -8 10 -6 16 Q -8 22 -7 28" stroke="#80f0ff" strokeWidth="0.6" fill="none" opacity="0.7"/>
        <path d="M -3 4 Q -4 10 -2 16 Q -3 22 -4 28" stroke="#80f0ff" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <path d="M 0 4 Q 0 11 0 18 Q 1 24 0 28" stroke="#80f0ff" strokeWidth="0.9" fill="none" opacity="0.75"/>
        <path d="M 3 4 Q 4 10 2 16 Q 3 22 4 28" stroke="#80f0ff" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <path d="M 7 4 Q 8 10 6 16 Q 8 22 7 28" stroke="#80f0ff" strokeWidth="0.6" fill="none" opacity="0.7"/>
      </g>
      <g transform="translate(58 32)">
        <path d="M -6 0 Q -6 -5 0 -5 Q 6 -5 6 0 Q 6 2 4 2.5 L -4 2.5 Q -6 2 -6 0 Z" fill="#a0ffd8" opacity="0.7"/>
        <path d="M -6 0 Q -6 -5 0 -5 Q 6 -5 6 0" stroke="#c0ffd8" strokeWidth="0.3" fill="none" opacity="0.8"/>
        <path d="M -4 2.5 Q -5 8 -4 14 M -1 2.5 Q -1 9 -2 15 M 2 2.5 Q 3 9 2 15 M 4 2.5 Q 5 8 4 14"
              stroke="#80f0c0" strokeWidth="0.4" fill="none" opacity="0.6"/>
      </g>
      <circle cx="14" cy="44" r="0.7" fill="none" stroke="#c0ffff" strokeWidth="0.3" opacity="0.7"/>
      <circle cx="46" cy="48" r="0.5" fill="none" stroke="#c0ffff" strokeWidth="0.3" opacity="0.6"/>
      <circle cx="70" cy="42" r="0.8" fill="none" stroke="#c0ffff" strokeWidth="0.3" opacity="0.7"/>
      <circle cx="10" cy="14" r="0.4" fill="#a0ffd8"/>
      <circle cx="34" cy="8" r="0.3" fill="#a0ffd8"/>
      <circle cx="68" cy="18" r="0.4" fill="#a0ffd8"/>
      <circle cx="76" cy="38" r="0.3" fill="#a0ffd8"/>
    </>
  );
}

// ===== PIZZA =====
function PizzaPreview() {
  return (
    <>
      <defs>
        <radialGradient id="pz-bg">
          <stop offset="0%" stopColor="#5a2818"/>
          <stop offset="100%" stopColor="#1a0a06"/>
        </radialGradient>
        <radialGradient id="pz-dough">
          <stop offset="0%" stopColor="#fce080"/>
          <stop offset="100%" stopColor="#c87830"/>
        </radialGradient>
        <radialGradient id="pz-cheese">
          <stop offset="0%" stopColor="#ffe48a" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#ffb830" stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#pz-bg)"/>
      <ellipse cx="40" cy="42" rx="38" ry="6" fill="#3a1810" opacity="0.6"/>
      <g transform="translate(40 26)">
        <circle r="22" fill="url(#pz-dough)"/>
        <circle r="22" fill="none" stroke="#8a4818" strokeWidth="1.5" opacity="0.7"/>
        <circle r="19" fill="url(#pz-cheese)" opacity="0.85"/>
        <g stroke="#a04018" strokeWidth="0.3" opacity="0.35">
          <line x1="-22" y1="0" x2="22" y2="0"/>
          <line x1="0" y1="-22" x2="0" y2="22"/>
          <line x1="-15.5" y1="-15.5" x2="15.5" y2="15.5"/>
          <line x1="-15.5" y1="15.5" x2="15.5" y2="-15.5"/>
        </g>
        <g>
          <circle cx="-10" cy="-8" r="2.5" fill="#c82020"/>
          <circle cx="-10" cy="-8" r="2.5" fill="#a01818" opacity="0.3"/>
          <circle cx="8" cy="-10" r="2.8" fill="#c82020"/>
          <circle cx="8" cy="-10" r="2.8" fill="#a01818" opacity="0.3"/>
          <circle cx="-12" cy="6" r="2.5" fill="#c82020"/>
          <circle cx="-12" cy="6" r="2.5" fill="#a01818" opacity="0.3"/>
          <circle cx="10" cy="8" r="3" fill="#c82020"/>
          <circle cx="10" cy="8" r="3" fill="#a01818" opacity="0.3"/>
          <circle cx="0" cy="-2" r="2.3" fill="#c82020"/>
          <circle cx="0" cy="-2" r="2.3" fill="#a01818" opacity="0.3"/>
          <circle cx="0" cy="13" r="2" fill="#c82020"/>
          <circle cx="0" cy="13" r="2" fill="#a01818" opacity="0.3"/>
          <circle cx="14" cy="0" r="2.2" fill="#c82020"/>
          <circle cx="14" cy="0" r="2.2" fill="#a01818" opacity="0.3"/>
          <circle cx="-15" cy="-2" r="2.2" fill="#c82020"/>
          <circle cx="-15" cy="-2" r="2.2" fill="#a01818" opacity="0.3"/>
        </g>
        <ellipse cx="5" cy="4" rx="1.5" ry="0.8" fill="#3a7028" transform="rotate(45 5 4)"/>
        <ellipse cx="-6" cy="-2" rx="1.3" ry="0.7" fill="#3a7028" transform="rotate(-30 -6 -2)"/>
        <ellipse cx="4" cy="-12" rx="1.2" ry="0.6" fill="#3a7028" transform="rotate(60 4 -12)"/>
        <ellipse cx="-4" cy="12" rx="1.3" ry="0.7" fill="#3a7028" transform="rotate(-50 -4 12)"/>
        <ellipse cx="-8" cy="-12" rx="6" ry="3" fill="#fff0a0" opacity="0.25"/>
      </g>
      <path d="M 32 4 Q 30 2 32 0 Q 34 -2 32 -4" stroke="#fff" strokeWidth="0.4" fill="none" opacity="0.4"/>
      <path d="M 40 3 Q 38 1 40 -1 Q 42 -3 40 -5" stroke="#fff" strokeWidth="0.4" fill="none" opacity="0.4"/>
      <path d="M 48 4 Q 46 2 48 0 Q 50 -2 48 -4" stroke="#fff" strokeWidth="0.4" fill="none" opacity="0.4"/>
    </>
  );
}

// ===== CHINA =====
function ChinaPreview() {
  return (
    <>
      <defs>
        <linearGradient id="cn-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a0a0a"/>
          <stop offset="50%" stopColor="#2a0a08"/>
          <stop offset="100%" stopColor="#0a0204"/>
        </linearGradient>
        <radialGradient id="cn-moon-grad">
          <stop offset="0%" stopColor="#ffd060"/>
          <stop offset="50%" stopColor="#ff8030"/>
          <stop offset="100%" stopColor="#a02818"/>
        </radialGradient>
        <radialGradient id="cn-lant-glow">
          <stop offset="0%" stopColor="#ffd860" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#cn-bg)"/>
      <circle cx="58" cy="14" r="8" fill="url(#cn-moon-grad)"/>
      <circle cx="58" cy="14" r="11" fill="url(#cn-moon-grad)" opacity="0.3"/>
      <path d="M 0 38 L 8 30 L 14 34 L 22 26 L 30 32 L 38 28 L 46 34 L 54 30 L 62 34 L 72 28 L 80 32 L 80 52 L 0 52 Z"
            fill="#1a0608" opacity="0.95"/>
      <g transform="translate(32 34)" fill="#1a0408">
        <rect x="-7" y="0" width="14" height="2.5"/>
        <rect x="-6" y="-4" width="12" height="4"/>
        <path d="M -9 -4 Q -10 -5.5 -7 -6 L 7 -6 Q 10 -5.5 9 -4 L 7 -3.5 L -7 -3.5 Z"/>
        <rect x="-4" y="-10" width="8" height="4"/>
        <path d="M -7 -10 Q -8 -12 -5 -12.5 L 5 -12.5 Q 8 -12 7 -10 L 5 -9.5 L -5 -9.5 Z"/>
        <rect x="-2.5" y="-16" width="5" height="3.5"/>
        <path d="M -5 -16 Q -6 -17.5 -3.5 -18 L 3.5 -18 Q 6 -17.5 5 -16 L 3.5 -15.5 L -3.5 -15.5 Z"/>
        <line x1="0" y1="-18" x2="0" y2="-22" stroke="#f0c040" strokeWidth="0.5"/>
        <circle cx="0" cy="-22" r="0.6" fill="#f0c040"/>
        <rect x="-2.5" y="-2.5" width="1.2" height="2" fill="#f0c040" opacity="0.85"/>
        <rect x="1.3" y="-2.5" width="1.2" height="2" fill="#f0c040" opacity="0.85"/>
        <rect x="-1.5" y="-8.5" width="1" height="1.5" fill="#f0c040" opacity="0.85"/>
        <rect x="0.5" y="-8.5" width="1" height="1.5" fill="#f0c040" opacity="0.85"/>
      </g>
      <g transform="translate(12 18)">
        <line x1="0" y1="-5" x2="0" y2="-1" stroke="#3a1a08" strokeWidth="0.3"/>
        <circle cx="0" cy="3" r="6" fill="url(#cn-lant-glow)"/>
        <ellipse cx="0" cy="3" rx="3.5" ry="4" fill="#d83020"/>
        <ellipse cx="0" cy="2" rx="2.5" ry="2" fill="#ff8030" opacity="0.7"/>
        <rect x="-3.5" y="-0.5" width="7" height="0.6" fill="#f0c040"/>
        <rect x="-3.5" y="6" width="7" height="0.6" fill="#f0c040"/>
        <text x="0" y="4.5" textAnchor="middle" fontSize="3" fill="#f0c040" fontFamily="serif" fontWeight="900">福</text>
        <line x1="0" y1="6.6" x2="0" y2="9" stroke="#f0c040" strokeWidth="0.5"/>
      </g>
      <path d="M 0 10 Q 15 4 30 10 Q 45 16 60 8" stroke="#f0c040" strokeWidth="0.8" fill="none" opacity="0.7"/>
      <path d="M 0 10 Q 15 4 30 10 Q 45 16 60 8" stroke="#ffe890" strokeWidth="0.3" fill="none" opacity="0.7" strokeDasharray="0.4 1.2"/>
    </>
  );
}

// ===== HALLOWEEN =====
function HalloweenPreview() {
  return (
    <>
      <defs>
        <linearGradient id="hw-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a0a44"/>
          <stop offset="100%" stopColor="#0a0418"/>
        </linearGradient>
        <radialGradient id="hw-moon">
          <stop offset="0%" stopColor="#fff8c0"/>
          <stop offset="100%" stopColor="#a09060"/>
        </radialGradient>
        <radialGradient id="hw-pumpkin">
          <stop offset="0%" stopColor="#ff9040"/>
          <stop offset="100%" stopColor="#902808"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#hw-bg)"/>
      <circle cx="58" cy="14" r="9" fill="url(#hw-moon)"/>
      <circle cx="58" cy="14" r="13" fill="#fff8c0" opacity="0.2"/>
      <circle cx="56" cy="12" r="1" fill="#5a4830" opacity="0.4"/>
      <circle cx="60" cy="15" r="0.8" fill="#5a4830" opacity="0.3"/>
      <g fill="#fff5d0">
        <circle cx="10" cy="6" r="0.5"/>
        <circle cx="22" cy="10" r="0.4"/>
        <circle cx="34" cy="6" r="0.5"/>
        <circle cx="46" cy="9" r="0.4"/>
        <circle cx="76" cy="22" r="0.4"/>
        <circle cx="14" cy="18" r="0.3"/>
      </g>
      <g transform="translate(28 16)">
        <path d="M 0 0 Q -3 -3 -8 -3 Q -5 -1 -3 1 L 0 4 L 3 1 Q 5 -1 8 -3 Q 3 -3 0 0 Z" fill="#0a0210"/>
        <ellipse cx="0" cy="1.5" rx="1" ry="1.5" fill="#0a0210"/>
        <circle cx="-0.5" cy="1" r="0.3" fill="#ff8228"/>
        <circle cx="0.5" cy="1" r="0.3" fill="#ff8228"/>
      </g>
      <path d="M 0 42 Q 20 38 40 42 Q 60 38 80 42 L 80 52 L 0 52 Z" fill="#0a0414"/>
      <g transform="translate(50 38)" fill="#3a3038">
        <rect x="-2" y="0" width="4" height="6" rx="0.5"/>
        <ellipse cx="0" cy="0" rx="2" ry="1.2"/>
        <line x1="-1" y1="2.5" x2="1" y2="2.5" stroke="#1a1018" strokeWidth="0.5"/>
        <line x1="0" y1="1.5" x2="0" y2="3.5" stroke="#1a1018" strokeWidth="0.5"/>
      </g>
      <g transform="translate(22 38)">
        <ellipse cx="0" cy="11" rx="10" ry="1" fill="#000" opacity="0.5"/>
        <ellipse cx="-5" cy="3" rx="3" ry="6" fill="#d86028"/>
        <ellipse cx="5" cy="3" rx="3" ry="6" fill="#d86028"/>
        <ellipse cx="0" cy="3" rx="6" ry="7.5" fill="url(#hw-pumpkin)"/>
        <path d="M -1 -4 L 1 -4 L 1.5 -6.5 L -1.5 -6.5 Z" fill="#3a4020"/>
        <path d="M 0 -6.5 Q 3 -7 2 -4.5" stroke="#5a6030" strokeWidth="0.4" fill="none"/>
        <path d="M -3.5 -1 L -2 -1 L -2.7 1 Z" fill="#ffe040"/>
        <path d="M 2 -1 L 3.5 -1 L 2.7 1 Z" fill="#ffe040"/>
        <path d="M -4 4 L -2.5 3 L -1 4 L 0 3 L 1 4 L 2.5 3 L 4 4 L 3 6 L -3 6 Z" fill="#ffe040"/>
        <ellipse cx="-3" cy="-2" rx="2" ry="3" fill="#ffd080" opacity="0.4"/>
      </g>
      <ellipse cx="40" cy="48" rx="40" ry="3" fill="#8050a0" opacity="0.3"/>
    </>
  );
}

// ===== CHRISTMAS =====
function ChristmasPreview() {
  return (
    <>
      <defs>
        <linearGradient id="xm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1428"/>
          <stop offset="50%" stopColor="#1a2a48"/>
          <stop offset="100%" stopColor="#3a5078"/>
        </linearGradient>
        <radialGradient id="xm-window-light">
          <stop offset="0%" stopColor="#ffd860"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <linearGradient id="xm-snow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#a8b8c8"/>
        </linearGradient>
      </defs>
      <rect width="80" height="52" fill="url(#xm-sky)"/>
      <circle cx="62" cy="10" r="5" fill="#fff8e0"/>
      <circle cx="62" cy="10" r="8" fill="#fff8e0" opacity="0.25"/>
      <circle cx="60" cy="8" r="0.6" fill="#c8c0a0" opacity="0.6"/>
      <circle cx="64" cy="11" r="0.5" fill="#c8c0a0" opacity="0.6"/>
      <g fill="#fff">
        <circle cx="8" cy="6" r="0.5"/>
        <circle cx="18" cy="10" r="0.4"/>
        <circle cx="30" cy="5" r="0.5"/>
        <circle cx="42" cy="8" r="0.4"/>
        <circle cx="50" cy="14" r="0.3"/>
        <circle cx="72" cy="6" r="0.5"/>
      </g>
      <path d="M 0 28 L 10 22 L 18 26 L 28 20 L 38 24 L 48 22 L 58 26 L 70 23 L 80 27 L 80 32 L 0 32 Z"
            fill="#1a2238" opacity="0.6"/>
      <path d="M 0 30 L 4 26 L 8 30 L 12 27 L 16 30 L 20 26 L 24 30 L 28 25 L 32 30 L 36 27 L 40 30 L 44 26 L 48 30 L 52 25 L 56 30 L 60 27 L 64 30 L 68 26 L 72 30 L 76 27 L 80 30 L 80 36 L 0 36 Z"
            fill="#0a1322"/>
      <rect x="0" y="32" width="80" height="6" fill="rgba(180,200,230,0.15)"/>

      <g transform="translate(12 36)">
        <ellipse cx="3" cy="2" rx="5" ry="3" fill="url(#xm-window-light)" opacity="0.55"/>
        <rect x="0" y="2" width="6" height="6" fill="#1a1410"/>
        <path d="M -1 2 L 3 -1 L 7 2 Z" fill="#1a1410"/>
        <path d="M -1 2 L 3 -1.2 L 7 2" stroke="#fff" strokeWidth="0.4" fill="none"/>
        <rect x="1.5" y="3.5" width="2" height="2" fill="#ffd860"/>
        <line x1="2.5" y1="3.5" x2="2.5" y2="5.5" stroke="#1a1410" strokeWidth="0.2"/>
        <rect x="4" y="5" width="1.5" height="3" fill="#0a0806"/>
        <rect x="4" y="-1" width="0.7" height="2" fill="#1a1410"/>
        <ellipse cx="4.4" cy="-2" rx="0.6" ry="0.4" fill="#a8b8c8" opacity="0.5"/>
        <ellipse cx="4.6" cy="-3.2" rx="0.8" ry="0.5" fill="#a8b8c8" opacity="0.3"/>
      </g>

      <g transform="translate(28 36)">
        <rect x="-0.3" y="3" width="0.6" height="1.5" fill="#1a0e08"/>
        <path d="M -4 3 L -3 1 L -2 2 L -1 1 L 0 2 L 1 1 L 2 2 L 3 1 L 4 3 Z" fill="#0c2018"/>
        <path d="M -3 1 L -2 -1 L -1 0 L 0 -1 L 1 0 L 2 -1 L 3 1 Z" fill="#0e2818"/>
        <path d="M -2 -1 L -1 -3 L 0 -2 L 1 -3 L 2 -1 Z" fill="#10301c"/>
        <path d="M -1 -3 L 0 -5 L 1 -3 Z" fill="#12381e"/>
        <path d="M 0 -5.5 L 0.4 -5 L 1 -4.9 L 0.5 -4.6 L 0.6 -4 L 0 -4.3 L -0.6 -4 L -0.5 -4.6 L -1 -4.9 L -0.4 -5 Z" fill="#ffd700"/>
        <path d="M -3.5 3.2 L 3.5 3.2 M -2.5 1.2 L 2.5 1.2 M -1.5 -0.8 L 1.5 -0.8" stroke="#fff" strokeWidth="0.25"/>
        <circle cx="-2" cy="2" r="0.4" fill="#ff3838"/>
        <circle cx="2" cy="2" r="0.4" fill="#ffd700"/>
        <circle cx="-1.5" cy="0" r="0.35" fill="#50c050"/>
        <circle cx="1.5" cy="0" r="0.35" fill="#4080ff"/>
        <circle cx="-1" cy="-2" r="0.3" fill="#e040c0"/>
        <circle cx="1" cy="-2" r="0.3" fill="#ffd700"/>
      </g>

      <g transform="translate(42 34)">
        <ellipse cx="4" cy="3" rx="7" ry="4" fill="url(#xm-window-light)" opacity="0.5"/>
        <rect x="0" y="3" width="8" height="8" fill="#1a1410"/>
        <path d="M -1 3 L 4 -1 L 9 3 Z" fill="#1a1410"/>
        <path d="M -1 3 L 4 -1.2 L 9 3" stroke="#fff" strokeWidth="0.5" fill="none"/>
        <rect x="1.5" y="4.5" width="2" height="2.5" fill="#ffd860"/>
        <line x1="2.5" y1="4.5" x2="2.5" y2="7" stroke="#1a1410" strokeWidth="0.2"/>
        <rect x="4.5" y="4.5" width="2" height="2.5" fill="#ffd860"/>
        <line x1="5.5" y1="4.5" x2="5.5" y2="7" stroke="#1a1410" strokeWidth="0.2"/>
        <rect x="3.2" y="7.5" width="1.6" height="3.5" fill="#0a0806"/>
        <circle cx="4" cy="6.5" r="0.5" fill="none" stroke="#2a6020" strokeWidth="0.3"/>
        <circle cx="4" cy="6.3" r="0.1" fill="#e83838"/>
        <rect x="5" y="-1" width="0.8" height="2" fill="#1a1410"/>
        <ellipse cx="5.4" cy="-2" rx="0.7" ry="0.4" fill="#a8b8c8" opacity="0.5"/>
        <ellipse cx="5.6" cy="-3.2" rx="0.9" ry="0.5" fill="#a8b8c8" opacity="0.3"/>
      </g>

      <g transform="translate(56 38)">
        <rect x="-0.2" y="2" width="0.4" height="1" fill="#1a0e08"/>
        <path d="M -3 2 L 0 -2 L 3 2 Z" fill="#0e2616"/>
        <path d="M -2 0 L 0 -3 L 2 0 Z" fill="#10301c"/>
        <path d="M -1 -2 L 0 -4 L 1 -2 Z" fill="#12381e"/>
        <circle cx="-1.5" cy="1" r="0.25" fill="#ff3838"/>
        <circle cx="1.5" cy="1" r="0.25" fill="#ffd700"/>
        <circle cx="0" cy="-1" r="0.22" fill="#50c050"/>
        <path d="M 0 -4.2 L 0.3 -3.8 L 0.6 -3.8 L 0.3 -3.5 L 0.4 -3 L 0 -3.3 L -0.4 -3 L -0.3 -3.5 L -0.6 -3.8 L -0.3 -3.8 Z" fill="#ffd700"/>
      </g>

      <path d="M 0 52 L 0 42 C 15 39 30 43 45 41 C 60 38 75 42 80 40 L 80 52 Z" fill="url(#xm-snow-grad)"/>
      <g fill="#fff" opacity="0.9">
        <circle cx="10" cy="14" r="0.4"/>
        <circle cx="22" cy="22" r="0.5"/>
        <circle cx="38" cy="18" r="0.4"/>
        <circle cx="50" cy="20" r="0.5"/>
        <circle cx="68" cy="26" r="0.4"/>
        <circle cx="74" cy="18" r="0.3"/>
      </g>
    </>
  );
}

// ===== TERMINAL =====
function TerminalPreview() {
  return (
    <>
      <rect width="80" height="52" fill="#000800"/>
      <rect width="80" height="52" fill="#00ff66" opacity="0.04"/>
      <g fontFamily="monospace" fontSize="4" fill="#00ff66">
        <text x="4" y="10">1</text>
        <text x="4" y="18" opacity="0.85">0</text>
        <text x="4" y="26" opacity="0.65">1</text>
        <text x="4" y="34" opacity="0.4">1</text>
        <text x="4" y="42" opacity="0.2">0</text>
        <text x="14" y="14">0</text>
        <text x="14" y="22" opacity="0.85">1</text>
        <text x="14" y="30" opacity="0.6">0</text>
        <text x="14" y="38" opacity="0.4">1</text>
        <text x="14" y="46" opacity="0.2">1</text>
        <text x="24" y="8">1</text>
        <text x="24" y="16" opacity="0.85">1</text>
        <text x="24" y="24" opacity="0.6">0</text>
        <text x="24" y="32" opacity="0.4">0</text>
        <text x="24" y="40" opacity="0.2">1</text>
        <text x="34" y="12">0</text>
        <text x="34" y="20" opacity="0.85">1</text>
        <text x="34" y="28" opacity="0.65">1</text>
        <text x="34" y="36" opacity="0.4">0</text>
        <text x="44" y="6">1</text>
        <text x="44" y="14" opacity="0.85">0</text>
        <text x="44" y="22" opacity="0.65">1</text>
        <text x="44" y="30" opacity="0.4">1</text>
        <text x="44" y="38" opacity="0.2">0</text>
        <text x="54" y="10">0</text>
        <text x="54" y="18" opacity="0.85">1</text>
        <text x="54" y="26" opacity="0.6">0</text>
        <text x="54" y="34" opacity="0.4">1</text>
        <text x="64" y="8">1</text>
        <text x="64" y="16" opacity="0.85">1</text>
        <text x="64" y="24" opacity="0.6">0</text>
        <text x="64" y="32" opacity="0.4">1</text>
        <text x="64" y="40" opacity="0.2">1</text>
        <text x="74" y="12">0</text>
        <text x="74" y="20" opacity="0.85">1</text>
        <text x="74" y="28" opacity="0.6">1</text>
        <text x="74" y="36" opacity="0.4">0</text>
      </g>
      <g fontFamily="monospace" fontSize="4" fill="#a0ffc0">
        <text x="4" y="10">1</text>
        <text x="24" y="8">1</text>
        <text x="44" y="6">1</text>
      </g>
    </>
  );
}

// ===== CYBERPUNK =====
function CyberpunkPreview() {
  return (
    <>
      <defs>
        <linearGradient id="cp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#280040"/>
          <stop offset="50%" stopColor="#180028"/>
          <stop offset="100%" stopColor="#0a0014"/>
        </linearGradient>
      </defs>
      <rect width="80" height="52" fill="url(#cp-bg)"/>
      <circle cx="40" cy="24" r="11" fill="#ff2080"/>
      <circle cx="40" cy="24" r="14" fill="#ff2080" opacity="0.3"/>
      <rect x="29" y="21" width="22" height="0.6" fill="#0a0014"/>
      <rect x="29" y="24" width="22" height="0.6" fill="#0a0014"/>
      <rect x="29" y="27" width="22" height="0.6" fill="#0a0014"/>
      <g fill="#0a0018">
        <rect x="2" y="22" width="8" height="30"/>
        <rect x="12" y="14" width="10" height="38"/>
        <rect x="24" y="20" width="6" height="32"/>
        <rect x="32" y="10" width="11" height="42"/>
        <rect x="46" y="16" width="8" height="36"/>
        <rect x="56" y="12" width="10" height="40"/>
        <rect x="68" y="20" width="10" height="32"/>
      </g>
      <line x1="16" y1="14" x2="16" y2="6" stroke="#beff32" strokeWidth="0.4"/>
      <line x1="37" y1="10" x2="37" y2="3" stroke="#beff32" strokeWidth="0.4"/>
      <line x1="61" y1="12" x2="61" y2="4" stroke="#beff32" strokeWidth="0.4"/>
      <circle cx="16" cy="6" r="0.5" fill="#ff2080"/>
      <circle cx="37" cy="3" r="0.5" fill="#beff32"/>
      <circle cx="61" cy="4" r="0.5" fill="#ff2080"/>
      <g fill="#beff32">
        <rect x="3.5" y="26" width="1" height="1.2"/>
        <rect x="6" y="30" width="1" height="1.2"/>
        <rect x="13" y="18" width="1.2" height="1.5"/>
        <rect x="17" y="22" width="1.2" height="1.5"/>
        <rect x="13" y="34" width="1.2" height="1.5"/>
        <rect x="25" y="24" width="1" height="1.3"/>
        <rect x="27" y="30" width="1" height="1.3"/>
        <rect x="33" y="14" width="1.5" height="2"/>
        <rect x="37" y="18" width="1.5" height="2"/>
        <rect x="33" y="28" width="1.5" height="2"/>
        <rect x="40" y="32" width="1.5" height="2"/>
        <rect x="47" y="20" width="1" height="1.3"/>
        <rect x="51" y="26" width="1" height="1.3"/>
        <rect x="57" y="16" width="1.5" height="2"/>
        <rect x="61" y="22" width="1.5" height="2"/>
        <rect x="57" y="32" width="1.5" height="2"/>
        <rect x="70" y="24" width="1" height="1.3"/>
        <rect x="73" y="30" width="1" height="1.3"/>
      </g>
      <g fill="#ff2080">
        <rect x="14" y="26" width="1.2" height="1.5"/>
        <rect x="34" y="22" width="1.5" height="2"/>
        <rect x="38" y="36" width="1.5" height="2"/>
        <rect x="48" y="28" width="1" height="1.3"/>
        <rect x="58" y="26" width="1.5" height="2"/>
        <rect x="71" y="34" width="1" height="1.3"/>
      </g>
      <text x="40" y="48" textAnchor="middle" fontSize="5" fill="#beff32" fontFamily="monospace" fontWeight="900" opacity="0.95">CYBER</text>
    </>
  );
}

// ===== BEE ENGINE =====
function BeePreview() {
  return (
    <>
      <defs>
        <radialGradient id="be-bg-grad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#5a3a10"/>
          <stop offset="100%" stopColor="#1a1208"/>
        </radialGradient>
        <radialGradient id="be-honey-grad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffe890"/>
          <stop offset="60%" stopColor="#ffc830"/>
          <stop offset="100%" stopColor="#a06000"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#be-bg-grad)"/>
      <g stroke="#a06000" strokeWidth="0.3">
        <polygon points="6,6 12,9.5 12,16.5 6,20 0,16.5 0,9.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="18,6 24,9.5 24,16.5 18,20 12,16.5 12,9.5" fill="url(#be-honey-grad)"/>
        <polygon points="30,6 36,9.5 36,16.5 30,20 24,16.5 24,9.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="56,6 62,9.5 62,16.5 56,20 50,16.5 50,9.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="68,6 74,9.5 74,16.5 68,20 62,16.5 62,9.5" fill="url(#be-honey-grad)"/>
        <polygon points="12,20 18,23.5 18,30.5 12,34 6,30.5 6,23.5" fill="url(#be-honey-grad)" opacity="0.8"/>
        <polygon points="24,20 30,23.5 30,30.5 24,34 18,30.5 18,23.5" fill="url(#be-honey-grad)" opacity="0.9"/>
        <polygon points="50,20 56,23.5 56,30.5 50,34 44,30.5 44,23.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="62,20 68,23.5 68,30.5 62,34 56,30.5 56,23.5" fill="url(#be-honey-grad)" opacity="0.8"/>
        <polygon points="6,34 12,37.5 12,44.5 6,48 0,44.5 0,37.5" fill="url(#be-honey-grad)" opacity="0.7"/>
        <polygon points="18,34 24,37.5 24,44.5 18,48 12,44.5 12,37.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="56,34 62,37.5 62,44.5 56,48 50,44.5 50,37.5" fill="url(#be-honey-grad)" opacity="0.85"/>
        <polygon points="68,34 74,37.5 74,44.5 68,48 62,44.5 62,37.5" fill="url(#be-honey-grad)" opacity="0.7"/>
      </g>
      <ellipse cx="18" cy="13" rx="2" ry="1.5" fill="#fff080" opacity="0.7"/>
      <ellipse cx="62" cy="40" rx="2.5" ry="1.8" fill="#fff080" opacity="0.7"/>
      <g transform="translate(40 26)">
        <ellipse cx="0" cy="0" rx="8" ry="5" fill="#ffd860" stroke="#704000" strokeWidth="0.5"/>
        <path d="M -5 -3.5 Q -5 0 -5 3.5" stroke="#1a1408" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        <path d="M -2 -4.5 Q -2 0 -2 4.5" stroke="#1a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M 2 -4.5 Q 2 0 2 4.5" stroke="#1a1408" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="6.5" cy="0" r="3" fill="#c08000" stroke="#704000" strokeWidth="0.5"/>
        <circle cx="7.5" cy="-1" r="0.8" fill="#1a1408"/>
        <circle cx="7.8" cy="-1.3" r="0.3" fill="#fff"/>
        <path d="M 5.5 -2.5 Q 4 -5 6 -6" stroke="#1a1408" strokeWidth="0.4" fill="none"/>
        <path d="M 7.5 -2.5 Q 8 -5 10 -6" stroke="#1a1408" strokeWidth="0.4" fill="none"/>
        <circle cx="6" cy="-6" r="0.4" fill="#1a1408"/>
        <circle cx="10" cy="-6" r="0.4" fill="#1a1408"/>
        <path d="M -8 0 L -10 -0.6 L -10 0.6 Z" fill="#1a1408"/>
        <ellipse cx="-2" cy="-6" rx="4" ry="2.5" fill="rgba(255,255,255,0.6)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3"/>
        <ellipse cx="3" cy="-6" rx="4" ry="2.5" fill="rgba(255,255,255,0.6)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3"/>
        <line x1="-2" y1="-8.5" x2="-2" y2="-3.5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.15"/>
        <line x1="3" y1="-8.5" x2="3" y2="-3.5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.15"/>
      </g>
    </>
  );
}

// ===== BITCOIN =====
function BitcoinPreview() {
  return (
    <>
      <defs>
        <linearGradient id="btc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1808"/>
          <stop offset="100%" stopColor="#0a0402"/>
        </linearGradient>
        <radialGradient id="btc-coin" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffd060"/>
          <stop offset="40%" stopColor="#f7931a"/>
          <stop offset="100%" stopColor="#a04808"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="url(#btc-bg)"/>
      <circle cx="40" cy="26" r="22" fill="#f7931a" opacity="0.15"/>
      <circle cx="40" cy="26" r="28" fill="#f7931a" opacity="0.08"/>
      <circle cx="40" cy="26" r="17" fill="url(#btc-coin)"/>
      <ellipse cx="34" cy="18" rx="7" ry="4" fill="#fff080" opacity="0.5"/>
      <circle cx="40" cy="26" r="17" fill="none" stroke="#6a3008" strokeWidth="1.2"/>
      <circle cx="40" cy="26" r="15" fill="none" stroke="#fff080" strokeWidth="0.3" opacity="0.5"/>
      <text x="40" y="35" textAnchor="middle" fontSize="22" fill="#fff" fontWeight="900" fontFamily="Arial, sans-serif">₿</text>
      <text x="40" y="46" textAnchor="middle" fontSize="3.5" fill="#f7931a" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="0.5">BITCOIN</text>
      <circle cx="10" cy="14" r="3.5" fill="url(#btc-coin)" opacity="0.7"/>
      <text x="10" y="16" textAnchor="middle" fontSize="4.5" fill="#fff" fontWeight="900" opacity="0.7">₿</text>
      <circle cx="70" cy="42" r="3" fill="url(#btc-coin)" opacity="0.7"/>
      <text x="70" y="44" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="900" opacity="0.7">₿</text>
      <text x="14" y="40" fontSize="3" fill="#ffd060" opacity="0.8">✦</text>
      <text x="66" y="14" fontSize="2.5" fill="#ffd060" opacity="0.7">✦</text>
    </>
  );
}

// ===== ACKI NACKI =====
// Использует настоящий PNG логотип через image тег
function AckiNackiPreview() {
  return (
    <>
      <defs>
        <radialGradient id="an-bg-grad">
          <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#1a0a00"/>
        </radialGradient>
        <radialGradient id="an-mini-glow">
          <stop offset="0%" stopColor="#ffd060" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <rect width="80" height="52" fill="#0a0400"/>
      <circle cx="40" cy="22" r="24" fill="url(#an-bg-grad)"/>
      <circle cx="40" cy="22" r="18" fill="none" stroke="#ffaa40" strokeWidth="0.3" strokeDasharray="1 1.5" opacity="0.5"/>
      <image href="coins/nackl.png" x="26" y="8" width="28" height="28"/>
      <g>
        <circle cx="58" cy="10" r="3.5" fill="url(#an-mini-glow)"/>
        <image href="coins/nackl.png" x="55" y="7" width="6" height="6"/>
        <circle cx="22" cy="10" r="3" fill="url(#an-mini-glow)"/>
        <image href="coins/nackl.png" x="19.5" y="7.5" width="5" height="5"/>
        <circle cx="58" cy="34" r="3" fill="url(#an-mini-glow)"/>
        <image href="coins/nackl.png" x="55.5" y="31.5" width="5" height="5"/>
        <circle cx="22" cy="34" r="3.5" fill="url(#an-mini-glow)"/>
        <image href="coins/nackl.png" x="19" y="31" width="6" height="6"/>
      </g>
      <text x="40" y="48" textAnchor="middle" fontSize="3.5" fill="#ffaa40" fontWeight="800" letterSpacing="0.6">ACKI NACKI</text>
    </>
  );
}
