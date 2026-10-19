import { oracleRequest } from './oracleApiClient';

export type OracleAccessResult = { productKey: string; hasAccess: boolean };

export async function checkOracleAccess(): Promise<OracleAccessResult> {
  try {
    return await oracleRequest<OracleAccessResult>('/oracle/api/access/me', { cache: 'no-store' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('دسترسی Oracle')) throw new Error('oracle-access-denied');
    if (error instanceof Error && error.message.includes('نشست')) throw new Error('session-expired');
    throw new Error('oracle-access-check-failed');
  }
}
