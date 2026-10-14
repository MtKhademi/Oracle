import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const env = {
  ...process.env,
  VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET ?? 'http://45.82.137.126:8585',
};

console.log(`Using the production Atlas API proxy target at ${env.VITE_API_PROXY_TARGET}.`);

const vite = spawn(
  process.execPath,
  [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0'],
  { stdio: 'inherit', env },
);

vite.on('exit', code => process.exit(code ?? 0));
