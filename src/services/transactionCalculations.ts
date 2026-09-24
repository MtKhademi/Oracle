import type { Asset } from '../assets';
import type { Transaction } from '../types/transaction';
import { transactionService } from './transactionService';

export type HoldingSummary = {
  quantity: number;
  averageCost: number;
  realizedPnL: number;
};

export function computeHoldingSummary(transactions: Transaction[]): HoldingSummary {
  const sorted = transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => a.transaction.date.localeCompare(b.transaction.date) || a.index - b.index);

  let quantity = 0;
  let averageCost = 0;
  let realizedPnL = 0;

  for (const { transaction } of sorted) {
    if (transaction.type === 'buy') {
      const nextQuantity = quantity + transaction.quantity;
      averageCost = nextQuantity === 0 ? 0 : (quantity * averageCost + transaction.quantity * transaction.unitPrice) / nextQuantity;
      quantity = nextQuantity;
      continue;
    }

    realizedPnL += (transaction.unitPrice - averageCost) * transaction.quantity;
    quantity = Math.max(0, quantity - transaction.quantity);
    if (quantity === 0) averageCost = 0;
  }

  return { quantity, averageCost: quantity === 0 ? 0 : averageCost, realizedPnL };
}

export async function ensureInitialTransaction(asset: Asset): Promise<void> {
  const existing = await transactionService.listTransactionsForAsset(asset.id);
  if (existing.length > 0) return;

  await transactionService.addTransaction({
    assetId: asset.id,
    type: 'buy',
    quantity: asset.quantity,
    unitPrice: asset.unitPrice,
    date: new Date().toISOString().slice(0, 10),
  });
}
