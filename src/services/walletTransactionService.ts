import type { WalletTransaction } from '../types/walletTransaction';
import { localWalletTransactionService } from './localWalletTransactionService';

export interface WalletTransactionService {
  listTransactionsForAccount(accountId: string): Promise<WalletTransaction[]>;
  addTransaction(input: Omit<WalletTransaction, 'id'>): Promise<WalletTransaction>;
  deleteTransactionsForAccount(accountId: string): Promise<void>;
}

// The only place that needs to change to point at a server-backed implementation later.
export const walletTransactionService: WalletTransactionService = localWalletTransactionService;
