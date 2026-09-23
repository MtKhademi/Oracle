import type { User } from './types';

const USERS_KEY = 'oracle_users_v1';
const SESSION_KEY = 'oracle_session_v1';

// Internal storage shape only — carries the simulated password-reset code
// alongside each user record. Never exposed as-is outside this file; callers
// only ever see the public `User` type.
export type StoredUser = User & {
  resetCode?: string;
  resetCodeExpiresAt?: number;
};

export function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}

export function loadSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveSessionUserId(id: string): void {
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    // storage blocked — ignore, in-memory state still works for this session
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // storage blocked — nothing to clear
  }
}
