import { loadTransactions, saveTransactions } from '../transactionStorage';
import type { Transaction } from '../types/transaction';
import type { TransactionService } from './transactionService';

function assertValidTransaction(transaction: Omit<Transaction, 'id'>): void {
  if (transaction.quantity <= 0) throw new Error('Transaction quantity must be greater than 0');
  if (transaction.unitPrice < 0) throw new Error('Transaction unitPrice must be 0 or greater');
}

export const localTransactionService: TransactionService = {
  async listTransactions() {
    return loadTransactions();
  },

  async listTransactionsForAsset(assetId) {
    return loadTransactions().filter(transaction => transaction.assetId === assetId);
  },

  async addTransaction(input) {
    assertValidTransaction(input);
    const transaction: Transaction = { ...input, id: crypto.randomUUID() };
    saveTransactions([...loadTransactions(), transaction]);
    return transaction;
  },

  async updateTransaction(id, changes) {
    const current = loadTransactions();
    const existing = current.find(transaction => transaction.id === id);
    if (!existing) throw new Error('Transaction not found');
    const updated: Transaction = { ...existing, ...changes, id: existing.id, assetId: existing.assetId };
    assertValidTransaction(updated);
    saveTransactions(current.map(transaction => (transaction.id === id ? updated : transaction)));
    return updated;
  },

  async deleteTransaction(id) {
    saveTransactions(loadTransactions().filter(transaction => transaction.id !== id));
  },

  async deleteTransactionsForAsset(assetId) {
    saveTransactions(loadTransactions().filter(transaction => transaction.assetId !== assetId));
  },
};
