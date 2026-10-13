import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/iam': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/oracle': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
