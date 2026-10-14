import type { Transaction } from './types/transaction';
import { getUserScopedStorageKey } from './userScopedStorage';

const STORAGE_KEY = 'oracle_transactions_v1';

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(getUserScopedStorageKey(STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(getUserScopedStorageKey(STORAGE_KEY), JSON.stringify(transactions));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
