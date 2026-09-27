import type { WalletAccount } from './services/walletService';

const WALLET_ACCOUNTS_STORAGE_KEY = 'oracle_wallet_accounts_v1';

// Reads the "کیف پول" (cash/bank account) list from localStorage — same
// try/catch-safe, null-on-missing-or-invalid convention as loadAssets in
// src/storage.ts (`null` means "never saved yet", an explicit `[]` means
// "owner removed every account").
export function loadWalletAccounts(): WalletAccount[] | null {
  try {
    const raw = localStorage.getItem(WALLET_ACCOUNTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWalletAccounts(accounts: WalletAccount[]): void {
  try {
    localStorage.setItem(WALLET_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
