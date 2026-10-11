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
    localStorage.removeItem(SERVER_SESSION_KEY);
    localStorage.removeItem(SERVER_TOKEN_KEY);
    localStorage.removeItem(SERVER_EXPIRES_KEY);
  } catch {
    // storage blocked — nothing to clear
  }
}

// Server session helpers
const SERVER_SESSION_KEY = 'oracle_server_session_v1';
const SERVER_TOKEN_KEY = 'oracle_server_token_v1';
const SERVER_EXPIRES_KEY = 'oracle_server_expires_v1';

export function loadServerUser(): User | null {
  try {
    const raw = localStorage.getItem(SERVER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveServerUser(user: User): void {
  try {
    localStorage.setItem(SERVER_SESSION_KEY, JSON.stringify(user));
  } catch {
    // storage blocked
  }
}

export function loadServerToken(): string | null {
  try {
    return localStorage.getItem(SERVER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveServerToken(token: string): void {
  try {
    localStorage.setItem(SERVER_TOKEN_KEY, token);
  } catch {
    // storage blocked
  }
}

export function loadServerExpiresAt(): string | null {
  try {
    return localStorage.getItem(SERVER_EXPIRES_KEY);
  } catch {
    return null;
  }
}

export function saveServerExpiresAt(expiresAt: string): void {
  try {
    localStorage.setItem(SERVER_EXPIRES_KEY, expiresAt);
  } catch {
    // storage blocked
  }
}

export function isServerSessionExpired(): boolean {
  const expiresAt = loadServerExpiresAt();
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}
