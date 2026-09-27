import { loadWalletAccounts, saveWalletAccounts } from '../walletStorage';
import type { WalletService, WalletAccount } from './walletService';

// `crypto.randomUUID()` is [SecureContext]-only (HTTPS/localhost) and is
// undefined on the current plain-HTTP deployment — the same reason
// localAuthService.ts builds user IDs this way instead.
function generateWalletAccountId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export const localWalletService: WalletService = {
  async listAccounts() {
    return loadWalletAccounts();
  },

  async addAccount(account) {
    const current = loadWalletAccounts() ?? [];
    const next: WalletAccount[] = [...current, { ...account, id: generateWalletAccountId() }];
    saveWalletAccounts(next);
    return next;
  },

  async updateAccount(id, changes) {
    const current = loadWalletAccounts() ?? [];
    const next = current.map(account => (account.id === id ? { ...account, ...changes } : account));
    saveWalletAccounts(next);
    return next;
  },

  async deleteAccount(id) {
    const current = loadWalletAccounts() ?? [];
    const next = current.filter(account => account.id !== id);
    saveWalletAccounts(next);
    return next;
  },
};
