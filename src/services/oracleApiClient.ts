import { expireServerSession, loadServerToken } from '../authStorage';

export type ApiProblem = { detail?: string; title?: string; errors?: Record<string, string[]> };

let lastLogSystemId: string | null = null;

export function getLastLogSystemId(): string | null {
  return lastLogSystemId;
}

function authorizationHeaders(): HeadersInit {
  const token = loadServerToken();
  if (!token) {
    expireServerSession();
    throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  }
  return { Authorization: `Bearer ${token}` };
}

export async function oracleRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...authorizationHeaders(), ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  lastLogSystemId = response.headers.get('X-Log-System-Id');
  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiProblem | null;
    if (response.status === 401) {
      expireServerSession();
      throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
    }
    if (response.status === 403) throw new Error('دسترسی Oracle برای این حساب فعال نیست.');
    const validationMessages = body?.errors ? Object.values(body.errors).flat().join(' ') : '';
    throw new Error(validationMessages || body?.detail || body?.title || `درخواست Oracle انجام نشد (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : await response.json() as T;
}
