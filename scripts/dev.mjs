import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const officeApiOrigin = 'http://10.1.111.8:5000';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readLocalProxyTarget() {
  const envPath = resolve(projectRoot, '.env.local');
  if (!existsSync(envPath)) return undefined;
  const contents = readFileSync(envPath, 'utf8');
  return /^\s*VITE_API_PROXY_TARGET\s*=\s*(.*?)\s*$/m.exec(contents)?.[1]?.replace(/^['"]|['"]$/g, '');
}

async function isOfficeApiReachable() {
  try {
    const response = await fetch(`${officeApiOrigin}/health`, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

const env = { ...process.env };
const localProxyTarget = readLocalProxyTarget();
if (localProxyTarget) {
  env.VITE_API_PROXY_TARGET = localProxyTarget;
  console.log(`Using the local Oracle API proxy target at ${localProxyTarget}.`);
} else if (await isOfficeApiReachable()) {
  env.VITE_API_PROXY_TARGET = officeApiOrigin;
  console.log(`Using the office Oracle API at ${officeApiOrigin}.`);
}

const vite = spawn(process.execPath, [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0'], { stdio: 'inherit', env });
vite.on('exit', code => process.exit(code ?? 0));
