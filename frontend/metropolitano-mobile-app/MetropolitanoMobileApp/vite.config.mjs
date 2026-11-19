import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  if (process.env.VERCEL === '1') {
    for (const name of ['VITE_API_URL', 'VITE_AI_URL']) {
      if (!env[name]?.startsWith('https://')) {
        throw new Error(`Configura ${name} con la URL HTTPS de la API en Vercel`);
      }
    }
  }
  return {
    plugins: [react({ babel: { babelrc: false, configFile: false } })],
    define: {
      __METROPOLITANO_API_URL__: JSON.stringify(
        env.VITE_API_URL || '/api/v1/demo',
      ),
      __METROPOLITANO_AI_URL__: JSON.stringify(
        env.VITE_AI_URL || '/ai',
      ),
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:8080',
        '/ai': {
          target: 'http://localhost:8001',
          rewrite: path => path.replace(/^\/ai/, ''),
        },
      },
    },
    build: { outDir: 'build/web' },
  };
});
