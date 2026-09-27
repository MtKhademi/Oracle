import { generateUuidV4 } from '../uuid';
import { loadWalletAccounts, saveWalletAccounts } from '../walletStorage';
import type { WalletService, WalletAccount } from './walletService';

export const localWalletService: WalletService = {
  async listAccounts() {
    return loadWalletAccounts();
  },

  async addAccount(account) {
    const current = loadWalletAccounts() ?? [];
    const next: WalletAccount[] = [...current, { ...account, id: generateUuidV4() }];
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
