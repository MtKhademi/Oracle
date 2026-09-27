import type { WalletTransaction } from './types/walletTransaction';

const STORAGE_KEY = 'oracle_wallet_transactions_v1';

export function loadWalletTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWalletTransactions(transactions: WalletTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
