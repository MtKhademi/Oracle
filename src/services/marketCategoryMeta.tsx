import type { ReactNode } from 'react';
import type { MarketCategory } from './marketWatchService';
import { CryptoIcon, FixedIncomeIcon, GoldBarIcon, InvestmentIcon, StockIcon, MarketEyeIcon } from '../components/icons';

// Shared category order/labels/icons for the چشم بازار market catalog — the
// order is the display order for category groups (see MarketWatchList.tsx)
// and the labels mirror assetCatalog.ts's categoryLabels.
export const categoryOrder: MarketCategory[] = ['gold', 'silver', 'currency', 'crypto', 'stock', 'fund', 'index', 'cash'];

export const categoryMeta: Record<MarketCategory, { label: string; icon: ReactNode }> = {
  gold: { label: 'طلا', icon: <GoldBarIcon/> },
  silver: { label: 'نقره', icon: <GoldBarIcon/> },
  currency: { label: 'ارز', icon: <CryptoIcon/> },
  crypto: { label: 'رمزارز', icon: <CryptoIcon/> },
  stock: { label: 'بورس', icon: <StockIcon/> },
  fund: { label: 'صندوق', icon: <FixedIncomeIcon/> },
  index: { label: 'شاخص', icon: <InvestmentIcon/> },
  cash: { label: 'نقد', icon: <MarketEyeIcon/> },
};
