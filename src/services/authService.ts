import type { User } from '../types';
import { localAuthService } from './localAuthService';

export interface AuthService {
  signUp(input: { fullName: string; email: string; phone: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn(input: { identifier: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>; // identifier = email or phone
  logOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(identifier: string): Promise<{ ok: true; simulatedCode: string } | { ok: false; error: string }>;
  resetPassword(identifier: string, code: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

// The only place that needs to change to point at a server-backed implementation later.
export const authService: AuthService = localAuthService;
