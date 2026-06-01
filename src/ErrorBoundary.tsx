// ============================================================
// ErrorBoundary — последний рубеж стабильности.
//
// Если любой компонент падает при рендере, без этого обёртки React
// размонтирует всё дерево → белый экран без выхода. На 100k устройств
// (разные OS/версии/сети) единичные краши неизбежны — здесь мы их ловим
// и показываем понятный экран с кнопкой перезагрузки вместо пустоты.
//
// Важно: фоллбэк НЕ зависит от styles.css, i18n, тем и прочих модулей
// игры (они могли и стать причиной краша) — всё на inline-стилях и
// двуязычном тексте.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Лог в консоль (видно в attached-консоли / будущей телеметрии).
    // Намеренно не используем сторонние модули — они могли и упасть.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  private handleReload = () => {
    try { window.location.reload(); } catch { /* */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 24, textAlign: 'center',
        background: 'linear-gradient(180deg, #0d0a1f 0%, #1a0d2e 100%)',
        color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 99999,
      }}>
        <div style={{ fontSize: 48, lineHeight: 1 }}>🛠️</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Что-то пошло не так
        </div>
        <div style={{ fontSize: 14, opacity: 0.7, maxWidth: 320 }}>
          Произошёл сбой. Перезапусти игру — прогресс сохранён.
          <br />
          Something went wrong. Please reload — your progress is saved.
        </div>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: 8, padding: '12px 28px',
            fontSize: 16, fontWeight: 700, color: '#fff',
            border: 'none', borderRadius: 14, cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c5cff 0%, #4ade80 100%)',
          }}
        >
          Перезагрузить / Reload
        </button>
      </div>
    );
  }
}
