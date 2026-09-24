import type { Transaction } from '../types/transaction';
import { localTransactionService } from './localTransactionService';

export interface TransactionService {
  listTransactions(): Promise<Transaction[]>;
  listTransactionsForAsset(assetId: string): Promise<Transaction[]>;
  addTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(id: string, changes: Partial<Omit<Transaction, 'id' | 'assetId'>>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  deleteTransactionsForAsset(assetId: string): Promise<void>;
}

// The only place that needs to change to point at a server-backed implementation later.
export const transactionService: TransactionService = localTransactionService;
