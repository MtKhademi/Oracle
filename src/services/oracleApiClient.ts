import { expireServerSession, loadServerToken } from '../authStorage';

export type ApiProblem = { detail?: string; title?: string; errors?: Record<string, string[]> };

export class OracleApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

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

export async function oracleRequest<T>(url: string, init: RequestInit = {}, allowedStatuses: readonly number[] = []): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...authorizationHeaders(), ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  lastLogSystemId = response.headers.get('X-Log-System-Id');
  if (!response.ok && !allowedStatuses.includes(response.status)) {
    const body = await response.json().catch(() => null) as ApiProblem | null;
    if (response.status === 401) {
      expireServerSession();
      throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
    }
    if (response.status === 403) throw new OracleApiError(403, 'دسترسی Oracle برای این حساب فعال نیست.');
    const validationMessages = body?.errors ? Object.values(body.errors).flat().join(' ') : '';
    throw new OracleApiError(response.status, validationMessages || body?.detail || body?.title || `درخواست Oracle انجام نشد (${response.status})`);
  }
  if (!response.ok) throw new OracleApiError(response.status, `درخواست Oracle با وضعیت ${response.status} پاسخ داد`);
  return response.status === 204 ? (undefined as T) : await response.json() as T;
}
