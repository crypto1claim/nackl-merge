// ============================================================
// 7 тем оформления. Каждая определяет:
//   - CSS-переменные (цвета фона/панелей/акцентов)
//   - Параметры canvas-фона (внутренний/внешний цвет, свечение)
//   - Декоративный элемент (тип паттерна для меню и канваса)
//
// Темы:
//   pastel      — бесплатная, спокойная (мятный/розовый)
//   acki_nacki  — фирменная (фиолет/золото + NACKL на фоне)
//   exchange    — биржевая (графики красно-зелёные)
//   pizza       — пицца на фоне (тёплый красно-оранжевый)
//   terminal    — Matrix CRT (чёрно-зелёный)
//   cyberpunk   — TRON-неон (розово-голубой)
//   bitcoin     — флагман (золото на чёрном, ₿ символы)
// ============================================================

export type ThemeId =
  | 'pastel'
  | 'exchange'
  | 'ocean'
  | 'pizza'
  | 'china'
  | 'halloween'
  | 'christmas'
  | 'terminal'
  | 'cyberpunk'
  | 'bee_engine'
  | 'bitcoin'
  | 'acki_nacki';

// Тип декоративного паттерна — определяет, что рисуется на фоне
export type DecorType =
  | 'bubbles'      // пастельные пузырьки
  | 'nackl_smiles' // парящие NACKL смайлы
  | 'candles'      // свечной график
  | 'pizza_slices' // кусочки пиццы
  | 'matrix_rain'  // падающий зелёный код
  | 'cyber_city'   // силуэт ночного города
  | 'btc_symbols'  // полупрозрачные ₿
  | 'ocean_jelly'  // медузы и пузыри в океане
  | 'china_lanterns'// фонарики и драконы
  | 'halloween'    // тыквы и летучие мыши
  | 'christmas'    // снежинки и звёзды
  | 'bee_hive';    // соты и пчёлы

export interface Theme {
  id: ThemeId;
  nameKey: string;
  decor: DecorType;
  bg: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  accent: string;
  accentSecondary: string;
  ctaGradient: string;
  hudWallet: string;
  // Canvas-параметры
  canvasBgInner: string;
  canvasBgOuter: string;
  canvasGlow: string;
  canvasWall: string;
  swatch: [string, string, string];
}

export const THEMES: Record<ThemeId, Theme> = {
  // ----- ПАСТЕЛЬ — бесплатная стартовая, тёмный dusk с мятным акцентом -----
  pastel: {
    id: 'pastel', nameKey: 'theme.pastel', decor: 'bubbles',
    bg: 'radial-gradient(ellipse at 25% 0%, rgba(140, 110, 220, 0.32) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(120, 230, 200, 0.22) 0%, transparent 55%), linear-gradient(180deg, #1a1530 0%, #221a3a 100%)',
    panelBg: 'rgba(34, 26, 58, 0.94)',
    panelBorder: 'rgba(160, 130, 230, 0.35)',
    textPrimary: '#f0e8ff',
    textSecondary: '#c8b8e8',
    textHint: '#7c6db0',
    accent: '#a685ff',           // лавандовый
    accentSecondary: '#78ebc0',  // мятный
    ctaGradient: 'linear-gradient(135deg, #a685ff 0%, #78ebc0 100%)',
    hudWallet: 'rgba(166, 133, 255, 0.16)',
    canvasBgInner: '#1f1738',
    canvasBgOuter: '#0d0820',
    canvasGlow: 'rgba(166, 133, 255, 0.30)',
    canvasWall: 'rgba(120, 235, 192, 0.32)',
    swatch: ['#a685ff', '#78ebc0', '#1a1530'],
  },

  // ----- БИРЖА — графики красно-зелёные, золото-чёрный фон -----
  exchange: {
    id: 'exchange', nameKey: 'theme.exchange', decor: 'candles',
    bg: 'radial-gradient(ellipse at 30% 0%, rgba(0, 200, 100, 0.10) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(220, 50, 50, 0.10) 0%, transparent 50%), linear-gradient(180deg, #0a0f17 0%, #131a26 100%)',
    panelBg: 'rgba(15, 22, 35, 0.96)',
    panelBorder: 'rgba(240, 185, 11, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#a8b8d0',
    textHint: '#6878a0',
    accent: '#f0b90b',
    accentSecondary: '#22c55e',
    ctaGradient: 'linear-gradient(135deg, #f0b90b 0%, #ff8c00 100%)',
    hudWallet: 'rgba(240, 185, 11, 0.12)',
    canvasBgInner: '#10172a',
    canvasBgOuter: '#06090f',
    canvasGlow: 'rgba(240, 185, 11, 0.12)',
    canvasWall: 'rgba(240, 185, 11, 0.3)',
    swatch: ['#22c55e', '#ef4444', '#f0b90b'],
  },

  // ----- ОКЕАН — глубокий синий с биолюминесценцией -----
  ocean: {
    id: 'ocean', nameKey: 'theme.ocean', decor: 'ocean_jelly',
    bg: 'radial-gradient(ellipse at 30% 0%, rgba(64, 220, 255, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(120, 80, 255, 0.22) 0%, transparent 55%), linear-gradient(180deg, #001428 0%, #002850 100%)',
    panelBg: 'rgba(0, 30, 60, 0.95)',
    panelBorder: 'rgba(64, 220, 255, 0.4)',
    textPrimary: '#e0f4ff',
    textSecondary: '#90d0e8',
    textHint: '#508098',
    accent: '#40dcff',           // светящаяся бирюза
    accentSecondary: '#a0ffe8',  // светло-мятный (биолюминесценция)
    ctaGradient: 'linear-gradient(135deg, #40dcff 0%, #2080d0 100%)',
    hudWallet: 'rgba(64, 220, 255, 0.16)',
    canvasBgInner: '#002850',
    canvasBgOuter: '#000a18',
    canvasGlow: 'rgba(64, 220, 255, 0.25)',
    canvasWall: 'rgba(160, 255, 232, 0.35)',
    swatch: ['#40dcff', '#a0ffe8', '#001428'],
  },

  // ----- ПИЦЦА — тёплый томатно-сырный, кусочки на фоне -----
  pizza: {
    id: 'pizza', nameKey: 'theme.pizza', decor: 'pizza_slices',
    bg: 'radial-gradient(ellipse at 30% 0%, rgba(255, 140, 50, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(220, 80, 50, 0.22) 0%, transparent 50%), linear-gradient(180deg, #2a0e08 0%, #4a1a0c 100%)',
    panelBg: 'rgba(50, 20, 12, 0.96)',
    panelBorder: 'rgba(255, 140, 50, 0.45)',
    textPrimary: '#fff2d0',
    textSecondary: '#ffb888',
    textHint: '#a86850',
    accent: '#ff6b35',
    accentSecondary: '#ffd84d',
    ctaGradient: 'linear-gradient(135deg, #ff6b35 0%, #c0392b 100%)',
    hudWallet: 'rgba(255, 107, 53, 0.18)',
    canvasBgInner: '#3a1810',
    canvasBgOuter: '#1a0808',
    canvasGlow: 'rgba(255, 140, 50, 0.25)',
    canvasWall: 'rgba(255, 140, 50, 0.35)',
    swatch: ['#ff6b35', '#ffd84d', '#2a0e08'],
  },

  // ----- КИТАЙ — пурпурно-золотой, фонарики и драконы -----
  china: {
    id: 'china', nameKey: 'theme.china', decor: 'china_lanterns',
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(220, 50, 50, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(240, 180, 60, 0.20) 0%, transparent 55%), linear-gradient(180deg, #2a0a0a 0%, #1a0608 100%)',
    panelBg: 'rgba(60, 12, 12, 0.95)',
    panelBorder: 'rgba(255, 100, 80, 0.45)',
    textPrimary: '#ffeed0',
    textSecondary: '#f0c890',
    textHint: '#a06860',
    accent: '#d83838',           // ярко-красный
    accentSecondary: '#f0c040',  // золотой
    ctaGradient: 'linear-gradient(135deg, #d83838 0%, #f0c040 100%)',
    hudWallet: 'rgba(216, 56, 56, 0.20)',
    canvasBgInner: '#220808',
    canvasBgOuter: '#0a0202',
    canvasGlow: 'rgba(255, 120, 80, 0.25)',
    canvasWall: 'rgba(240, 192, 64, 0.35)',
    swatch: ['#d83838', '#f0c040', '#2a0a0a'],
  },

  // ----- ХЭЛЛОУИН — оранжево-фиолетовый, тыквы и летучие мыши -----
  halloween: {
    id: 'halloween', nameKey: 'theme.halloween', decor: 'halloween',
    bg: 'radial-gradient(ellipse at 25% 0%, rgba(255, 130, 40, 0.30) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(140, 60, 220, 0.28) 0%, transparent 55%), linear-gradient(180deg, #0a0312 0%, #1a0a25 100%)',
    panelBg: 'rgba(20, 8, 35, 0.96)',
    panelBorder: 'rgba(255, 130, 40, 0.45)',
    textPrimary: '#ffe8c8',
    textSecondary: '#e0a878',
    textHint: '#806050',
    accent: '#ff8228',           // тыквенный
    accentSecondary: '#a060e0',  // ведьмин фиолет
    ctaGradient: 'linear-gradient(135deg, #ff8228 0%, #a060e0 100%)',
    hudWallet: 'rgba(255, 130, 40, 0.20)',
    canvasBgInner: '#150825',
    canvasBgOuter: '#060210',
    canvasGlow: 'rgba(255, 130, 40, 0.25)',
    canvasWall: 'rgba(160, 96, 224, 0.38)',
    swatch: ['#ff8228', '#a060e0', '#0a0312'],
  },

  // ----- РОЖДЕСТВО — красно-зелёно-золотой, снежинки -----
  christmas: {
    id: 'christmas', nameKey: 'theme.christmas', decor: 'christmas',
    bg: 'radial-gradient(ellipse at 25% 0%, rgba(220, 50, 50, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(50, 160, 80, 0.22) 0%, transparent 55%), linear-gradient(180deg, #0d1410 0%, #15201a 100%)',
    panelBg: 'rgba(20, 30, 24, 0.96)',
    panelBorder: 'rgba(255, 215, 0, 0.4)',
    textPrimary: '#fff5e0',
    textSecondary: '#d8b888',
    textHint: '#806050',
    accent: '#e83838',           // рождественский красный
    accentSecondary: '#ffd700',  // золото
    ctaGradient: 'linear-gradient(135deg, #e83838 0%, #ffd700 50%, #50c050 100%)',
    hudWallet: 'rgba(232, 56, 56, 0.18)',
    canvasBgInner: '#152018',
    canvasBgOuter: '#080c08',
    canvasGlow: 'rgba(255, 215, 0, 0.20)',
    canvasWall: 'rgba(232, 56, 56, 0.32)',
    swatch: ['#e83838', '#50c050', '#ffd700'],
  },

  // ----- TERMINAL — хакерский Matrix CRT -----
  terminal: {
    id: 'terminal', nameKey: 'theme.terminal', decor: 'matrix_rain',
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(0, 255, 80, 0.12) 0%, transparent 60%), linear-gradient(180deg, #000400 0%, #000a02 100%)',
    panelBg: 'rgba(5, 18, 8, 0.97)',
    panelBorder: 'rgba(0, 255, 80, 0.4)',
    textPrimary: '#00ff80',
    textSecondary: '#80e0a0',
    textHint: '#408060',
    accent: '#00ff80',
    accentSecondary: '#80ff40',
    ctaGradient: 'linear-gradient(135deg, #00ff80 0%, #008040 100%)',
    hudWallet: 'rgba(0, 255, 80, 0.14)',
    canvasBgInner: '#001a08',
    canvasBgOuter: '#000400',
    canvasGlow: 'rgba(0, 255, 80, 0.2)',
    canvasWall: 'rgba(0, 255, 80, 0.4)',
    swatch: ['#00ff80', '#003a18', '#000400'],
  },

  // ----- CYBERPUNK — ярко-зелёный с фиолетовым (CP2077) -----
  cyberpunk: {
    id: 'cyberpunk', nameKey: 'theme.cyberpunk', decor: 'cyber_city',
    bg: 'radial-gradient(ellipse at 20% 0%, rgba(180, 50, 255, 0.30) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(190, 255, 50, 0.28) 0%, transparent 50%), linear-gradient(180deg, #0a0418 0%, #14082a 100%)',
    panelBg: 'rgba(16, 6, 32, 0.96)',
    panelBorder: 'rgba(190, 255, 50, 0.45)',
    textPrimary: '#ffffff',
    textSecondary: '#d0ffa0',
    textHint: '#7080a0',
    accent: '#beff32',          // ярко-зелёный (фирменный CP2077 yellow-green)
    accentSecondary: '#b432ff', // фиолетовый
    ctaGradient: 'linear-gradient(135deg, #beff32 0%, #b432ff 100%)',
    hudWallet: 'rgba(190, 255, 50, 0.16)',
    canvasBgInner: '#100620',
    canvasBgOuter: '#04000c',
    canvasGlow: 'rgba(190, 255, 50, 0.22)',
    canvasWall: 'rgba(180, 50, 255, 0.4)',
    swatch: ['#beff32', '#b432ff', '#0a0418'],
  },

  // ----- BEE ENGINE — пчелиная брендовая, жёлто-чёрная -----
  bee_engine: {
    id: 'bee_engine', nameKey: 'theme.bee_engine', decor: 'bee_hive',
    bg: 'radial-gradient(ellipse at 25% 0%, rgba(255, 200, 0, 0.30) 0%, transparent 55%), radial-gradient(ellipse at 75% 100%, rgba(255, 160, 0, 0.20) 0%, transparent 55%), linear-gradient(180deg, #14100a 0%, #1f1810 100%)',
    panelBg: 'rgba(28, 22, 12, 0.96)',
    panelBorder: 'rgba(255, 200, 0, 0.45)',
    textPrimary: '#fff5d0',
    textSecondary: '#e0c890',
    textHint: '#807050',
    accent: '#ffc800',           // пчелиный жёлтый
    accentSecondary: '#ff9800',  // оранжевая медь
    ctaGradient: 'linear-gradient(135deg, #ffd700 0%, #ff9800 100%)',
    hudWallet: 'rgba(255, 200, 0, 0.20)',
    canvasBgInner: '#1f1810',
    canvasBgOuter: '#0a0805',
    canvasGlow: 'rgba(255, 200, 0, 0.25)',
    canvasWall: 'rgba(255, 200, 0, 0.40)',
    swatch: ['#ffc800', '#ff9800', '#14100a'],
  },

  // ----- BITCOIN — премиум, золото на чёрном + ₿ -----
  bitcoin: {
    id: 'bitcoin', nameKey: 'theme.bitcoin', decor: 'btc_symbols',
    bg: 'radial-gradient(ellipse at 30% 0%, rgba(247, 147, 26, 0.30) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(255, 215, 0, 0.20) 0%, transparent 50%), linear-gradient(180deg, #0a0805 0%, #1a1208 100%)',
    panelBg: 'rgba(22, 16, 6, 0.97)',
    panelBorder: 'rgba(247, 147, 26, 0.5)',
    textPrimary: '#ffe8b8',
    textSecondary: '#ffcb70',
    textHint: '#a07840',
    accent: '#f7931a',
    accentSecondary: '#ffd700',
    ctaGradient: 'linear-gradient(135deg, #ffd700 0%, #f7931a 50%, #c06010 100%)',
    hudWallet: 'rgba(247, 147, 26, 0.18)',
    canvasBgInner: '#1a1208',
    canvasBgOuter: '#0a0604',
    canvasGlow: 'rgba(247, 147, 26, 0.28)',
    canvasWall: 'rgba(247, 147, 26, 0.45)',
    swatch: ['#ffd700', '#f7931a', '#0a0805'],
  },

  // ----- ACKI NACKI — ФЛАГМАН: фирменная, NACKL/SHELL на фоне -----
  acki_nacki: {
    id: 'acki_nacki', nameKey: 'theme.acki_nacki', decor: 'nackl_smiles',
    bg: 'radial-gradient(ellipse at 20% 0%, rgba(153,69,255,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(255,216,77,0.18) 0%, transparent 50%), linear-gradient(180deg, #0d0a1f 0%, #1a0d2e 100%)',
    panelBg: 'rgba(26,13,46,0.95)',
    panelBorder: 'rgba(153,69,255,0.4)',
    textPrimary: '#ffffff',
    textSecondary: '#d4c5ff',
    textHint: '#8a7fa8',
    accent: '#9945ff',
    accentSecondary: '#ffd84d',
    ctaGradient: 'linear-gradient(135deg, #ffd84d 0%, #ff8c42 100%)',
    hudWallet: 'rgba(153,69,255,0.18)',
    canvasBgInner: '#15102a',
    canvasBgOuter: '#0a0815',
    canvasGlow: 'rgba(153,69,255,0.25)',
    canvasWall: 'rgba(153,69,255,0.3)',
    swatch: ['#9945ff', '#ffd84d', '#0d0a1f'],
  },

};

const STORAGE_KEY = 'acki_merge_theme';

function detectInitial(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in THEMES) return saved as ThemeId;
  } catch { /* */ }
  return 'pastel';
}

let currentId: ThemeId = detectInitial();
const listeners = new Set<(t: Theme) => void>();

export function getTheme(): Theme { return THEMES[currentId]; }

export function setTheme(id: ThemeId): boolean {
  if (currentId === id) return true;
  currentId = id;
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* */ }
  applyTheme();
  listeners.forEach((cb) => cb(getTheme()));
  return true;
}

export function subscribeTheme(cb: (t: Theme) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function applyTheme() {
  const t = getTheme();
  const r = document.documentElement.style;
  r.setProperty('--bg', t.bg);
  r.setProperty('--panel-bg', t.panelBg);
  r.setProperty('--panel-border', t.panelBorder);
  r.setProperty('--text-primary', t.textPrimary);
  r.setProperty('--text-secondary', t.textSecondary);
  r.setProperty('--text-hint', t.textHint);
  r.setProperty('--accent', t.accent);
  r.setProperty('--accent-secondary', t.accentSecondary);
  r.setProperty('--cta-gradient', t.ctaGradient);
  r.setProperty('--hud-wallet', t.hudWallet);
  r.setProperty('--canvas-bg-inner', t.canvasBgInner);
  r.setProperty('--canvas-bg-outer', t.canvasBgOuter);
  r.setProperty('--canvas-glow', t.canvasGlow);
  r.setProperty('--canvas-wall', t.canvasWall);
  // Атрибут для CSS-селекторов декора (themes-pastel, theme-acki_nacki, ...)
  document.documentElement.setAttribute('data-theme', t.id);
}
