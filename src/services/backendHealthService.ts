const HEALTH_ENDPOINT = '/health';

type HealthResponse = { status?: unknown };

// Health is deliberately stricter than a successful HTTP response: a proxy or
// static-server fallback must not be mistaken for the Oracle API itself.
export async function isBackendHealthy(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const body = await response.json().catch(() => null) as HealthResponse | null;
    return body?.status === 'ok';
  } catch {
    return false;
  }
}
