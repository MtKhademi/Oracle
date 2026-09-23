import { clearSession, loadSessionUserId, loadUsers, saveSessionUserId, saveUsers, type StoredUser } from '../authStorage';
import type { User } from '../types';
import type { AuthService } from './authService';

const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toPublicUser(stored: StoredUser): User {
  const { resetCode, resetCodeExpiresAt, ...user } = stored;
  return user;
}

function findByIdentifier(users: StoredUser[], identifier: string): StoredUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return users.find(u => u.email.toLowerCase() === normalized || u.phone.trim() === identifier.trim());
}

export const localAuthService: AuthService = {
  async signUp({ fullName, email, phone, password }) {
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const exists = users.some(u => u.email.toLowerCase() === normalizedEmail || u.phone.trim() === normalizedPhone);
    if (exists) {
      return { ok: false, error: 'این ایمیل یا شماره موبایل قبلاً ثبت‌نام کرده است' };
    }
    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
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
