import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/iam': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/oracle': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
