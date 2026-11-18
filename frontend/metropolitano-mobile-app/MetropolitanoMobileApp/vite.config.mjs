import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react({ babel: { babelrc: false, configFile: false } })],
  define: {
    __METROPOLITANO_API_URL__: JSON.stringify(
      process.env.VITE_API_URL || '/api/v1/demo',
    ),
    __METROPOLITANO_AI_URL__: JSON.stringify(
      process.env.VITE_AI_URL || '/ai',
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
});
