import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['@teamgosh/bee-sdk'] },
  assetsInclude: ['**/*.wasm'],
  // Относительные пути нужны, чтобы мини-апп нормально работал с любого хостинга
  base: './',
  server: {
    host: true, // чтобы можно было открыть с телефона по IP в локальной сети
  },
});
