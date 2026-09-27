import { localWalletService } from './localWalletService';

// One cash/bank account tracked on the "کیف پول" tab — e.g. "نقد", "کارت
// بانک ملی". `balance` is a plain toman amount (displayed via format() +
// "تومان"), unlike an Asset's quantity × unit-price.
export interface WalletAccount {
  id: string;
  name: string;
  balance: number;
}

export interface WalletService {
  listAccounts(): Promise<WalletAccount[] | null>; // null = nothing stored yet
  addAccount(account: Omit<WalletAccount, 'id'>): Promise<WalletAccount[]>;
  updateAccount(id: string, changes: Partial<Omit<WalletAccount, 'id'>>): Promise<WalletAccount[]>;
  deleteAccount(id: string): Promise<WalletAccount[]>;
}

// The only place that needs to change to point at a server-backed implementation later.
export const walletService: WalletService = localWalletService;
