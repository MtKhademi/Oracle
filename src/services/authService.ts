import type { User } from '../types';
import { serverAuthService } from './serverAuthService';

export interface AuthService {
  signUp(input: { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logIn(input: { identifier: string; password: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }>; // identifier = email or phone
  logOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  requestPasswordReset(identifier: string): Promise<{ ok: true; message: string; simulatedCode?: string } | { ok: false; error: string }>;
  resetPassword(identifier: string, code: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

// Authentication must use the backend in every environment. The production
// Nginx config proxies these relative paths to the Atlas API container.
export const authService: AuthService = serverAuthService;
