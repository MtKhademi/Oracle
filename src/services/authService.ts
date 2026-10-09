import type { User } from '../types';
import { serverAuthService } from './serverAuthService';

export interface AuthService {
  signUp(input: { fullName: string; email: string; phone: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn(input: { identifier: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>; // identifier = email or phone
  logOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(identifier: string): Promise<{ ok: true; simulatedCode: string } | { ok: false; error: string }>;
  resetPassword(identifier: string, code: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

// Server-backed auth — points at the real API endpoints.
export const authService: AuthService = serverAuthService;
