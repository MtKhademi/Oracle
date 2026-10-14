import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const homeEnvPath = resolve(projectRoot, '.env.home');
const homeEnv = existsSync(homeEnvPath) ? readFileSync(homeEnvPath, 'utf8') : '';
const target = /^\s*VITE_API_PROXY_TARGET\s*=\s*(.*?)\s*$/m.exec(homeEnv)?.[1]?.replace(/^['"]|['"]$/g, '');

if (!target) {
  console.error('Missing VITE_API_PROXY_TARGET. Copy .env.home.example to .env.home and set the home API URL.');
  process.exit(1);
}

const env = { ...process.env, VITE_API_PROXY_TARGET: target };
const vite = spawn(process.execPath, [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0'], {
  stdio: 'inherit',
  env,
});
vite.on('exit', code => process.exit(code ?? 0));
