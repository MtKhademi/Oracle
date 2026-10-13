import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync } from 'node:fs';

function getApiProxyTarget(): string {
  if (process.env.VITE_API_PROXY_TARGET) return process.env.VITE_API_PROXY_TARGET;

  try {
    const release = readFileSync('/proc/sys/kernel/osrelease', 'utf8');
    const resolver = existsSync('/etc/resolv.conf') ? readFileSync('/etc/resolv.conf', 'utf8') : '';
    const gateway = /^nameserver\s+(.+)$/m.exec(resolver)?.[1]?.trim();
    if (/microsoft/i.test(release) && gateway) return `http://${gateway}:5000`;
  } catch {
    // A native Windows/macOS/Linux dev server uses its own loopback by default.
  }

  return 'http://127.0.0.1:5000';
}

const apiProxyTarget = getApiProxyTarget();

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/iam': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/oracle': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
