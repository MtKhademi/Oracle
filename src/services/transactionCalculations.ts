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

  // A 'replace' transaction is a non-destructive checkpoint: it never deletes
  // earlier transactions from storage/history, but everything before the most
  // recent one is ignored here — the calculation restarts from that replace's
  // quantity/unitPrice instead of accumulating from zero.
  let lastReplaceIndex = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].transaction.type === 'replace') {
      lastReplaceIndex = i;
      break;
    }
  }

  let quantity = 0;
  let averageCost = 0;
  let realizedPnL = 0;
  let startIndex = 0;

  if (lastReplaceIndex !== -1) {
    const replaceTransaction = sorted[lastReplaceIndex].transaction;
    quantity = replaceTransaction.quantity;
    averageCost = replaceTransaction.unitPrice;
    realizedPnL = 0;
    startIndex = lastReplaceIndex + 1;
  }

  for (let i = startIndex; i < sorted.length; i++) {
    const { transaction } = sorted[i];
    if (transaction.type === 'replace') continue;

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
