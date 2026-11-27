import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const origins = new Set(["'self'"]);
  const isVercel = process.env.VERCEL === '1';
  for (const name of ['VITE_API_URL', 'VITE_AI_URL']) {
    const value = env[name];
    if (!isVercel && (!value || /^\/(?![/\\])/.test(value))) {
      continue;
    }
    const url = value && URL.canParse(value) ? new URL(value) : null;
    const local = !isVercel && url?.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!url || (!local && url.protocol !== 'https:') || url.username || url.password) {
      throw new Error(`Configura ${name} con una URL pública HTTPS de la API`);
    }
    origins.add(url.origin);
  }
  const policy = [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    `connect-src ${[...origins].join(' ')}`,
  ].join('; ');
  return {
    plugins: [
      react({ babel: { babelrc: false, configFile: false } }),
      {
        name: 'content-security-policy',
        apply: 'build',
        transformIndexHtml: () => [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        }],
      },
    ],
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
