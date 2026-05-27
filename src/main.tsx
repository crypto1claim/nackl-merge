import './bootstrap'; // ДОЛЖЕН быть первым — делает одноразовый ресет до всех модулей
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { tg } from './telegram';

// ============================================================
// Telegram Mini App инициализация
// ============================================================
// Без tg.ready() Telegram не знает что Mini App загрузился,
// поэтому HapticFeedback может игнорироваться, и SDK не активирует
// продвинутые фичи (fullscreen, viewportHeight, и т.д.).
if (tg) {
  // Сообщаем Telegram что приложение загрузилось и готово.
  // Это активирует HapticFeedback и другие нативные API.
  tg.ready();
  // Раскрываем Mini App на весь доступный экран
  tg.expand();
  // Отключаем вертикальные свайпы — иначе Telegram может перехватывать
  // свайп вниз и сворачивать приложение во время игры
  tg.disableVerticalSwipes?.();
}

// Глобальный ripple: при каждом нажатии на кнопку записываем координаты
// клика в CSS-переменные на этой кнопке. CSS-псевдоэлемент ::after
// использует их для радиального градиента из точки касания.
document.addEventListener('pointerdown', (e) => {
  const target = e.target as HTMLElement | null;
  const btn = target?.closest('button');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  btn.style.setProperty('--ripple-x', `${x}%`);
  btn.style.setProperty('--ripple-y', `${y}%`);
}, { passive: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
