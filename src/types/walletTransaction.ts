export type WalletTransactionType = 'increase' | 'decrease' | 'replace';

export type WalletTransaction = {
  id: string;
  accountId: string;
  type: WalletTransactionType;
  amount: number;
  date: string;
  note?: string;
};
