import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  const webPort = parseInt(env.WEB_PORT || '', 10);
  if (isNaN(webPort)) {
    throw new Error('Missing required environment variable: WEB_PORT');
  }

  const apiPort = parseInt(env.API_PORT || '', 10);
  if (isNaN(apiPort)) {
    throw new Error('Missing required environment variable: API_PORT');
  }

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
