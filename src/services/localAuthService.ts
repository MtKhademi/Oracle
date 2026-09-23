import { sha256 } from 'js-sha256';
import { clearSession, loadSessionUserId, loadUsers, saveSessionUserId, saveUsers, type StoredUser } from '../authStorage';
import type { User } from '../types';
import type { AuthService } from './authService';

const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Uses `js-sha256` (pure JS, no Web Crypto API) instead of
// `crypto.subtle.digest(...)`: SubtleCrypto only exists in a "secure context"
// (HTTPS or localhost) and is `undefined` over plain HTTP, which crashed
// signUp/logIn entirely on the current HTTP-only deployment. This keeps
// working identically regardless of HTTP/HTTPS.
async function hashPassword(password: string): Promise<string> {
  return sha256(password);
}

function toPublicUser(stored: StoredUser): User {
  const { resetCode, resetCodeExpiresAt, ...user } = stored;
  return user;
}

// Defensive check for a bugged/half-created record (e.g. left over from a
// previous crashed signup attempt) — a real user always has a non-empty
// hash, so treat anything else as unusable and safe to ignore/overwrite.
function hasValidPasswordHash(u: StoredUser): boolean {
  return typeof u.passwordHash === 'string' && u.passwordHash.length > 0;
}

// `crypto.randomUUID()` carries the exact same secure-context restriction as
// `crypto.subtle` (both are [SecureContext]-only in the spec/browser
// implementations), so it would also throw on the current HTTP deployment
// right after the hash above. `crypto.getRandomValues()` has no such
// restriction, so build a standard v4 UUID from it manually instead.
function generateUserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function findByIdentifier(users: StoredUser[], identifier: string): StoredUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return users.find(u => hasValidPasswordHash(u) && (u.email.toLowerCase() === normalized || u.phone.trim() === identifier.trim()));
}

export const localAuthService: AuthService = {
  async signUp({ fullName, email, phone, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    // Drop any leftover record with the same email/phone that has no valid
    // password hash (e.g. from a signup that crashed before hashing/saving
    // completed) — it can never log in anyway, so it must not block a fresh
    // signup with the same identifier.
    const users = loadUsers().filter(u => hasValidPasswordHash(u) || (u.email.toLowerCase() !== normalizedEmail && u.phone.trim() !== normalizedPhone));
    const exists = users.some(u => hasValidPasswordHash(u) && (u.email.toLowerCase() === normalizedEmail || u.phone.trim() === normalizedPhone));
    if (exists) {
      return { ok: false, error: 'این ایمیل یا شماره موبایل قبلاً ثبت‌نام کرده است' };
    }
    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      id: generateUserId(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: normalizedPhone,
      passwordHash,
    };
    saveUsers([...users, newUser]);
    saveSessionUserId(newUser.id);
    return { ok: true, user: toPublicUser(newUser) };
  },

  async logIn({ identifier, password }) {
    const users = loadUsers();
    const found = findByIdentifier(users, identifier);
    const genericError = 'ایمیل/شماره یا رمز عبور اشتباه است';
    if (!found) return { ok: false, error: genericError };
    const passwordHash = await hashPassword(password);
    if (passwordHash !== found.passwordHash) return { ok: false, error: genericError };
    saveSessionUserId(found.id);
    return { ok: true, user: toPublicUser(found) };
  },

  async logOut() {
    clearSession();
  },

  async getCurrentUser() {
    const id = loadSessionUserId();
    if (!id) return null;
    const found = loadUsers().find(u => u.id === id);
    return found ? toPublicUser(found) : null;
  },

  async requestPasswordReset(identifier) {
    const users = loadUsers();
    const found = findByIdentifier(users, identifier);
    if (!found) return { ok: false, error: 'کاربری با این ایمیل یا شماره موبایل پیدا نشد' };
    const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updated: StoredUser = { ...found, resetCode: simulatedCode, resetCodeExpiresAt: Date.now() + RESET_CODE_TTL_MS };
    saveUsers(users.map(u => (u.id === found.id ? updated : u)));
    // --- SIMULATION ONLY ---
    // No real email/SMS provider is connected yet. In a server-backed
    // implementation, this is exactly where the code would be sent via an
    // email/SMS API instead of being returned here for the UI to display
    // on-screen. The caller (UI) is responsible for showing `simulatedCode`
    // to the user until that integration exists.
    return { ok: true, simulatedCode };
  },

  async resetPassword(identifier, code, newPassword) {
    const users = loadUsers();
    const found = findByIdentifier(users, identifier);
    if (!found) return { ok: false, error: 'کاربری با این ایمیل یا شماره موبایل پیدا نشد' };
    if (!found.resetCode || !found.resetCodeExpiresAt || found.resetCodeExpiresAt < Date.now()) {
      return { ok: false, error: 'کد بازیابی نامعتبر یا منقضی شده است' };
    }
    if (found.resetCode !== code.trim()) {
      return { ok: false, error: 'کد بازیابی نامعتبر یا منقضی شده است' };
    }
    const passwordHash = await hashPassword(newPassword);
    const updated: StoredUser = { ...found, passwordHash, resetCode: undefined, resetCodeExpiresAt: undefined };
    saveUsers(users.map(u => (u.id === found.id ? updated : u)));
    return { ok: true };
  },
};
