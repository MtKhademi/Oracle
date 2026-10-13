import type { User } from '../types';
import { localAuthService } from './localAuthService';
import { serverAuthService } from './serverAuthService';

export interface AuthService {
  signUp(input: { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn(input: { identifier: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>; // identifier = email or phone
  logOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(identifier: string): Promise<{ ok: true; message: string; simulatedCode?: string } | { ok: false; error: string }>;
  resetPassword(identifier: string, code: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

// The backend connection is intentionally development-only for local testing.
export const authService: AuthService = import.meta.env.DEV ? serverAuthService : localAuthService;
