import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  const webPort = parseInt(env.WEB_PORT || '5173', 10);
  const apiPort = parseInt(env.API_PORT || '3000', 10);

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ['monaco-vim'],
    },
    server: {
      host: true,
      port: webPort,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
