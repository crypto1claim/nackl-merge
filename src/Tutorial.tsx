// ============================================================
// Туториал — 4 шага.
// Использует РЕАЛЬНЫЕ иконки монет через SVG <image href>.
// Анимация через SVG <animateTransform> для стабильности на Safari.
// ============================================================

import { useState, useEffect } from 'react';
import { t } from './i18n';
import { hapticSelection } from './telegram';
import { Sound } from './sound';

const STORAGE_KEY = 'acki_merge_tutorial_seen';

export function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* */ }
}

interface Props {
  onDone: () => void;
}

const STEPS = [
  { titleKey: 'tutorial.step1_title', textKey: 'tutorial.step1_text' },
  { titleKey: 'tutorial.step2_title', textKey: 'tutorial.step2_text' },
  { titleKey: 'tutorial.step3_title', textKey: 'tutorial.step3_text' },
  { titleKey: 'tutorial.step4_title', textKey: 'tutorial.step4_text' },
  { titleKey: 'tutorial.step5_title', textKey: 'tutorial.step5_text' },
] as const;

export default function Tutorial({ onDone }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => { markSeen(); }, []);

  const handleNext = () => {
    Sound.click();
    hapticSelection();
    if (step < STEPS.length - 1) setStep(step + 1);
    else onDone();
  };

  const handleSkip = () => { Sound.click(); onDone(); };
  const current = STEPS[step];

  return (
    <div className="tutorial-backdrop">
      <button className="tutorial-skip" onClick={handleSkip}>
        {t('tutorial.skip')}
      </button>

      <div className="tutorial-stage">
        {step === 0 && <Step1Scene />}
        {step === 1 && <Step2Scene />}
        {step === 2 && <Step3Scene />}
        {step === 3 && <Step4Scene />}
        {step === 4 && <Step5Scene />}
      </div>

      <div className="tutorial-card">
        <div className="tutorial-step-badge">{step + 1} / {STEPS.length}</div>
        <div className="tutorial-title">{t(current.titleKey as any)}</div>
        <div className="tutorial-text">{t(current.textKey as any)}</div>

        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`tutorial-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <button className="btn-primary tutorial-next" onClick={handleNext}>
          {step < STEPS.length - 1 ? t('tutorial.next') : t('tutorial.start')}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Helper: рисует SVG <image> монеты, центрированной по (x, y)
// ============================================================
const COIN_FILES: Record<string, string> = {
  matic: 'matic.svg', usdt: 'usdt.svg', xrp: 'xrp.svg', ton: 'ton.svg',
  ada: 'ada.svg', sol: 'sol.svg', bnb: 'bnb.svg', usdc: 'usdc.svg',
  eth: 'eth.svg', btc: 'btc.svg', avax: 'avax.svg', link: 'link.svg',
  ltc: 'ltc.svg', trx: 'trx.svg', xlm: 'xlm.svg', nackl: 'nackl.png',
};

function CoinIcon({ ticker, x, y, size }: { ticker: string; x: number; y: number; size: number }) {
  const file = COIN_FILES[ticker];
  if (!file) return null;
  return (
    <image
      href={`coins/${file}`}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
    />
  );
}

// ============================================================
// Банка — общий фон для всех сцен
// viewBox 320×360, банка занимает 50..280 по X, 60..335 по Y
// ============================================================
function JarBackground() {
  return (
    <>
      <defs>
        <linearGradient id="jar-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,200,230,0.05)"/>
          <stop offset="100%" stopColor="rgba(120,140,180,0.18)"/>
        </linearGradient>
        <radialGradient id="jar-glow" cx="50%" cy="55%">
          <stop offset="0%" stopColor="rgba(255,180,80,0.20)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Тёплое свечение */}
      <ellipse cx="160" cy="220" rx="130" ry="100" fill="url(#jar-glow)"/>
      {/* Корпус */}
      <path d="M 50 90 L 50 320 Q 50 335 65 335 L 255 335 Q 270 335 270 320 L 270 90"
            fill="url(#jar-glass)"
            stroke="rgba(200,220,255,0.40)"
            strokeWidth="3"
            strokeLinejoin="round"/>
      {/* Горлышко */}
      <path d="M 70 90 L 70 70 Q 70 60 80 60 L 240 60 Q 250 60 250 70 L 250 90"
            fill="none"
            stroke="rgba(200,220,255,0.40)"
            strokeWidth="3"/>
      {/* Блик */}
      <line x1="65" y1="110" x2="65" y2="300"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="3"
            strokeLinecap="round"/>
      {/* Дно — эллипс */}
      <ellipse cx="160" cy="335" rx="105" ry="6" fill="rgba(255,180,80,0.18)"/>
    </>
  );
}

// ============================================================
// ШАГ 1: палец движет MATIC влево-вправо вверху банки.
// Анимация через SVG <animateTransform> на родительской группе.
// ============================================================
function Step1Scene() {
  return (
    <svg viewBox="0 0 320 360" className="tutorial-jar-svg">
      <JarBackground/>

      {/* Направляющая */}
      <line x1="90" y1="115" x2="230" y2="115"
            stroke="rgba(255,180,80,0.25)"
            strokeWidth="1"
            strokeDasharray="4 4"/>

      {/* Монета MATIC + рука. Обе в одной группе, движутся синхронно. */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="-55,0; 55,0; -55,0"
          dur="3s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
        />
        {/* Монета */}
        <CoinIcon ticker="matic" x={160} y={115} size={44} />
        {/* Палец указатель, направленный вверх — под монетой */}
        <g transform="translate(160 175)">
          <path d="M -10 0 L -10 -28 Q -10 -36 -2 -36 Q 6 -36 6 -28 L 6 -10 L 14 -10 L 14 -4 L 20 -4 L 20 4 L 24 4 L 24 20 Q 24 30 14 30 L -10 30 Q -18 30 -18 20 L -18 4 L -10 4 Z"
                fill="#ffd1a0"
                stroke="#8a5a2a"
                strokeWidth="1.5"
                strokeLinejoin="round"/>
          <ellipse cx="-2" cy="-32" rx="3.5" ry="2.5" fill="#fff" opacity="0.5"/>
        </g>
      </g>

      {/* Контекстные монеты в банке */}
      <CoinIcon ticker="ton" x={100} y={305} size={30} />
      <CoinIcon ticker="usdt" x={140} y={310} size={28} />
      <CoinIcon ticker="btc" x={185} y={305} size={32} />
      <CoinIcon ticker="eth" x={225} y={310} size={26} />
    </svg>
  );
}

// ============================================================
// ШАГ 2: MATIC падает с верха банки до дна с физикой.
// ============================================================
function Step2Scene() {
  return (
    <svg viewBox="0 0 320 360" className="tutorial-jar-svg">
      <JarBackground/>

      {/* Падающая монета */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,180; 0,180; 0,180"
          keyTimes="0; 0.65; 0.85; 1"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.8 1; 0 0 1 1; 0 0 1 1"
        />
        {/* Подскок при ударе */}
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1,1; 1,1; 1.15,0.85; 0.95,1.05; 1,1; 1,1"
            keyTimes="0; 0.65; 0.7; 0.78; 0.86; 1"
            dur="2.2s"
            repeatCount="indefinite"
            additive="sum"
          />
          <CoinIcon ticker="matic" x={160} y={115} size={44} />
        </g>
      </g>

      {/* След падения */}
      <line x1="160" y1="115" x2="160" y2="290"
            stroke="rgba(255,180,80,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.6">
        <animate attributeName="opacity" values="0; 0; 0.6; 0" keyTimes="0; 0.5; 0.65; 1" dur="2.2s" repeatCount="indefinite"/>
      </line>

      {/* Импакт-эллипс */}
      <ellipse cx="160" cy="305" rx="48" ry="7" fill="rgba(255,180,80,0.5)" opacity="0">
        <animate attributeName="opacity" values="0; 0; 0.9; 0.4; 0" keyTimes="0; 0.65; 0.7; 0.85; 1" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="20; 20; 60; 70; 70" keyTimes="0; 0.65; 0.78; 0.9; 1" dur="2.2s" repeatCount="indefinite"/>
      </ellipse>

      {/* Контекстные монеты на дне */}
      <CoinIcon ticker="ton" x={95} y={308} size={28} />
      <CoinIcon ticker="usdt" x={130} y={312} size={26} />
      <CoinIcon ticker="btc" x={195} y={308} size={30} />
      <CoinIcon ticker="eth" x={230} y={312} size={26} />
    </svg>
  );
}

// ============================================================
// ШАГ 3: TON + TON → ADA (две сходятся в одну большую).
// ============================================================
function Step3Scene() {
  return (
    <svg viewBox="0 0 320 360" className="tutorial-jar-svg">
      <JarBackground/>

      {/* Левая TON сходится вправо */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 55,0; 0,0; 0,0"
          keyTimes="0; 0.4; 0.85; 1"
          dur="3.2s"
          repeatCount="indefinite"
        />
        <g>
          <animate attributeName="opacity" values="1; 1; 0; 0; 1" keyTimes="0; 0.35; 0.45; 0.85; 1" dur="3.2s" repeatCount="indefinite"/>
          <CoinIcon ticker="ton" x={105} y={200} size={50} />
        </g>
      </g>

      {/* Правая TON сходится влево */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -55,0; 0,0; 0,0"
          keyTimes="0; 0.4; 0.85; 1"
          dur="3.2s"
          repeatCount="indefinite"
        />
        <g>
          <animate attributeName="opacity" values="1; 1; 0; 0; 1" keyTimes="0; 0.35; 0.45; 0.85; 1" dur="3.2s" repeatCount="indefinite"/>
          <CoinIcon ticker="ton" x={215} y={200} size={50} />
        </g>
      </g>

      {/* Результат — ADA. Появляется из ноля, растёт, держится, уходит */}
      <g transform="translate(160 200)">
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0; 0; 1.25; 1; 1; 0"
            keyTimes="0; 0.4; 0.5; 0.6; 0.85; 1"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0; 0; 1; 1; 0" keyTimes="0; 0.4; 0.5; 0.85; 1" dur="3.2s" repeatCount="indefinite"/>
          <CoinIcon ticker="ada" x={0} y={0} size={70} />
        </g>
      </g>

      {/* Искры — появляются в момент слияния */}
      <g opacity="0">
        <animate attributeName="opacity" values="0; 0; 1; 0; 0" keyTimes="0; 0.42; 0.5; 0.65; 1" dur="3.2s" repeatCount="indefinite"/>
        <circle cx="160" cy="160" r="3" fill="#ffd84d"/>
        <circle cx="200" cy="175" r="2.5" fill="#ffd84d"/>
        <circle cx="120" cy="175" r="2.5" fill="#ffd84d"/>
        <circle cx="160" cy="245" r="3" fill="#ffd84d"/>
        <circle cx="200" cy="230" r="2.5" fill="#ffd84d"/>
        <circle cx="120" cy="230" r="2.5" fill="#ffd84d"/>
        <circle cx="175" cy="155" r="2" fill="#fff"/>
        <circle cx="145" cy="155" r="2" fill="#fff"/>
      </g>

      {/* +3 MRG popup */}
      <text x="160" y="275" textAnchor="middle" fill="#ffd84d"
            fontSize="16" fontWeight="800" letterSpacing="0.05em"
            fontFamily="Fredoka, sans-serif"
            opacity="0">
        <animate attributeName="opacity" values="0; 0; 1; 0; 0" keyTimes="0; 0.5; 0.6; 0.85; 1" dur="3.2s" repeatCount="indefinite"/>
        <animate attributeName="y" values="285; 285; 270; 260; 260" keyTimes="0; 0.5; 0.6; 0.85; 1" dur="3.2s" repeatCount="indefinite"/>
        +3 MRG
      </text>

      {/* Контекстные монеты на дне */}
      <CoinIcon ticker="btc" x={95} y={308} size={28} />
      <CoinIcon ticker="usdt" x={135} y={312} size={26} />
      <CoinIcon ticker="eth" x={185} y={310} size={28} />
      <CoinIcon ticker="sol" x={225} y={312} size={26} />
    </svg>
  );
}

// ============================================================
// ШАГ 4: SHAKE DAMAGE — чистая презентация
// Структура:
//   - Вверху: панель с кнопкой-молнией + "или" + телефон трясётся
//   - Внутри банки: монеты + молния по центру + ударная волна
//   - Внизу под банкой: 3 точки-индикатора (мини-HUD)
// ============================================================
function Step4Scene() {
  return (
    <svg viewBox="0 0 320 380" className="tutorial-jar-svg">
      <defs>
        <linearGradient id="step4-bolt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8d0"/>
          <stop offset="40%" stopColor="#ffd040"/>
          <stop offset="100%" stopColor="#ff7020"/>
        </linearGradient>
        <filter id="step4-bolt-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="step4-dot-active" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffe060"/>
          <stop offset="60%" stopColor="#ff8830"/>
          <stop offset="100%" stopColor="#ff4020"/>
        </radialGradient>
      </defs>

      {/* === ВЕРХ: панель методов активации === */}
      {/* Фон-плашка под методами */}
      <rect x="50" y="20" width="220" height="64" rx="14"
            fill="rgba(255, 170, 64, 0.10)"
            stroke="rgba(255, 170, 64, 0.35)"
            strokeWidth="1.5"/>

      {/* Метка "Активация:" */}
      <text x="160" y="38" textAnchor="middle"
            fontSize="9" fontWeight="700"
            fill="#ffaa40"
            letterSpacing="0.15em"
            fontFamily="Fredoka, sans-serif">
        АКТИВАЦИЯ
      </text>

      {/* Левая часть: кнопка-молния (как в HUD) */}
      <g transform="translate(105 65)">
        {/* Пульсирующее кольцо вокруг */}
        <circle r="20" fill="none" stroke="#ffaa40" strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="18; 28" dur="1.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7; 0" dur="1.4s" repeatCount="indefinite"/>
        </circle>
        {/* Основа кнопки */}
        <circle r="18" fill="rgba(40, 20, 10, 0.7)" stroke="#ffaa40" strokeWidth="2"/>
        {/* Молния внутри */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-6; 6; -6"
            dur="0.5s"
            repeatCount="indefinite"
          />
          <path d="M 4 -10 L -5 2 L 1 2 L -3 10 L 5 -2 L -1 -2 L 4 -10 Z"
                fill="url(#step4-bolt-grad)"
                stroke="#a04010"
                strokeWidth="0.5"/>
        </g>
      </g>

      {/* Текст "ИЛИ" по центру */}
      <text x="160" y="70" textAnchor="middle"
            fontSize="14" fontWeight="800"
            fill="#ffaa40"
            fontFamily="Fredoka, sans-serif">
        ИЛИ
      </text>

      {/* Правая часть: телефон трясётся */}
      <g transform="translate(215 65)">
        {/* Эффект тряски — линии движения */}
        <g opacity="0.6">
          <path d="M -22 -8 L -27 -8" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M -22 0 L -29 0" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M -22 8 L -27 8" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 22 -8 L 27 -8" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 22 0 L 29 0" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 22 8 L 27 8" stroke="#ffaa40" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
        {/* Телефон — анимация наклона */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-12; 12; -12"
            dur="0.35s"
            repeatCount="indefinite"
          />
          {/* Корпус телефона */}
          <rect x="-9" y="-15" width="18" height="30" rx="3"
                fill="rgba(40, 20, 10, 0.85)"
                stroke="#ffaa40"
                strokeWidth="1.5"/>
          {/* Экран */}
          <rect x="-7" y="-12" width="14" height="22" rx="1"
                fill="rgba(255, 170, 64, 0.18)"/>
          {/* Кнопка home */}
          <circle cx="0" cy="12" r="1.2" fill="#ffaa40"/>
        </g>
      </g>

      {/* === БАНКА со взрывом === */}
      <g transform="translate(0 20)">
        {/* Корпус банки */}
        <path d="M 70 110 L 70 320 Q 70 332 82 332 L 238 332 Q 250 332 250 320 L 250 110"
              fill="url(#jar-glass)"
              stroke="rgba(200,220,255,0.40)"
              strokeWidth="2.5"
              strokeLinejoin="round"/>
        {/* Горлышко */}
        <path d="M 86 110 L 86 95 Q 86 87 94 87 L 226 87 Q 234 87 234 95 L 234 110"
              fill="none"
              stroke="rgba(200,220,255,0.40)"
              strokeWidth="2.5"/>
        {/* Блик */}
        <line x1="82" y1="125" x2="82" y2="300"
              stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Дно */}
        <ellipse cx="160" cy="332" rx="85" ry="5" fill="rgba(255,180,80,0.18)"/>

        {/* Тёплое свечение внутри */}
        <ellipse cx="160" cy="230" rx="90" ry="80" fill="url(#jar-glow)"/>

        {/* Монеты в банке — лёгкая тряска */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-1.2,-0.8; 1.2,-0.8; 1.2,0.8; -1.2,0.8; -1.2,-0.8"
            dur="0.2s"
            repeatCount="indefinite"
          />
          {/* Ряд 1 */}
          <CoinIcon ticker="matic" x={105} y={155} size={26} />
          <CoinIcon ticker="usdt" x={140} y={150} size={28} />
          <CoinIcon ticker="ton" x={180} y={155} size={26} />
          <CoinIcon ticker="ada" x={215} y={160} size={22} />
          {/* Ряд 2 — пропускаем центр (там молния) */}
          <CoinIcon ticker="sol" x={100} y={195} size={28} />
          <CoinIcon ticker="bnb" x={220} y={200} size={30} />
          {/* Ряд 3 — пропускаем центр */}
          <CoinIcon ticker="usdc" x={100} y={245} size={26} />
          <CoinIcon ticker="eth" x={225} y={250} size={22} />
          {/* Ряд 4 - дно */}
          <CoinIcon ticker="xrp" x={100} y={290} size={24} />
          <CoinIcon ticker="btc" x={140} y={295} size={26} />
          <CoinIcon ticker="ltc" x={180} y={295} size={22} />
          <CoinIcon ticker="link" x={220} y={290} size={24} />
        </g>

        {/* Ударная волна — 3 расходящихся кольца от центра */}
        <g transform="translate(160 225)">
          <circle r="20" fill="none" stroke="#ffaa40" strokeWidth="2.5" opacity="0">
            <animate attributeName="r" values="15; 95" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85; 0" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle r="20" fill="none" stroke="#ff7020" strokeWidth="2" opacity="0">
            <animate attributeName="r" values="15; 95" dur="1.8s" begin="0.4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85; 0" dur="1.8s" begin="0.4s" repeatCount="indefinite"/>
          </circle>
          <circle r="20" fill="none" stroke="#ff4020" strokeWidth="1.8" opacity="0">
            <animate attributeName="r" values="15; 95" dur="1.8s" begin="0.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85; 0" dur="1.8s" begin="0.8s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Большая симметричная МОЛНИЯ по центру банки */}
        <g transform="translate(160 225)">
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1.12; 1"
            dur="1.2s"
            repeatCount="indefinite"
            additive="sum"
          />
          {/* Классический зигзаг-болт: симметричный, чистый */}
          <path
            d="M 6 -52
               L -14 -8
               L -2 -8
               L -10 38
               L 14 -2
               L 2 -2
               L 10 -52 Z"
            fill="url(#step4-bolt-grad)"
            stroke="#a04010"
            strokeWidth="2"
            strokeLinejoin="round"
            filter="url(#step4-bolt-glow)"
          />
        </g>
      </g>
    </svg>
  );
}

// ============================================================
// ШАГ 5: БУСТЕРЫ — 3 круглые кнопки с иконками + бейджи количества
// ============================================================
function Step5Scene() {
  return (
    <svg viewBox="0 0 320 360" className="tutorial-jar-svg">
      <defs>
        <linearGradient id="s5-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8d0"/>
          <stop offset="50%" stopColor="#ffd040"/>
          <stop offset="100%" stopColor="#ff7020"/>
        </linearGradient>
      </defs>

      {/* Фоновое свечение */}
      <ellipse cx="160" cy="180" rx="140" ry="110" fill="rgba(255, 180, 80, 0.10)"/>

      {/* Заголовок */}
      <text x="160" y="50" textAnchor="middle"
            fontSize="10" fontWeight="700"
            fill="#ffaa40"
            letterSpacing="0.2em"
            fontFamily="Fredoka, sans-serif">
        БУСТЕРЫ В HUD
      </text>

      {/* 3 бустерные кнопки. Каждая: круг + иконка + бейдж количества. */}
      {/* === 1) Убрать монету (красный) === */}
      <g transform="translate(80 130)">
        <g>
          <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="1.6s" repeatCount="indefinite" additive="sum"/>
          <circle r="34" fill="rgba(15, 12, 30, 0.85)" stroke="#ff8080" strokeWidth="2.5"/>
          {/* Корзина SVG */}
          <g transform="translate(-12 -12)">
            <path
              d="M 2 4 h20 M 7 4 V 2 a 2 2 0 0 1 2 -2 h6 a 2 2 0 0 1 2 2 v2 M 4 4 l 1 16 a 2 2 0 0 0 2 2 h10 a 2 2 0 0 0 2 -2 l 1 -16"
              stroke="#ff8080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
          </g>
        </g>
        {/* Бейдж с цифрой 3 */}
        <circle cx="22" cy="-22" r="11" fill="#ffd84d" stroke="#0a0814" strokeWidth="2.5"/>
        <text x="22" y="-18" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000" fontFamily="Fredoka, sans-serif">3</text>
      </g>

      {/* === 2) Буст +1 уровень (бирюзовый) === */}
      <g transform="translate(160 130)">
        <g>
          <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="1.6s" begin="0.5s" repeatCount="indefinite" additive="sum"/>
          <circle r="34" fill="rgba(15, 12, 30, 0.85)" stroke="#6affe0" strokeWidth="2.5"/>
          {/* Стрелка вверх */}
          <path d="M 0 -14 L 0 14 M -10 -4 L 0 -14 L 10 -4"
                stroke="#6affe0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
        <circle cx="22" cy="-22" r="11" fill="#ffd84d" stroke="#0a0814" strokeWidth="2.5"/>
        <text x="22" y="-18" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000" fontFamily="Fredoka, sans-serif">3</text>
      </g>

      {/* === 3) +1 заряд Shake (жёлтый) === */}
      <g transform="translate(240 130)">
        <g>
          <animateTransform attributeName="transform" type="scale" values="1;1.08;1" dur="1.6s" begin="1s" repeatCount="indefinite" additive="sum"/>
          <circle r="34" fill="rgba(15, 12, 30, 0.85)" stroke="#ffd84d" strokeWidth="2.5"/>
          {/* Молния */}
          <path d="M 4 -14 L -8 4 L -1 4 L -5 14 L 8 -2 L 2 -2 L 4 -14 Z"
                fill="url(#s5-bolt)" stroke="#a04010" strokeWidth="1"/>
        </g>
        <circle cx="22" cy="-22" r="11" fill="#ffd84d" stroke="#0a0814" strokeWidth="2.5"/>
        <text x="22" y="-18" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000" fontFamily="Fredoka, sans-serif">3</text>
      </g>

      {/* Подписи под каждой */}
      <text x="80" y="200" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">Убрать</text>
      <text x="80" y="214" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">монету</text>

      <text x="160" y="200" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">Буст</text>
      <text x="160" y="214" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">+1 уровень</text>

      <text x="240" y="200" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">+1 заряд</text>
      <text x="240" y="214" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ddd" fontFamily="Fredoka, sans-serif">Shake</text>

      {/* Цены */}
      <text x="80" y="240" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6affe0" fontFamily="Fredoka, sans-serif">200 MRG</text>
      <text x="160" y="240" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6affe0" fontFamily="Fredoka, sans-serif">500 MRG</text>
      <text x="240" y="240" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6affe0" fontFamily="Fredoka, sans-serif">1000 MRG</text>

      {/* Подсказка внизу */}
      <rect x="40" y="280" width="240" height="48" rx="12"
            fill="rgba(255, 170, 64, 0.10)" stroke="rgba(255, 170, 64, 0.3)" strokeWidth="1.5"/>
      <text x="160" y="303" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffaa40" fontFamily="Fredoka, sans-serif">
        Лимит — 3 применения
      </text>
      <text x="160" y="318" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffaa40" fontFamily="Fredoka, sans-serif">
        каждого бустера за партию
      </text>
    </svg>
  );
}
