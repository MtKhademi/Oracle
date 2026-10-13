import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const officeApiOrigin = 'http://10.1.111.8:5000';

async function isOfficeApiReachable() {
  try {
    const response = await fetch(`${officeApiOrigin}/health`, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

const env = { ...process.env };
if (await isOfficeApiReachable()) {
  env.VITE_API_PROXY_TARGET = officeApiOrigin;
  console.log(`Using the office Oracle API at ${officeApiOrigin}.`);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vite = spawn(process.execPath, [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--host', '0.0.0.0'], { stdio: 'inherit', env });
vite.on('exit', code => process.exit(code ?? 0));
