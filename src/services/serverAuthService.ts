import type { User } from '../types';
import type { AuthService } from './authService';
import {
  clearSession,
  expireServerSession,
  loadServerUser,
  loadServerToken,
  saveServerExpiresAt,
  saveServerUser,
  saveServerToken,
  isServerSessionExpired,
} from '../authStorage';

// Relative URL — Vite proxies `/api` to http://localhost:5000 in development.
const API_BASE = '';

function serverUserToAppUser(
  serverUser: { id: string; email: string | null; displayName: string },
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
    isPlatformAdmin: false,
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
  async signUp(input) {
    const res = await fetch(`${API_BASE}/iam/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        mobileNumber: input.phone.trim(),
        password: input.password,
        confirmPassword: input.confirmPassword,
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

    const appUser = serverUserToAppUser(user, accessToken, expiresAtUtc);
    saveServerUser(appUser);
    saveServerToken(accessToken);
    saveServerExpiresAt(expiresAtUtc);

    return { ok: true, user: appUser };
  },

  async logIn(input: { identifier: string; password: string }) {
    const res = await fetch(`${API_BASE}/iam/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: input.identifier.trim(),
        password: input.password,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: 'ایمیل/شماره یا رمز عبور اشتباه است' };
    }

    const data = await res.json();
    const { accessToken, expiresAtUtc, user } = data;

    const appUser = serverUserToAppUser(user, accessToken, expiresAtUtc);
    saveServerUser(appUser);
    saveServerToken(accessToken);
    saveServerExpiresAt(expiresAtUtc);

    return { ok: true, user: appUser };
  },

  async logOut() {
    clearSession();
  },

  async getCurrentUser() {
    const user = loadServerUser();
    if (!user) return null;

    if (isServerSessionExpired()) {
      expireServerSession();
      return null;
    }

    const token = loadServerToken();
    if (!token) {
      expireServerSession();
      return null;
    }

    return { ...user, token };
  },

  async requestPasswordReset(identifier: string) {
    try {
      const res = await fetch(`${API_BASE}/iam/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: identifier.trim() }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        return { ok: false, error: parseApiError(body) };
      }

      const message = typeof body === 'object' && body !== null && 'message' in body && typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message
        : 'کد بازیابی ارسال شد';
      return { ok: true, message };
    } catch {
      return { ok: false, error: 'ارتباط با سرویس بازیابی رمز برقرار نشد' };
    }
  },

  async resetPassword(identifier: string, code: string, newPassword: string) {
    try {
      const res = await fetch(`${API_BASE}/iam/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: identifier.trim(),
          code: code.trim(),
          password: newPassword,
          confirmPassword: newPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        return { ok: false, error: parseApiError(body) };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'ارتباط با سرویس بازیابی رمز برقرار نشد' };
    }
  },
};
