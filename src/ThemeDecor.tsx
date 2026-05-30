// ============================================================
// Декоративный фон меню. Меняется в зависимости от темы.
// Каждая тема имеет свой "лор" + усиленные детали и движение.
// ============================================================

import { getTheme } from './themes';

export default function ThemeDecor() {
  const theme = getTheme();

  switch (theme.decor) {
    case 'bubbles':      return <DecorBubbles />;
    case 'nackl_smiles': return <DecorNacklSmiles />;
    case 'candles':      return <DecorCandles />;
    case 'pizza_slices': return <DecorPizzaSlices />;
    case 'matrix_rain':  return <DecorMatrixRain />;
    case 'cyber_city':   return <DecorCyberCity />;
    case 'btc_symbols':  return <DecorBtcSymbols />;
    case 'ocean_jelly':  return <DecorOceanJelly />;
    case 'china_lanterns':return <DecorChinaLanterns />;
    case 'halloween':    return <DecorHalloween />;
    case 'christmas':    return <DecorChristmas />;
    case 'bee_hive':     return <DecorBeeHive />;
    default:             return null;
  }
}

// ---------- ПУЗЫРЬКИ (тёмный пастель с мятным) ----------
function DecorBubbles() {
  const bubbles = [
    { x: 8,  y: 12, size: 100, delay: 0,   duration: 14, color: 'rgba(166, 133, 255, 0.35)' },
    { x: 82, y: 18, size: 140, delay: 2,   duration: 18, color: 'rgba(120, 235, 192, 0.32)' },
    { x: 18, y: 62, size: 110, delay: 4,   duration: 16, color: 'rgba(190, 160, 255, 0.30)' },
    { x: 75, y: 75, size: 90,  delay: 1,   duration: 15, color: 'rgba(140, 230, 200, 0.30)' },
    { x: 50, y: 5,  size: 70,  delay: 3,   duration: 17, color: 'rgba(220, 180, 255, 0.28)' },
    { x: 92, y: 50, size: 60,  delay: 5,   duration: 13, color: 'rgba(120, 235, 192, 0.35)' },
    { x: 5,  y: 88, size: 80,  delay: 2.5, duration: 19, color: 'rgba(166, 133, 255, 0.28)' },
    { x: 40, y: 90, size: 65,  delay: 4.5, duration: 16, color: 'rgba(120, 235, 192, 0.30)' },
  ];
  // Звёздочки-блики поверх
  const stars = [
    { x: 25, y: 30, delay: 0 },
    { x: 70, y: 45, delay: 1.2 },
    { x: 40, y: 70, delay: 2.4 },
    { x: 88, y: 28, delay: 3.6 },
    { x: 15, y: 80, delay: 0.6 },
  ];
  return (
    <div className="theme-decor decor-bubbles">
      {bubbles.map((b, i) => (
        <div key={i} className="bubble" style={{
          left: `${b.x}%`, top: `${b.y}%`,
          width: b.size, height: b.size, background: b.color,
          animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s`,
        }}/>
      ))}
      {stars.map((s, i) => (
        <div key={`s${i}`} className="pastel-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          animationDelay: `${s.delay}s`,
        }}>✦</div>
      ))}
    </div>
  );
}

// ---------- ACKI NACKI — парящие NACKL и SHELL + сетка точек ----------
function DecorNacklSmiles() {
  const coins = [
    { src: 'coins/nackl.png', x: 6,  y: 10, size: 110, delay: 0,   duration: 16 },
    { src: 'coins/shell.png', x: 78, y: 16, size: 100, delay: 2.5, duration: 19 },
    { src: 'coins/nackl.png', x: 10, y: 70, size: 90, delay: 5,   duration: 15 },
    { src: 'coins/shell.png', x: 82, y: 78, size: 120, delay: 1,   duration: 20 },
    { src: 'coins/nackl.png', x: 50, y: 4,  size: 70, delay: 4,   duration: 17 },
    { src: 'coins/shell.png', x: 50, y: 88, size: 80, delay: 3,   duration: 18 },
    { src: 'coins/nackl.png', x: 35, y: 38, size: 50, delay: 6,   duration: 21 },
  ];
  // Золотые искры
  const sparkles = [
    { x: 20, y: 25, delay: 0 },
    { x: 75, y: 35, delay: 1 },
    { x: 30, y: 60, delay: 2 },
    { x: 85, y: 62, delay: 0.5 },
    { x: 45, y: 50, delay: 1.5 },
  ];
  return (
    <div className="theme-decor decor-nackl">
      <div className="halftone-overlay" />
      {coins.map((c, i) => (
        <img key={i} src={c.src} alt="" aria-hidden="true" className="floating-nackl" style={{
          left: `${c.x}%`, top: `${c.y}%`,
          width: c.size, height: c.size,
          animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`,
        }}/>
      ))}
      {sparkles.map((s, i) => (
        <div key={`s${i}`} className="nackl-spark" style={{
          left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s`,
        }}>✦</div>
      ))}
    </div>
  );
}

// ---------- БИРЖА — свечной график с летающими числами ----------
function DecorCandles() {
  const candles = Array.from({ length: 70 }, (_, i) => {
    const seed = Math.sin(i * 12.345) * 10000;
    const isGreen = (Math.sin(i * 7.111) > -0.1);
    const baseY = 50 + Math.sin(i * 0.4) * 22;
    const bodyHeight = 6 + Math.abs(seed - Math.floor(seed)) * 20;
    const wickHeight = bodyHeight + 8 + Math.abs(Math.cos(i * 3.7)) * 12;
    return { i, x: (i / 70) * 100, y: baseY, bodyHeight, wickHeight, isGreen };
  });

  // Летающие проценты вроде "+3.42%" — придают живости
  const ticks = [
    { x: 12, y: 22, val: '+3.42%', color: '#22c55e', delay: 0 },
    { x: 78, y: 38, val: '-1.18%', color: '#ef4444', delay: 1.4 },
    { x: 30, y: 75, val: '+5.07%', color: '#22c55e', delay: 2.8 },
    { x: 70, y: 82, val: '-0.45%', color: '#ef4444', delay: 0.7 },
    { x: 50, y: 18, val: '+2.31%', color: '#22c55e', delay: 2.1 },
  ];

  return (
    <div className="theme-decor decor-candles">
      <svg className="candles-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {candles.map((c) => (
          <g key={c.i} opacity="0.55">
            <line
              x1={c.x} x2={c.x}
              y1={c.y - c.wickHeight/2} y2={c.y + c.wickHeight/2}
              stroke={c.isGreen ? '#22c55e' : '#ef4444'}
              strokeWidth="0.15"
            />
            <rect
              x={c.x - 0.6} width="1.2"
              y={c.y - c.bodyHeight/2} height={c.bodyHeight}
              fill={c.isGreen ? '#22c55e' : '#ef4444'}
              opacity="0.8"
            />
          </g>
        ))}
        {/* Трендовая линия — анимированная */}
        <path
          d="M 0 60 Q 25 30 50 45 T 100 30"
          stroke="#f0b90b" strokeWidth="0.4" fill="none" opacity="0.65"
          strokeDasharray="0.6 0.4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="1" dur="2s" repeatCount="indefinite"/>
        </path>
      </svg>
      {ticks.map((t, i) => (
        <div key={i} className="exchange-tick" style={{
          left: `${t.x}%`, top: `${t.y}%`,
          color: t.color, animationDelay: `${t.delay}s`,
        }}>{t.val}</div>
      ))}
    </div>
  );
}

// ---------- ПИЦЦА — кусочки + летающие специи ----------
function DecorPizzaSlices() {
  const slices = [
    { x: 8,  y: 14, size: 130, delay: 0,   duration: 18, rot: -15 },
    { x: 78, y: 22, size: 110, delay: 2,   duration: 16, rot: 25 },
    { x: 14, y: 68, size: 140, delay: 4,   duration: 20, rot: -40 },
    { x: 80, y: 76, size: 100, delay: 1,   duration: 17, rot: 60 },
    { x: 50, y: 6,  size: 85,  delay: 3,   duration: 15, rot: 10 },
    { x: 50, y: 92, size: 95,  delay: 2.5, duration: 19, rot: -25 },
  ];
  // Летающие "капли" сыра/масла — оранжевые точки
  const drops = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 7.13) % 95 + 3,
    y: (i * 11.17) % 90 + 5,
    delay: i * 0.4,
    duration: 8 + (i % 4),
  }));
  return (
    <div className="theme-decor decor-pizza">
      {slices.map((s, i) => (
        <PizzaSliceSvg key={i} style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
          transform: `rotate(${s.rot}deg)`,
        }}/>
      ))}
      {drops.map((d, i) => (
        <div key={`d${i}`} className="pizza-drop" style={{
          left: `${d.x}%`, top: `${d.y}%`,
          animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s`,
        }}/>
      ))}
    </div>
  );
}

function PizzaSliceSvg({ style }: { style: React.CSSProperties }) {
  return (
    <svg className="pizza-slice" viewBox="0 0 100 100" style={style} aria-hidden="true">
      <defs>
        <linearGradient id="pizzaCrust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b97e"/>
          <stop offset="100%" stopColor="#7a4818"/>
        </linearGradient>
        <radialGradient id="pizzaCheese" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fff080"/>
          <stop offset="100%" stopColor="#ffaa30"/>
        </radialGradient>
      </defs>
      <path d="M 50 6 L 92 90 Q 50 98 8 90 Z" fill="url(#pizzaCheese)" stroke="url(#pizzaCrust)" strokeWidth="4"/>
      {/* Пепперони */}
      <circle cx="42" cy="50" r="7" fill="#d83020"/>
      <circle cx="60" cy="62" r="6" fill="#d83020"/>
      <circle cx="48" cy="78" r="5" fill="#d83020"/>
      <circle cx="38" cy="32" r="4.5" fill="#d83020"/>
      <circle cx="62" cy="40" r="4" fill="#d83020"/>
      {/* Блики сыра */}
      <circle cx="33" cy="65" r="2.5" fill="#fff" opacity="0.7"/>
      <circle cx="68" cy="50" r="2" fill="#fff" opacity="0.7"/>
      <circle cx="55" cy="80" r="2.2" fill="#fff" opacity="0.6"/>
      <circle cx="50" cy="55" r="1.5" fill="#fff" opacity="0.5"/>
    </svg>
  );
}

// ---------- TERMINAL — Matrix rain (хороший как есть, оставляю) ----------
function DecorMatrixRain() {
  const columns = Array.from({ length: 16 }, (_, i) => ({
    x: (i / 16) * 100 + 1,
    delay: -(Math.random() * 6),
    duration: 5 + Math.random() * 8,
    text: generateMatrixText(22),
  }));
  return (
    <div className="theme-decor decor-matrix">
      {columns.map((col, i) => (
        <div key={i} className="matrix-column" style={{
          left: `${col.x}%`,
          animationDelay: `${col.delay}s`,
          animationDuration: `${col.duration}s`,
        }}>
          {col.text.split('').map((ch, j) => (
            <span key={j}>{ch}</span>
          ))}
        </div>
      ))}
      <div className="crt-scanlines" />
    </div>
  );
}

function generateMatrixText(len: number): string {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ---------- CYBERPUNK — город + летающие ховеркары + неоновая дымка ----------
function DecorCyberCity() {
  const buildings = [
    { x: 4,  w: 9,  h: 62, windows: 16 },
    { x: 14, w: 11, h: 78, windows: 20 },
    { x: 27, w: 7,  h: 58, windows: 13 },
    { x: 35, w: 13, h: 88, windows: 24 },
    { x: 49, w: 9,  h: 68, windows: 17 },
    { x: 59, w: 11, h: 73, windows: 18 },
    { x: 71, w: 8,  h: 53, windows: 11 },
    { x: 80, w: 13, h: 83, windows: 22 },
    { x: 94, w: 5,  h: 47, windows: 9 },
  ];
  return (
    <div className="theme-decor decor-cyber-city">
      <svg className="cyber-city-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {buildings.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x} y={100 - b.h}
              width={b.w} height={b.h}
              fill="#0a0418"
              stroke="#b432ff" strokeWidth="0.1"
              opacity="0.92"
            />
            {Array.from({ length: b.windows }, (_, w) => {
              const wx = b.x + 1 + (w % 3) * ((b.w - 2) / 3);
              const wy = (100 - b.h) + 4 + Math.floor(w / 3) * 4;
              if (wy > 100) return null;
              const isOn = (w * 7 + i * 3) % 7 < 5;
              const color = w % 3 === 0 ? '#beff32' : '#b432ff';
              return (
                <rect
                  key={w}
                  x={wx} y={wy} width="1.4" height="1.7"
                  fill={isOn ? color : 'transparent'}
                  opacity="0.92"
                />
              );
            })}
          </g>
        ))}
        <rect x="0" y="98" width="100" height="2" fill="#1a0830" opacity="0.7"/>
      </svg>
      <div className="cyber-haze" />
      {/* Ховеркары — светящиеся линии летят горизонтально */}
      <div className="cyber-hovercar c1" />
      <div className="cyber-hovercar c2" />
      <div className="cyber-hovercar c3" />
    </div>
  );
}

// ---------- BITCOIN — золотые ₿ + летающие монеты ----------
function DecorBtcSymbols() {
  const symbols = [
    { x: 8,  y: 12, size: 140, delay: 0,   duration: 22, rot: -8 },
    { x: 72, y: 26, size: 110, delay: 3,   duration: 26, rot: 12 },
    { x: 16, y: 64, size: 120, delay: 6,   duration: 20, rot: -20 },
    { x: 78, y: 72, size: 130, delay: 1,   duration: 24, rot: 18 },
    { x: 50, y: 5,  size: 85,  delay: 4,   duration: 18, rot: 5 },
    { x: 45, y: 92, size: 75,  delay: 2,   duration: 21, rot: -10 },
  ];
  // Маленькие золотые искры
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    x: (i * 8.13) % 95 + 3,
    y: (i * 7.17) % 92 + 4,
    delay: i * 0.3,
  }));
  return (
    <div className="theme-decor decor-bitcoin">
      {symbols.map((s, i) => (
        <div key={i} className="btc-symbol" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          fontSize: s.size,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.duration}s`,
          transform: `rotate(${s.rot}deg)`,
        }}>₿</div>
      ))}
      {sparkles.map((s, i) => (
        <div key={`s${i}`} className="btc-spark" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          animationDelay: `${s.delay}s`,
        }}>✦</div>
      ))}
    </div>
  );
}


// ============================================================
// 5 ПЕРЕРАБОТАННЫХ ДЕКОРОВ — ПРЕМИУМ-КАЧЕСТВО
// Многослойные, с глубиной, движением, светом.
// ============================================================

// ---------- 🌊 OCEAN — глубокий океан с биолюминесценцией ----------
function DecorOceanJelly() {
  // ОПТИМИЗАЦИЯ: тема была безумно тяжёлой (60+ анимированных элементов
  // + 2 blur(50px) glow + drop-shadow на каждой медузе). На iPhone 14
  // и старее это убивало GPU — меню еле прорисовывалось, тапы тормозили.
  // Сейчас: 2 крупные медузы + 1 мелкая + 12 планктона. Без depth-glow.
  const jellies = [
    { x: 18, y: 28, size: 120, delay: 0,   duration: 10, hue: 'cyan' },
    { x: 76, y: 72, size: 110, delay: 3,   duration: 11, hue: 'mint' },
  ];
  const smallJellies = [
    { x: 8, y: 60, size: 50, delay: 2, duration: 14, hue: 'cyan' },
  ];
  const plankton = Array.from({ length: 12 }, (_, i) => ({
    x: (i * 41.7) % 100,
    y: (i * 23.71) % 100,
    delay: -(i * 0.6),
    duration: 8 + (i % 3),
    size: 2 + (i % 2),
  }));
  const bubbles = Array.from({ length: 6 }, (_, i) => ({
    x: 5 + (i * 16.7) % 90,
    size: 6 + (i % 3) * 3,
    delay: -(i * 1.4),
    duration: 11 + (i % 3) * 2,
  }));
  return (
    <div className="theme-decor decor-ocean">
      {/* depth-glow убран — был самым дорогим (blur 50px × 2 + animation) */}
      {/* Один лучик сверху для атмосферы — раньше было 3 */}
      <div className="ocean-ray r1" />
      {/* Планктон — сокращён до 12 точек (было 40) */}
      {plankton.map((p, i) => (
        <div key={`p${i}`} className="ocean-plankton" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }}/>
      ))}
      {/* Одна задняя мелкая медуза */}
      {smallJellies.map((j, i) => (
        <JellyfishPremium key={`sj${i}`} small hue={j.hue as any} style={{
          left: `${j.x}%`, top: `${j.y}%`,
          width: j.size, height: j.size * 1.5,
          animationDelay: `${j.delay}s`, animationDuration: `${j.duration}s`,
        }}/>
      ))}
      {/* 2 крупные медузы (было 4) */}
      {jellies.map((j, i) => (
        <JellyfishPremium key={`j${i}`} hue={j.hue as any} style={{
          left: `${j.x}%`, top: `${j.y}%`,
          width: j.size, height: j.size * 1.5,
          animationDelay: `${j.delay}s`, animationDuration: `${j.duration}s`,
        }}/>
      ))}
      {/* Пузыри */}
      {bubbles.map((b, i) => (
        <div key={`b${i}`} className="ocean-bubble" style={{
          left: `${b.x}%`,
          width: b.size, height: b.size,
          animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s`,
        }}/>
      ))}
    </div>
  );
}

function JellyfishPremium({ hue, small, style }: { hue: 'cyan' | 'mint'; small?: boolean; style: React.CSSProperties }) {
  const cls = `ocean-jellyfish ${small ? 'jelly-small' : 'jelly-large'} jelly-${hue}`;
  return (
    <svg className={cls} viewBox="0 0 100 150" style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`jellyDome-${hue}-${small ? 's' : 'l'}`} cx="50%" cy="35%">
          <stop offset="0%" stopColor={hue === 'cyan' ? '#a0ffff' : '#a0ffd8'} stopOpacity="0.95"/>
          <stop offset="50%" stopColor={hue === 'cyan' ? '#40dcff' : '#40ffb0'} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={hue === 'cyan' ? '#2080d0' : '#108070'} stopOpacity="0.3"/>
        </radialGradient>
        <linearGradient id={`tentacle-${hue}-${small ? 's' : 'l'}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={hue === 'cyan' ? '#a0ffff' : '#a0ffd8'} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={hue === 'cyan' ? '#40dcff' : '#40ffb0'} stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      {/* Купол — основная форма */}
      <g className="jelly-body">
        <path d="M 20 50 Q 20 15 50 15 Q 80 15 80 50 Q 80 60 75 62 L 25 62 Q 20 60 20 50 Z"
              fill={`url(#jellyDome-${hue}-${small ? 's' : 'l'})`}/>
        {/* Внутренние «органы» — едва видимые круги */}
        <ellipse cx="40" cy="42" rx="3" ry="4" fill={hue === 'cyan' ? '#80f0ff' : '#80ffc0'} opacity="0.6"/>
        <ellipse cx="60" cy="42" rx="3" ry="4" fill={hue === 'cyan' ? '#80f0ff' : '#80ffc0'} opacity="0.6"/>
        <ellipse cx="50" cy="50" rx="4" ry="5" fill={hue === 'cyan' ? '#80f0ff' : '#80ffc0'} opacity="0.5"/>
        {/* Верхний светящийся обод */}
        <path d="M 20 50 Q 20 15 50 15 Q 80 15 80 50"
              fill="none" stroke={hue === 'cyan' ? '#a0ffff' : '#a0ffd8'}
              strokeWidth="1.5" opacity="0.9"/>
      </g>
      {/* Щупальца — волнистые с градиентом затухания */}
      <g className="jelly-tentacles">
        <path d="M 28 62 Q 26 80 30 100 Q 28 120 32 140"
              stroke={`url(#tentacle-${hue}-${small ? 's' : 'l'})`} strokeWidth="1.5" fill="none"/>
        <path d="M 38 64 Q 36 85 42 105 Q 38 125 40 145"
              stroke={`url(#tentacle-${hue}-${small ? 's' : 'l'})`} strokeWidth="1.8" fill="none"/>
        <path d="M 50 64 Q 50 88 48 108 Q 52 128 50 148"
              stroke={`url(#tentacle-${hue}-${small ? 's' : 'l'})`} strokeWidth="2" fill="none"/>
        <path d="M 62 64 Q 64 85 58 105 Q 62 125 60 145"
              stroke={`url(#tentacle-${hue}-${small ? 's' : 'l'})`} strokeWidth="1.8" fill="none"/>
        <path d="M 72 62 Q 74 80 70 100 Q 72 120 68 140"
              stroke={`url(#tentacle-${hue}-${small ? 's' : 'l'})`} strokeWidth="1.5" fill="none"/>
      </g>
    </svg>
  );
}


// ============================================================
// 🇨🇳 CHINA — фонарики, пагода, золотой дракон
// ============================================================
// Композиция: ночное красно-золотое небо, силуэт горной гряды с пагодой,
// висящие красные бумажные фонарики, золотой дракон извивается, бамбуковые
// заросли, плавающие иероглифы, падающие лепестки сакуры.
function DecorChinaLanterns() {
  // Бумажные фонарики — несколько штук разного размера
  const lanterns = Array.from({ length: 9 }, (_, i) => ({
    x: 3 + (i * 11.4) % 95,
    y: 5 + (i % 3) * 8,
    size: 36 + (i % 4) * 10,
    delay: i * 0.5,
    duration: 4 + (i % 3),
    swayDelay: i * 0.3,
  }));
  // Плавающие иероглифы
  const chars = [
    { char: '福', x: 12, y: 28, size: 70, delay: 0,   duration: 14 },
    { char: '寿', x: 78, y: 35, size: 60, delay: 3.5, duration: 16 },
    { char: '財', x: 22, y: 62, size: 65, delay: 7,   duration: 13 },
    { char: '龍', x: 82, y: 70, size: 55, delay: 5,   duration: 17 },
    { char: '吉', x: 50, y: 48, size: 50, delay: 9,   duration: 15 },
  ];
  return (
    <div className="theme-decor decor-china">
      {/* Красный туман-зарево вверху */}
      <div className="cn-red-haze" />
      {/* Большая красная луна с золотым ореолом */}
      <div className="cn-moon-glow" />
      <div className="cn-moon" />

      {/* Силуэт горной гряды с пагодой на ней */}
      <svg className="cn-mountains" viewBox="0 0 100 40" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="cn-mtn-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0608" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#2a1014" stopOpacity="0.95"/>
          </linearGradient>
        </defs>
        {/* Горы силуэт */}
        <path d="M 0 30 L 8 24 L 14 26 L 22 18 L 30 22 L 38 20 L 46 24 L 54 16 L 62 22 L 70 18 L 78 24 L 86 20 L 94 26 L 100 22 L 100 40 L 0 40 Z"
              fill="url(#cn-mtn-grad)"/>

        {/* Пагода на средней горе — детальная */}
        <g transform="translate(48 12)">
          {/* Основание */}
          <rect x="-4" y="6" width="8" height="2" fill="#1a0608"/>
          {/* Нижний этаж */}
          <rect x="-3.5" y="3" width="7" height="3" fill="#2a0a0c"/>
          {/* Крыша 1 (нижняя) — изогнутая в углах */}
          <path d="M -5 3 Q -5.5 2 -4 1.8 L 4 1.8 Q 5.5 2 5 3 L 4 3.2 L -4 3.2 Z" fill="#3a0a0c"/>
          {/* Средний этаж */}
          <rect x="-2.5" y="-0.2" width="5" height="2" fill="#2a0a0c"/>
          {/* Крыша 2 */}
          <path d="M -4 -0.2 Q -4.5 -1 -3 -1.2 L 3 -1.2 Q 4.5 -1 4 -0.2 L 3 0 L -3 0 Z" fill="#3a0a0c"/>
          {/* Верхний этаж */}
          <rect x="-1.5" y="-3" width="3" height="1.8" fill="#2a0a0c"/>
          {/* Крыша 3 */}
          <path d="M -3 -3 Q -3.5 -3.5 -2 -3.8 L 2 -3.8 Q 3.5 -3.5 3 -3 L 2 -2.9 L -2 -2.9 Z" fill="#3a0a0c"/>
          {/* Шпиль */}
          <line x1="0" y1="-3.8" x2="0" y2="-5" stroke="#f0c040" strokeWidth="0.25"/>
          <circle cx="0" cy="-5" r="0.3" fill="#f0c040"/>
          {/* Тёплое окно */}
          <rect x="-1.5" y="3.5" width="0.7" height="1.2" fill="#f0c040" opacity="0.8"/>
          <rect x="0.8" y="3.5" width="0.7" height="1.2" fill="#f0c040" opacity="0.8"/>
        </g>

        {/* Маленькая пагода справа */}
        <g transform="translate(82 18)">
          <rect x="-2" y="4" width="4" height="1.2" fill="#1a0608"/>
          <rect x="-1.7" y="2" width="3.4" height="2" fill="#2a0a0c"/>
          <path d="M -3 2 Q -3 1 -2 0.8 L 2 0.8 Q 3 1 3 2 L 2 2.1 L -2 2.1 Z" fill="#3a0a0c"/>
          <rect x="-1" y="-0.5" width="2" height="1.3" fill="#2a0a0c"/>
          <path d="M -2.2 -0.5 Q -2.5 -1.2 -1 -1.4 L 1 -1.4 Q 2.5 -1.2 2.2 -0.5 L 1 -0.4 L -1 -0.4 Z" fill="#3a0a0c"/>
          <line x1="0" y1="-1.4" x2="0" y2="-2.3" stroke="#f0c040" strokeWidth="0.2"/>
        </g>
      </svg>

      {/* Бамбуковые заросли по бокам — гуще */}
      <svg className="cn-bamboo cn-bamboo-left" viewBox="0 0 40 100" preserveAspectRatio="xMinYMax meet" aria-hidden="true">
        <BambooStalk x={3} height={92} segments={8} />
        <BambooStalk x={8} height={78} segments={7} />
        <BambooStalk x={14} height={88} segments={8} />
        <BambooStalk x={20} height={72} segments={6} />
        <BambooStalk x={26} height={85} segments={7} />
        <BambooStalk x={32} height={68} segments={6} />
      </svg>
      <svg className="cn-bamboo cn-bamboo-right" viewBox="0 0 40 100" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
        <BambooStalk x={8} height={68} segments={6} />
        <BambooStalk x={14} height={85} segments={7} />
        <BambooStalk x={20} height={72} segments={6} />
        <BambooStalk x={26} height={90} segments={8} />
        <BambooStalk x={32} height={75} segments={7} />
        <BambooStalk x={37} height={82} segments={7} />
      </svg>

      {/* Бамбук гуще — больше стеблей и они шире покрывают край */}
      {/* (Дракон убран — голова отрывалась от тела из-за разных animation
          у svg и cn-dragon-head, выглядело некрасиво) */}

      {/* Фонарики — висят с потолка */}
      {lanterns.map((l, i) => (
        <ChineseLantern key={i} style={{
          left: `${l.x}%`, top: `${l.y}%`,
          width: l.size, height: l.size * 1.3,
          '--cn-sway-dur': `${l.duration}s`,
          '--cn-sway-delay': `${l.swayDelay}s`,
        } as React.CSSProperties}/>
      ))}

      {/* Плавающие иероглифы */}
      {chars.map((c, i) => (
        <div key={i} className="cn-char" style={{
          left: `${c.x}%`, top: `${c.y}%`,
          fontSize: c.size,
          animationDelay: `${c.delay}s`,
          animationDuration: `${c.duration}s`,
        }}>{c.char}</div>
      ))}

      {/* Лепестки сакуры убраны — на мобилках их анимация глючила */}
    </div>
  );
}

/** Бумажный китайский фонарик — красный с золотой полосой */
function ChineseLantern({ style }: { style: React.CSSProperties }) {
  return (
    <div className="cn-lantern" style={style}>
      {/* Шнурок-подвеска */}
      <div className="cn-lantern-cord" />
      {/* Верхушка-крышечка */}
      <div className="cn-lantern-top" />
      {/* Тело фонарика */}
      <div className="cn-lantern-body">
        {/* Свечение изнутри */}
        <div className="cn-lantern-glow" />
        {/* Иероглиф на фонарике */}
        <div className="cn-lantern-char">福</div>
        {/* Золотой обруч сверху */}
        <div className="cn-lantern-band cn-band-top" />
        {/* Золотой обруч снизу */}
        <div className="cn-lantern-band cn-band-bottom" />
      </div>
      {/* Кисточка снизу */}
      <div className="cn-lantern-tassel">
        <div className="cn-tassel-knot" />
        <div className="cn-tassel-strings" />
      </div>
    </div>
  );
}

/** Бамбуковый стебель — с сегментами и парой листьев */
function BambooStalk({ x, height, segments }: { x: number; height: number; segments: number }) {
  const segHeight = height / segments;
  return (
    <g>
      {/* Ствол */}
      <line x1={x} y1={100} x2={x} y2={100 - height} stroke="#2a5028" strokeWidth="1.5"/>
      {/* Сегментные узлы */}
      {Array.from({ length: segments }).map((_, i) => (
        <line key={i}
              x1={x - 1} y1={100 - segHeight * (i + 1)}
              x2={x + 1} y2={100 - segHeight * (i + 1)}
              stroke="#1a3a18" strokeWidth="0.6"/>
      ))}
      {/* Пара листьев на верхушке */}
      <path d={`M ${x} ${100 - height + 5} Q ${x - 4} ${100 - height} ${x - 6} ${100 - height + 8}`}
            fill="#3a6028" opacity="0.85"/>
      <path d={`M ${x} ${100 - height + 5} Q ${x + 4} ${100 - height} ${x + 6} ${100 - height + 8}`}
            fill="#3a6028" opacity="0.85"/>
    </g>
  );
}

function DecorHalloween() {
  const pumpkins = [
    { x: 10, y: 68, size: 110, delay: 0,   duration: 5,  variant: 1 },
    { x: 78, y: 76, size: 130, delay: 1.5, duration: 6,  variant: 2 },
    { x: 45, y: 72, size: 90,  delay: 3,   duration: 5.5, variant: 3 },
  ];
  // Летучие мыши — несколько штук разного размера
  const bats = [
    { y: 14, size: 60, delay: 0,    duration: 9,  scale: 1 },
    { y: 28, size: 45, delay: 2.5,  duration: 11, scale: 0.7 },
    { y: 42, size: 70, delay: 5,    duration: 8,  scale: 1.1 },
    { y: 22, size: 50, delay: 7,    duration: 10, scale: 0.8 },
    { y: 50, size: 40, delay: 3,    duration: 12, scale: 0.65 },
  ];
  // Звёзды + летающие искры
  const stars = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 11.7) % 96 + 2,
    y: (i * 7.3) % 50 + 3,
    delay: i * 0.35,
    size: 8 + (i % 3) * 3,
  }));
  // Туман снизу — несколько слоёв
  return (
    <div className="theme-decor decor-halloween">
      {/* Лунный свет — большой холодный круг */}
      <div className="halloween-moon" />
      <div className="halloween-moon-glow" />
      {/* Кладбищенский туман снизу */}
      <div className="halloween-fog f1" />
      <div className="halloween-fog f2" />
      {/* Звёзды */}
      {stars.map((s, i) => (
        <div key={`s${i}`} className="halloween-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          fontSize: s.size,
          animationDelay: `${s.delay}s`,
        }}>✦</div>
      ))}
      {/* Летучие мыши */}
      {bats.map((b, i) => (
        <BatPremium key={`b${i}`} top={b.y} size={b.size} scale={b.scale}
                    delay={b.delay} duration={b.duration} />
      ))}
      {/* Тыквы */}
      {pumpkins.map((p, i) => (
        <PumpkinPremium key={`p${i}`} variant={p.variant} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }}/>
      ))}
    </div>
  );
}

function PumpkinPremium({ variant, style }: { variant: number; style: React.CSSProperties }) {
  // 3 разных лица тыквы для разнообразия
  const faces = {
    1: { eyes: 'M 38 50 L 45 50 L 41 58 Z M 55 50 L 62 50 L 58 58 Z',
         mouth: 'M 30 70 L 38 66 L 44 70 L 50 66 L 56 70 L 62 66 L 70 70 L 65 80 L 35 80 Z' },
    2: { eyes: 'M 35 48 L 47 48 L 41 60 Z M 53 48 L 65 48 L 59 60 Z',
         mouth: 'M 25 68 L 35 64 L 45 72 L 55 64 L 65 72 L 75 68 L 70 82 L 30 82 Z' },
    3: { eyes: 'M 36 52 L 44 52 L 40 60 Z M 56 52 L 64 52 L 60 60 Z',
         mouth: 'M 32 72 L 40 68 L 50 74 L 60 68 L 68 72 L 64 80 L 36 80 Z' },
  }[variant] || { eyes: '', mouth: '' };
  return (
    <svg className="halloween-pumpkin" viewBox="0 0 100 110" style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`pmp-${variant}`} cx="38%" cy="38%">
          <stop offset="0%" stopColor="#ffb060"/>
          <stop offset="60%" stopColor="#e07020"/>
          <stop offset="100%" stopColor="#8a3010"/>
        </radialGradient>
        <radialGradient id={`pmp-glow-${variant}`} cx="50%" cy="65%">
          <stop offset="0%" stopColor="#ffd000" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#ff8000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* 5 сегментов для объёмности */}
      <ellipse cx="22" cy="60" rx="16" ry="32" fill={`url(#pmp-${variant})`} opacity="0.85"/>
      <ellipse cx="38" cy="60" rx="22" ry="36" fill={`url(#pmp-${variant})`} opacity="0.95"/>
      <ellipse cx="50" cy="60" rx="26" ry="38" fill={`url(#pmp-${variant})`}/>
      <ellipse cx="62" cy="60" rx="22" ry="36" fill={`url(#pmp-${variant})`} opacity="0.95"/>
      <ellipse cx="78" cy="60" rx="16" ry="32" fill={`url(#pmp-${variant})`} opacity="0.85"/>
      {/* Светлый блик сверху-слева */}
      <ellipse cx="35" cy="40" rx="12" ry="18" fill="#ffd080" opacity="0.35"/>
      {/* Стебель */}
      <path d="M 42 18 L 50 8 L 58 18 L 55 28 L 45 28 Z" fill="#2a4015" stroke="#1a2810" strokeWidth="0.8"/>
      <path d="M 50 8 Q 65 12 60 22" stroke="#3a5020" strokeWidth="2" fill="none" opacity="0.7"/>
      {/* Тёплое свечение изнутри (jack-o-lantern) */}
      <ellipse cx="50" cy="68" rx="35" ry="20" fill={`url(#pmp-glow-${variant})`}/>
      {/* Глаза-треугольники */}
      <path d={faces.eyes} fill="#ffe040" stroke="#000" strokeWidth="0.5">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
      </path>
      {/* Рот */}
      <path d={faces.mouth} fill="#ffe040" stroke="#000" strokeWidth="0.5"/>
    </svg>
  );
}

function BatPremium({ top, size, scale, delay, duration }: {
  top: number; size: number; scale: number; delay: number; duration: number;
}) {
  return (
    <svg className="halloween-bat" viewBox="0 0 100 60" style={{
      top: `${top}%`,
      width: size, height: size * 0.6,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      transform: `scale(${scale})`,
    }}>
      <defs>
        <linearGradient id={`batGrad-${size}-${delay}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a1058"/>
          <stop offset="100%" stopColor="#0a0210"/>
        </linearGradient>
      </defs>
      {/* Крылья — более детальные */}
      <g className="bat-wings">
        <path d="M 50 30 L 30 12 Q 18 8 8 18 Q 20 25 30 22 L 45 32 L 50 50 L 55 32 L 70 22 Q 80 25 92 18 Q 82 8 70 12 Z"
              fill={`url(#batGrad-${size}-${delay})`}
              stroke="#a060e0" strokeWidth="0.6"/>
        {/* Перепонки крыльев */}
        <path d="M 35 18 L 38 28 M 30 22 L 33 30 M 65 18 L 62 28 M 70 22 L 67 30"
              stroke="#a060e0" strokeWidth="0.3" opacity="0.5"/>
      </g>
      {/* Тело */}
      <ellipse cx="50" cy="32" rx="5" ry="8" fill="#0a0210" stroke="#a060e0" strokeWidth="0.5"/>
      {/* Уши */}
      <path d="M 47 24 L 45 18 L 48 22 Z M 53 24 L 55 18 L 52 22 Z" fill="#0a0210"/>
      {/* Глаза светящиеся */}
      <circle cx="48" cy="30" r="1.2" fill="#ff8228">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="52" cy="30" r="1.2" fill="#ff8228">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}


// ============================================================
// ❄️ CHRISTMAS — реалистичная зимняя ночь
// ============================================================
// Подход: композиция как живопись. Глубина через слои с воздушной перспективой,
// силуэты вместо контуров, тёплые точки света от окон, мягкий снежный туман.
function DecorChristmas() {
  // Снежинки нескольких типов — крупные близкие (быстрые, чёткие)
  // и мелкие далёкие (медленные, размытые)
  const closeFlakes = Array.from({ length: 12 }, (_, i) => ({
    x: (i * 8.71) % 100,
    size: 5 + (i % 4) * 2,
    delay: -(i * 0.9),
    duration: 7 + (i % 3) * 2,
    drift: 15 + (i % 5) * 8,
  }));
  const farFlakes = Array.from({ length: 30 }, (_, i) => ({
    x: (i * 3.37) % 100,
    size: 2 + (i % 2),
    delay: -(i * 0.5),
    duration: 12 + (i % 4) * 3,
  }));
  const stars = Array.from({ length: 35 }, (_, i) => ({
    x: 1 + (i * 6.13) % 98,
    y: 1 + (i * 2.71) % 30,
    size: 1 + (i % 4),
    delay: i * 0.18,
  }));

  return (
    <div className="theme-decor decor-christmas-v2">
      {/* Луна с многослойным свечением */}
      <div className="xm2-moon-aura" />
      <div className="xm2-moon-glow" />
      <div className="xm2-moon">
        <div className="xm2-moon-crater xm2-c1" />
        <div className="xm2-moon-crater xm2-c2" />
        <div className="xm2-moon-crater xm2-c3" />
      </div>

      {stars.map((s, i) => (
        <div key={`s${i}`} className="xm2-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          animationDelay: `${s.delay}s`,
        }}/>
      ))}

      <div className="xm2-aurora" />

      <div className="xm2-santa">
        <SantaSilhouette />
      </div>

      {/* Основной SVG-композит */}
      <svg className="xm2-scene" viewBox="0 0 100 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="xm2-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(70,90,130,0)"/>
            <stop offset="100%" stopColor="rgba(120,140,180,0.4)"/>
          </linearGradient>
          <linearGradient id="xm2-fardark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0f1c"/>
            <stop offset="100%" stopColor="#1a2138"/>
          </linearGradient>
          <linearGradient id="xm2-middark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1320"/>
            <stop offset="100%" stopColor="#172238"/>
          </linearGradient>
          <linearGradient id="xm2-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f0f8"/>
            <stop offset="40%" stopColor="#c8d8ea"/>
            <stop offset="100%" stopColor="#8aa0bc"/>
          </linearGradient>
          <radialGradient id="xm2-window-light" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffd060" stopOpacity="0.95"/>
            <stop offset="60%" stopColor="#ff9020" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#ff7000" stopOpacity="0"/>
          </radialGradient>
          <filter id="xm2-blur-soft"><feGaussianBlur stdDeviation="0.4"/></filter>
        </defs>

        {/* Слой 1: дальние горы */}
        <g opacity="0.45" filter="url(#xm2-blur-soft)">
          <path d="M 0 24 L 6 18 L 12 22 L 20 14 L 28 20 L 35 16 L 44 22 L 52 17 L 60 21 L 70 15 L 80 20 L 90 17 L 100 22 L 100 30 L 0 30 Z"
                fill="url(#xm2-fardark)"/>
          <path d="M 6 18 L 8 19 L 10 19 M 20 14 L 22 15 L 25 15 M 35 16 L 38 17 L 40 17 M 52 17 L 54 18 L 56 18 M 70 15 L 72 16 L 75 16"
                stroke="#e8eef8" strokeWidth="0.3" fill="none" opacity="0.6"/>
        </g>

        {/* Слой 2: дальний лес-силуэт */}
        <g opacity="0.75">
          <path d="M 0 30 L 2 28 L 4 30 L 6 26 L 8 30 L 10 27 L 12 30 L 14 25 L 16 30 L 18 27 L 20 30 L 22 24 L 24 30 L 26 28 L 28 30 L 30 25 L 32 30 L 34 27 L 36 30 L 38 26 L 40 30 L 42 24 L 44 30 L 46 27 L 48 30 L 50 25 L 52 30 L 54 28 L 56 30 L 58 26 L 60 30 L 62 24 L 64 30 L 66 27 L 68 30 L 70 25 L 72 30 L 74 28 L 76 30 L 78 26 L 80 30 L 82 25 L 84 30 L 86 27 L 88 30 L 90 26 L 92 30 L 94 28 L 96 30 L 98 26 L 100 30 L 100 38 L 0 38 Z"
                fill="url(#xm2-middark)"/>
        </g>

        {/* Туман между планами */}
        <rect x="0" y="30" width="100" height="14" fill="url(#xm2-haze)" opacity="0.6"/>

        {/* Слой 3: домики и большие ёлки */}
        <CozyHouse x={6} y={36} scale={1.0} chimneyDelay={0} />
        <PineTree x={22} y={32} scale={1.3} />
        <PineTree x={28} y={36} scale={0.8} />
        <CozyHouse x={40} y={34} scale={1.4} chimneyDelay={1.5} variant={2} />
        <PineTree x={62} y={32} scale={1.5} />
        <PineTree x={68} y={37} scale={0.7} />
        <CozyHouse x={76} y={35} scale={1.1} chimneyDelay={3} />
        <PineTree x={92} y={38} scale={0.6} />
        <PineTree x={2} y={40} scale={0.5} />

        {/* Слой 4: снежные сугробы */}
        <path d="M 0 60 L 0 50 C 8 47 16 51 25 49 C 35 46 45 51 55 48 C 65 45 75 50 85 47 C 92 45 100 49 100 51 L 100 60 Z"
              fill="url(#xm2-snow)"/>
        <path d="M 0 50 C 8 47 16 51 25 49 C 35 46 45 51 55 48 C 65 45 75 50 85 47 C 92 45 100 49 100 51"
              stroke="rgba(80,110,150,0.4)" strokeWidth="0.15" fill="none"/>
        <ellipse cx="18" cy="55" rx="6" ry="1.2" fill="#d8e4f0" opacity="0.7"/>
        <ellipse cx="50" cy="56" rx="8" ry="1.5" fill="#d8e4f0" opacity="0.7"/>
        <ellipse cx="82" cy="55" rx="6" ry="1.3" fill="#d8e4f0" opacity="0.7"/>
      </svg>

      <div className="xm2-snow-mist" />

      {farFlakes.map((f, i) => (
        <div key={`ff${i}`} className="xm2-flake-far" style={{
          left: `${f.x}%`, width: f.size, height: f.size,
          animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s`,
        }}/>
      ))}

      {closeFlakes.map((f, i) => (
        <div key={`cf${i}`} className="xm2-flake-close" style={{
          left: `${f.x}%`, width: f.size, height: f.size,
          animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s`,
          '--xm2-drift': `${f.drift}px`,
        } as React.CSSProperties}/>
      ))}
    </div>
  );
}

/** Силуэт уютного домика */
function CozyHouse({ x, y, scale, chimneyDelay, variant = 1 }: {
  x: number; y: number; scale: number; chimneyDelay: number; variant?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="3.5" cy="6" rx="6" ry="4" fill="url(#xm2-window-light)" opacity="0.5"/>
      <ellipse cx="3.5" cy="14.5" rx="6" ry="0.8" fill="#000" opacity="0.3"/>
      <path d="M 0 6 L 0 14 L 7 14 L 7 6 Z" fill="#1a1410"/>
      <path d="M 0 6 L 0 14 L 7 14 L 7 6 Z" fill="url(#xm2-window-light)" opacity="0.15"/>
      <rect x="2.4" y="7.5" width="2.2" height="2.6" fill="url(#xm2-window-light)"
            className={`xm2-window xm2-win-v${variant}`}/>
      <line x1="3.5" y1="7.5" x2="3.5" y2="10.1" stroke="#1a1410" strokeWidth="0.15"/>
      <line x1="2.4" y1="8.8" x2="4.6" y2="8.8" stroke="#1a1410" strokeWidth="0.15"/>
      <rect x="5.0" y="10.5" width="1.4" height="3.5" fill="#0a0806"/>
      <circle cx="6.0" cy="12.3" r="0.08" fill="#ffd870"/>
      <path d="M -1 7 L 3.5 2.5 L 8 7 L 7 7 L 7 6 L 0 6 L 0 7 Z" fill="#1a1410"/>
      <path d="M -1 7 L 3.5 2.5 L 8 7" fill="none" stroke="#e8f0f8" strokeWidth="0.5"/>
      <path d="M -0.8 6.9 Q 0 6.5 1.5 6.6 Q 3 6.3 3.5 6.0 Q 4 6.3 5.5 6.6 Q 7 6.5 7.8 6.9"
            stroke="#e8f0f8" strokeWidth="0.6" fill="#e8f0f8" opacity="0.9"/>
      <rect x="4.5" y="3" width="0.7" height="2" fill="#1a1410"/>
      <rect x="4.4" y="2.9" width="0.9" height="0.3" fill="#e8f0f8"/>
      <g className="xm2-smoke" style={{ animationDelay: `${chimneyDelay}s` }}>
        <ellipse cx="4.85" cy="2.2" rx="0.4" ry="0.3" fill="#b0c0d0" opacity="0.55"/>
        <ellipse cx="5.05" cy="1.4" rx="0.6" ry="0.4" fill="#b0c0d0" opacity="0.4"/>
        <ellipse cx="4.7" cy="0.5" rx="0.8" ry="0.5" fill="#b0c0d0" opacity="0.25"/>
      </g>
    </g>
  );
}

/** Ёлка — реалистичный многослойный силуэт */
function PineTree({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="8.3" rx={2.8 * scale} ry="0.5" fill="#000" opacity="0.35"/>
      <rect x="-0.25" y="6.5" width="0.5" height="2" fill="#1a0e08"/>
      <path d="M -3 7 L -2.5 5.8 L -2 6.5 L -1.5 5.5 L -1 6.2 L -0.5 5.2 L 0 5.8 L 0.5 5.2 L 1 6.2 L 1.5 5.5 L 2 6.5 L 2.5 5.8 L 3 7 Z"
            fill="#0c1f12"/>
      <path d="M -2.5 5.2 L -2 4.2 L -1.6 4.7 L -1.1 3.9 L -0.6 4.4 L 0 3.7 L 0.6 4.4 L 1.1 3.9 L 1.6 4.7 L 2 4.2 L 2.5 5.2 Z"
            fill="#0e2616"/>
      <path d="M -2 3.7 L -1.5 2.7 L -1.1 3.1 L -0.6 2.3 L 0 2.8 L 0.6 2.3 L 1.1 3.1 L 1.5 2.7 L 2 3.7 Z"
            fill="#0e2818"/>
      <path d="M -1.4 2.3 L -1 1.4 L -0.5 1.7 L 0 1 L 0.5 1.7 L 1 1.4 L 1.4 2.3 Z"
            fill="#10301c"/>
      <path d="M -0.7 1.0 L 0 -0.3 L 0.7 1.0 Z" fill="#12381e"/>
      <path d="M -2.8 6.8 L -2.5 6.5 L -2 6.7 M -1.5 6.4 L -1 6.5 L -0.5 6.3 M 0 6.4 L 0.5 6.3 L 1 6.5 M 1.5 6.4 L 2 6.7 L 2.5 6.5 L 2.8 6.8"
            stroke="#e8f0f8" strokeWidth="0.18" fill="none" opacity="0.9"/>
      <path d="M -2.3 5.0 L -2 4.7 L -1.5 4.9 M -1 4.6 L -0.5 4.5 M 0 4.5 L 0.5 4.5 L 1 4.6 M 1.5 4.9 L 2 4.7 L 2.3 5.0"
            stroke="#e8f0f8" strokeWidth="0.15" fill="none" opacity="0.85"/>
      <path d="M -1.7 3.4 L -1.5 3.2 M -1 3.0 L -0.5 3.1 M 0 3.0 L 0.5 3.1 L 1 3.0 M 1.5 3.2 L 1.7 3.4"
            stroke="#e8f0f8" strokeWidth="0.13" fill="none" opacity="0.85"/>
      <path d="M -1.2 2.0 L -0.7 1.6 M 0 1.5 L 0.5 1.6 L 0.9 1.8"
            stroke="#e8f0f8" strokeWidth="0.12" fill="none" opacity="0.85"/>
      <ellipse cx="0" cy="0" rx="0.3" ry="0.15" fill="#ffffff" opacity="0.95"/>
    </g>
  );
}

/** Силуэт Санты с оленями */
function SantaSilhouette() {
  return (
    <svg viewBox="0 0 240 80" aria-hidden="true">
      <defs>
        <radialGradient id="rudolph-nose" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff5040" stopOpacity="1"/>
          <stop offset="50%" stopColor="#ff3030" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff3030" stopOpacity="0"/>
        </radialGradient>
        <filter id="santa-soft-glow">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
        <linearGradient id="sleigh-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a02020"/>
          <stop offset="100%" stopColor="#5a0a08"/>
        </linearGradient>
        <linearGradient id="sleigh-rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1a08"/>
          <stop offset="100%" stopColor="#1a0a04"/>
        </linearGradient>
      </defs>

      {/* Светящийся след за санями — слева, т.к. движение вправо */}
      <ellipse cx="80" cy="50" rx="80" ry="3" fill="rgba(255,210,150,0.20)" filter="url(#santa-soft-glow)"/>

      {/* ===== ОЛЕНИ ВПЕРЕДИ (СПРАВА ПО ХОДУ ДВИЖЕНИЯ) ===== */}
      {/* Олень-Рудольф — большой, чёткий, мордой вправо */}
      <g transform="translate(170 30)">
        {/* Светящийся нос красный glow */}
        <circle cx="32" cy="14" r="6" fill="url(#rudolph-nose)"/>
        <circle cx="32" cy="14" r="1.8" fill="#ff4040">
          <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
        </circle>

        {/* Тело оленя — крупное */}
        <ellipse cx="14" cy="14" rx="12" ry="7" fill="#3a1f0c"/>
        {/* Грудь */}
        <ellipse cx="22" cy="14" rx="4" ry="6" fill="#3a1f0c"/>
        {/* Шея */}
        <path d="M 22 8 Q 24 4 28 4 L 30 6 Q 30 10 26 12 Z" fill="#3a1f0c"/>
        {/* Голова — крупная */}
        <ellipse cx="29" cy="11" rx="4.5" ry="3.5" fill="#3a1f0c"/>
        {/* Морда */}
        <ellipse cx="32" cy="13" rx="3" ry="2" fill="#4a2810"/>
        {/* Глаз */}
        <circle cx="30" cy="10" r="0.6" fill="#fff"/>
        <circle cx="30.2" cy="10" r="0.35" fill="#000"/>
        {/* Уши */}
        <ellipse cx="27" cy="7" rx="1" ry="2" fill="#3a1f0c" transform="rotate(-20 27 7)"/>
        <ellipse cx="29" cy="7" rx="0.8" ry="1.8" fill="#3a1f0c" transform="rotate(15 29 7)"/>
        {/* Рога — детальные */}
        <g stroke="#2a1408" strokeWidth="1" fill="none" strokeLinecap="round">
          <path d="M 27 6 L 25 0 M 25 0 L 22 1 M 25 0 L 27 -3 M 25 0 L 23 -3"/>
          <path d="M 30 5 L 32 -1 M 32 -1 L 35 0 M 32 -1 L 30 -4 M 32 -1 L 34 -4"/>
        </g>
        {/* Ноги передние */}
        <line x1="20" y1="20" x2="22" y2="28" stroke="#2a1408" strokeWidth="1.5"/>
        <line x1="24" y1="20" x2="26" y2="28" stroke="#2a1408" strokeWidth="1.5"/>
        {/* Ноги задние */}
        <line x1="6" y1="20" x2="4" y2="28" stroke="#2a1408" strokeWidth="1.5"/>
        <line x1="10" y1="20" x2="12" y2="28" stroke="#2a1408" strokeWidth="1.5"/>
        {/* Хвост */}
        <circle cx="2" cy="13" r="1.5" fill="#fff"/>
      </g>

      {/* Второй олень (поменьше, за первым) */}
      <g transform="translate(135 35)" opacity="0.85">
        {/* Тело */}
        <ellipse cx="12" cy="12" rx="10" ry="6" fill="#2a1808"/>
        {/* Шея + голова */}
        <path d="M 19 7 Q 22 4 26 5 L 26 9 L 22 11 Z" fill="#2a1808"/>
        <ellipse cx="26" cy="9" rx="3.5" ry="2.8" fill="#2a1808"/>
        <ellipse cx="28.5" cy="11" rx="2.2" ry="1.5" fill="#3a2010"/>
        {/* Глаз */}
        <circle cx="27" cy="8" r="0.4" fill="#fff"/>
        {/* Рога меньше */}
        <g stroke="#1a0e04" strokeWidth="0.8" fill="none" strokeLinecap="round">
          <path d="M 24 4 L 22 -1 M 22 -1 L 20 0 M 22 -1 L 24 -3"/>
          <path d="M 27 3 L 29 -2 M 29 -2 L 31 -1 M 29 -2 L 28 -4"/>
        </g>
        {/* Уши */}
        <ellipse cx="24" cy="5" rx="0.8" ry="1.5" fill="#2a1808" transform="rotate(-20 24 5)"/>
        {/* Ноги */}
        <line x1="17" y1="18" x2="18" y2="24" stroke="#1a0e04" strokeWidth="1.2"/>
        <line x1="20" y1="18" x2="21" y2="24" stroke="#1a0e04" strokeWidth="1.2"/>
        <line x1="5" y1="18" x2="4" y2="24" stroke="#1a0e04" strokeWidth="1.2"/>
        <line x1="8" y1="18" x2="9" y2="24" stroke="#1a0e04" strokeWidth="1.2"/>
      </g>

      {/* ===== ПОВОДЬЯ — от саней через оленей к мордам ===== */}
      <g stroke="#5a3010" strokeWidth="0.8" fill="none" strokeLinecap="round">
        <path d="M 90 48 Q 120 42 145 38 Q 165 36 195 32"/>
        <path d="M 90 51 Q 120 45 145 42 Q 165 40 195 36"/>
      </g>

      {/* ===== САНИ СЗАДИ (СЛЕВА) ===== */}
      <g transform="translate(40 38)">
        {/* Светящийся след под санями */}
        <ellipse cx="22" cy="22" rx="22" ry="2" fill="rgba(255,200,120,0.3)" filter="url(#santa-soft-glow)"/>

        {/* Полозья */}
        <path d="M -6 22 Q -8 18 -2 17 L 50 17 Q 56 18 54 22 L 50 22.5 L -2 22.5 Z"
              fill="url(#sleigh-rail)"/>
        {/* Декоративный загиб полоза спереди */}
        <path d="M 50 17 Q 58 17 60 14" stroke="#3a1a08" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* Корпус саней — изогнутая форма */}
        <path d="M 0 17 Q -3 6 6 4 L 42 4 Q 52 6 50 17 Z"
              fill="url(#sleigh-body)" stroke="#5a0a08" strokeWidth="0.5"/>

        {/* Золотой декор по корпусу */}
        <path d="M 2 11 L 48 11" stroke="#f0c040" strokeWidth="0.6"/>
        <g fill="#f0c040">
          <circle cx="8" cy="13" r="0.5"/>
          <circle cx="16" cy="13" r="0.5"/>
          <circle cx="24" cy="13" r="0.5"/>
          <circle cx="32" cy="13" r="0.5"/>
          <circle cx="40" cy="13" r="0.5"/>
        </g>

        {/* Резной нос саней спереди */}
        <path d="M 50 17 Q 56 12 58 8 Q 56 6 52 8 L 50 14 Z" fill="url(#sleigh-body)" stroke="#5a0a08" strokeWidth="0.4"/>

        {/* Мешок с подарками сзади */}
        <g transform="translate(8 0)">
          <ellipse cx="0" cy="-2" rx="9" ry="6" fill="#a02020"/>
          {/* Верх мешка */}
          <path d="M -8 -6 Q -4 -12 0 -10 Q 4 -12 8 -6" fill="#a02020"/>
          {/* Завязка золотом */}
          <ellipse cx="0" cy="-8" rx="6" ry="0.8" fill="#f0c040"/>
          {/* Снежинка декор */}
          <text x="0" y="0" textAnchor="middle" fontSize="6" fill="#ffd0a0">❄</text>
        </g>

        {/* ===== САНТА В САНЯХ ===== */}
        <g transform="translate(30 -4)">
          {/* Тело */}
          <path d="M -4 0 Q -6 -6 0 -8 L 6 -8 Q 12 -6 10 0 L 9 8 L -3 8 Z"
                fill="#d83020" stroke="#7a1010" strokeWidth="0.5"/>
          {/* Белая опушка снизу */}
          <rect x="-4" y="6" width="14" height="2.5" fill="#fff"/>
          {/* Чёрный пояс с золотой пряжкой */}
          <rect x="-4" y="0" width="14" height="1.8" fill="#1a1a1a"/>
          <rect x="2" y="-0.2" width="2" height="2.2" fill="#f0c040"/>

          {/* Голова */}
          <circle cx="3" cy="-11" r="3.5" fill="#ffd5b0"/>

          {/* Борода */}
          <path d="M 0 -10 Q 3 -6 6 -10 L 6 -8 Q 3 -4 0 -8 Z" fill="#fff"/>

          {/* Усы */}
          <path d="M 1.5 -10 Q 3 -9.5 4.5 -10" stroke="#fff" strokeWidth="0.7" fill="none"/>

          {/* Глаза */}
          <circle cx="2" cy="-12" r="0.4" fill="#000"/>
          <circle cx="4" cy="-12" r="0.4" fill="#000"/>

          {/* Нос румяный */}
          <circle cx="3" cy="-10.5" r="0.6" fill="#e85040"/>

          {/* Красный колпак */}
          <path d="M -0.5 -14 L 6.5 -14 Q 9 -18 4 -19.5 Q 2 -21 0 -18 Z"
                fill="#d83020" stroke="#7a1010" strokeWidth="0.4"/>
          {/* Белый помпон */}
          <circle cx="2" cy="-19" r="1.4" fill="#fff"/>
          {/* Опушка колпака */}
          <rect x="-1" y="-14.5" width="8" height="1.4" fill="#fff"/>

          {/* Машет рукой */}
          <g className="xm2-santa-arm">
            <path d="M 10 -3 Q 14 -7 14 -2 L 13 0 L 10 0 Z" fill="#d83020"/>
            {/* Кисть */}
            <circle cx="14" cy="-5" r="1.2" fill="#ffd5b0"/>
            {/* Опушка манжеты */}
            <rect x="9.5" y="-3" width="3" height="0.8" fill="#fff" transform="rotate(-35 11 -3)"/>
          </g>
        </g>
      </g>
    </svg>
  );
}


function DecorBeeHive() {
  const bees = [
    { x: 12, y: 22, scale: 1,    delay: 0,   duration: 12 },
    { x: 72, y: 32, scale: 0.85, delay: 3,   duration: 14 },
    { x: 26, y: 68, scale: 1.1,  delay: 5.5, duration: 11 },
    { x: 82, y: 74, scale: 0.9,  delay: 1.5, duration: 13 },
    { x: 52, y: 48, scale: 1,    delay: 4,   duration: 10 },
    { x: 38, y: 18, scale: 0.7,  delay: 6,   duration: 15 },
  ];
  return (
    <div className="theme-decor decor-bee">
      {/* Тёплое золотое освещение */}
      <div className="bee-warm-glow" />
      {/* Гексагональная сетка сот */}
      <svg className="bee-honeycomb-base" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hexPattern" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
            <polygon points="10,0 20,5 20,12 10,17 0,12 0,5"
                     fill="none" stroke="#ffc800" strokeWidth="0.4" opacity="0.55"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="200" height="200" fill="url(#hexPattern)"/>
      </svg>
      {/* Заполненные соты с мёдом — крупные с градиентом */}
      <svg className="bee-honeycomb-filled" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="honey-cell" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#ffe080"/>
            <stop offset="60%" stopColor="#ffc800"/>
            <stop offset="100%" stopColor="#c08000"/>
          </radialGradient>
        </defs>
        <g stroke="#ff9800" strokeWidth="0.4">
          <polygon points="18,28 28,33 28,43 18,48 8,43 8,33" fill="url(#honey-cell)" opacity="0.7"/>
          <polygon points="82,22 92,27 92,37 82,42 72,37 72,27" fill="url(#honey-cell)" opacity="0.8"/>
          <polygon points="62,78 72,83 72,93 62,98 52,93 52,83" fill="url(#honey-cell)" opacity="0.75"/>
          <polygon points="15,72 25,77 25,87 15,92 5,87 5,77" fill="url(#honey-cell)" opacity="0.65"/>
          <polygon points="50,50 60,55 60,65 50,70 40,65 40,55" fill="url(#honey-cell)" opacity="0.85"/>
        </g>
        {/* Блик-капля мёда на одной из сот */}
        <ellipse cx="50" cy="55" rx="3" ry="2" fill="#fff080" opacity="0.6"/>
        <ellipse cx="82" cy="29" rx="2.5" ry="1.5" fill="#fff080" opacity="0.6"/>
      </svg>
      {/* Пчёлы */}
      {bees.map((b, i) => (
        <BeePremium key={i} x={b.x} y={b.y} scale={b.scale}
                    delay={b.delay} duration={b.duration} />
      ))}
    </div>
  );
}

function BeePremium({ x, y, scale, delay, duration }: {
  x: number; y: number; scale: number; delay: number; duration: number;
}) {
  return (
    <svg className="bee-fly" viewBox="0 0 100 60" style={{
      left: `${x}%`, top: `${y}%`,
      width: 70 * scale, height: 42 * scale,
      animationDelay: `${delay}s`, animationDuration: `${duration}s`,
    }}>
      <defs>
        <linearGradient id={`bee-body-${delay}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe066"/>
          <stop offset="100%" stopColor="#cc8800"/>
        </linearGradient>
      </defs>
      {/* Тело с градиентом */}
      <ellipse cx="50" cy="35" rx="20" ry="13" fill={`url(#bee-body-${delay})`}
               stroke="#704000" strokeWidth="1.2"/>
      {/* Тёмные полосы */}
      <path d="M 33 25 Q 33 35 33 45" stroke="#1a1408" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M 42 22 Q 42 35 42 48" stroke="#1a1408" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 52 22 Q 52 35 52 48" stroke="#1a1408" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 62 25 Q 62 35 62 45" stroke="#1a1408" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Голова */}
      <circle cx="74" cy="35" r="9" fill="#cc8800" stroke="#704000" strokeWidth="1"/>
      <circle cx="78" cy="32" r="2.5" fill="#1a1408"/>
      <circle cx="79" cy="31" r="0.7" fill="white"/>
      {/* Антенны */}
      <path d="M 72 28 Q 70 22 74 18" stroke="#1a1408" strokeWidth="1" fill="none"/>
      <path d="M 76 28 Q 76 22 80 18" stroke="#1a1408" strokeWidth="1" fill="none"/>
      <circle cx="74" cy="18" r="1" fill="#1a1408"/>
      <circle cx="80" cy="18" r="1" fill="#1a1408"/>
      {/* Жало */}
      <path d="M 30 35 L 22 33 L 22 37 Z" fill="#1a1408"/>
      {/* Крылья — полупрозрачные с трепетом */}
      <g className="bee-wing-group">
        <ellipse cx="42" cy="18" rx="11" ry="6" fill="rgba(255,255,255,0.6)"
                 stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"/>
        <ellipse cx="58" cy="18" rx="11" ry="6" fill="rgba(255,255,255,0.6)"
                 stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"/>
        {/* Прожилки на крыльях */}
        <path d="M 42 12 L 42 24 M 36 18 L 48 18" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
        <path d="M 58 12 L 58 24 M 52 18 L 64 18" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
      </g>
      {/* Лапки */}
      <path d="M 40 48 L 38 52 M 50 48 L 50 53 M 60 48 L 62 52"
            stroke="#1a1408" strokeWidth="1" fill="none"/>
    </svg>
  );
}
