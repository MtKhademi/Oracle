import type { ReactNode } from 'react';
import type { MarketCategory } from './marketWatchService';
import { CryptoIcon, FixedIncomeIcon, GoldBarIcon, StockIcon } from '../components/icons';

// Shared category order/labels/icons for the چشم بازار market catalog — used
// by both MarketWatchList.tsx (grouping the watched items) and
// AddMarketWatchItemModal.tsx (grouping the pickable candidates), so the two
// don't duplicate this mapping (see AI-KNOWLEDGE.md §6r).
export const categoryOrder: MarketCategory[] = ['currency', 'gold', 'stock', 'fixed-income'];

export const categoryMeta: Record<MarketCategory, { label: string; icon: ReactNode }> = {
  currency: { label: 'ارزها', icon: <CryptoIcon/> },
  gold: { label: 'طلا', icon: <GoldBarIcon/> },
  stock: { label: 'بورس', icon: <StockIcon/> },
  'fixed-income': { label: 'صندوق‌های درآمد ثابت', icon: <FixedIncomeIcon/> },
};
