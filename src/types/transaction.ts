export type TransactionType = 'buy' | 'sell';

export type Transaction = {
  id: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  unitPrice: number;
  date: string;
  note?: string;
};
