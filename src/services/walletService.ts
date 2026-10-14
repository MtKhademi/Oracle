import { serverWalletService } from './serverWalletService';

// One cash/bank account tracked on the "کیف پول" tab — e.g. "نقد", "کارت
// بانک ملی". `balance` is a plain toman amount (displayed via format() +
// "تومان"), unlike an Asset's quantity × unit-price.
export interface WalletAccount {
  id: string;
  name: string;
  balance: number;
  bankName?: string;
  bankCode?: string;
  isDefault?: boolean;
  cardNumber?: string;
  accountNumber?: string;
  shebaNumber?: string;
  cardPin1?: string;
  cardPin2?: string;
}

export interface WalletService {
  listAccounts(): Promise<WalletAccount[] | null>; // null = nothing stored yet
  addAccount(account: Omit<WalletAccount, 'id'>): Promise<WalletAccount[]>;
  updateAccount(id: string, changes: Partial<Omit<WalletAccount, 'id'>>): Promise<WalletAccount[]>;
  deleteAccount(id: string): Promise<WalletAccount[]>;
}

// Bank-account identity/details use the Oracle API in every environment.
// Balances, PIN reminders, and transaction history have no server contract yet
// and remain browser-local through the same WalletAccount cache.
export const walletService: WalletService = serverWalletService;
