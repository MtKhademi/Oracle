import { expireServerSession, loadServerToken } from '../authStorage';

export type OracleAccessResult = { productKey: string; hasAccess: boolean };

export async function checkOracleAccess(): Promise<OracleAccessResult> {
  const token = loadServerToken();
  const response = await fetch('/oracle/api/access/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (response.status === 401) {
    expireServerSession();
    throw new Error('session-expired');
  }
  if (response.status === 403) throw new Error('oracle-access-denied');
  if (!response.ok) throw new Error('oracle-access-check-failed');

  return await response.json() as OracleAccessResult;
}
