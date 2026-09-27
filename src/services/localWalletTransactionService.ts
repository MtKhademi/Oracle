import { generateUuidV4 } from '../uuid';
import { loadWalletTransactions, saveWalletTransactions } from '../walletTransactionStorage';
import type { WalletTransaction } from '../types/walletTransaction';
import type { WalletTransactionService } from './walletTransactionService';

function assertValidWalletTransaction(transaction: Omit<WalletTransaction, 'id'>): void {
  if (transaction.type === 'replace') {
    if (transaction.amount < 0) throw new Error('Wallet transaction amount must be 0 or greater');
  } else if (transaction.amount <= 0) {
    throw new Error('Wallet transaction amount must be greater than 0');
  }
}

export const localWalletTransactionService: WalletTransactionService = {
  async listTransactionsForAccount(accountId) {
    return loadWalletTransactions().filter(transaction => transaction.accountId === accountId);
  },

  async addTransaction(input) {
    assertValidWalletTransaction(input);
    const transaction: WalletTransaction = { ...input, id: generateUuidV4() };
    saveWalletTransactions([...loadWalletTransactions(), transaction]);
    return transaction;
  },

  async deleteTransactionsForAccount(accountId) {
    saveWalletTransactions(loadWalletTransactions().filter(transaction => transaction.accountId !== accountId));
  },
};
