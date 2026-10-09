import type { User } from '../types';
import type { AuthService } from './authService';
import {
  clearSession,
  loadServerSessionId,
  loadServerToken,
  saveServerExpiresAt,
  saveServerSessionId,
  saveServerToken,
  isServerSessionExpired,
} from '../authStorage';

// Relative URL — relies on the host to proxy `/api` to the backend.
// Dev: Vite proxy (vite.config.ts) → http://localhost:5000
// Prod: nginx reverse proxy (docker/nginx.conf) → backend host
const API_BASE = '';

function serverUserToAppUser(
  serverUser: { id: string; email: string | null; displayName: string; isPlatformAdmin: boolean },
  token: string | null,
  expiresAtUtc: string | null,
): User {
  return {
    id: serverUser.id,
    fullName: serverUser.displayName,
    email: serverUser.email ?? '',
    phone: '',
    passwordHash: null,
    token,
    expiresAtUtc,
    displayName: serverUser.displayName,
    isPlatformAdmin: serverUser.isPlatformAdmin,
  };
}

function parseApiError(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'detail' in body && typeof (body as { detail?: unknown }).detail === 'string') {
    return (body as { detail: string }).detail;
  }
  if (typeof body === 'object' && body !== null && 'errors' in body) {
    const errors = (body as { errors?: Record<string, string[]> }).errors;
    if (errors && typeof errors === 'object') {
      const messages = Object.values(errors).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }
  return 'خطایی رخ داده است';
}

export const serverAuthService: AuthService = {
  async signUp(input: { fullName: string; email: string; phone: string; password: string }) {
    const res = await fetch(`${API_BASE}/api/oracle/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: input.phone,
        password: input.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const error = parseApiError(body);

      if (res.status === 409) {
        return { ok: false, error: 'این شماره موبایل قبلاً ثبت‌نام کرده است' };
      }

      return { ok: false, error };
    }

    const data = await res.json();
    const { accessToken, expiresAtUtc, user } = data;

    saveServerSessionId(user.id);
    saveServerToken(accessToken);
    saveServerExpiresAt(expiresAtUtc);

    const appUser = serverUserToAppUser(user, accessToken, expiresAtUtc);
    return { ok: true, user: appUser };
  },

  async logIn(input: { identifier: string; password: string }) {
    const res = await fetch(`${API_BASE}/api/oracle/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: input.identifier,
        password: input.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const error = parseApiError(body);
      return { ok: false, error: 'ایمیل/شماره یا رمز عبور اشتباه است' };
    }

    const data = await res.json();
    const { accessToken, expiresAtUtc, user } = data;

    saveServerSessionId(user.id);
    saveServerToken(accessToken);
    saveServerExpiresAt(expiresAtUtc);

    const appUser = serverUserToAppUser(user, accessToken, expiresAtUtc);
    return { ok: true, user: appUser };
  },

  async logOut() {
    clearSession();
  },

  async getCurrentUser() {
    const sessionId = loadServerSessionId();
    if (!sessionId) return null;

    if (isServerSessionExpired()) {
      clearSession();
      return null;
    }

    const token = loadServerToken();
    if (!token) {
      clearSession();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/oracle/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          clearSession();
          return null;
        }
        return null;
      }

      const data = await res.json();
      const appUser = serverUserToAppUser(data, token, null);
      return appUser;
    } catch {
      return null;
    }
  },

  async requestPasswordReset(_identifier: string) {
    return { ok: false, error: 'در حال حاضر این قابلیت فعال نیست' };
  },

  async resetPassword(_identifier: string, _code: string, _newPassword: string) {
    return { ok: false, error: 'در حال حاضر این قابلیت فعال نیست' };
  },
};
