import type { WalletTransaction } from './types/walletTransaction';
import { getUserScopedStorageKey } from './userScopedStorage';

const STORAGE_KEY = 'oracle_wallet_transactions_v1';

export function loadWalletTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(getUserScopedStorageKey(STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWalletTransactions(transactions: WalletTransaction[]): void {
  try {
    localStorage.setItem(getUserScopedStorageKey(STORAGE_KEY), JSON.stringify(transactions));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
