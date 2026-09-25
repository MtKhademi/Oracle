import type { ReactNode } from 'react';
import { useMarketWatch } from '../hooks/useMarketWatch';
import { format } from '../format';
import type { MarketCategory, MarketItem } from '../services/marketWatchService';
import { CryptoIcon, FixedIncomeIcon, GoldBarIcon, StockIcon } from './icons';

const timeFormatter = new Intl.DateTimeFormat('fa-IR', { timeStyle: 'medium' });

const categoryOrder: MarketCategory[] = ['currency', 'gold', 'stock', 'fixed-income'];

const categoryMeta: Record<MarketCategory, { label: string; icon: ReactNode }> = {
  currency: { label: 'ارزها', icon: <CryptoIcon/> },
  gold: { label: 'طلا', icon: <GoldBarIcon/> },
  stock: { label: 'بورس', icon: <StockIcon/> },
  'fixed-income': { label: 'صندوق‌های درآمد ثابت', icon: <FixedIncomeIcon/> },
};

function groupByCategory(items: MarketItem[]): Partial<Record<MarketCategory, MarketItem[]>> {
  const groups: Partial<Record<MarketCategory, MarketItem[]>> = {};
  for (const item of items) {
    (groups[item.category] ??= []).push(item);
  }
  return groups;
}

// Read-only, categorized "چشم بازار" view (see AI-KNOWLEDGE.md §6l/§6m) —
// groups a fixed set of market items by category, each with their live
// (mock) toman price. Calls useMarketWatch() itself (unlike AssetRow, which
// takes prices as a prop): this list is only ever mounted while the "چشم
// بازار" tab is active, so there's no benefit to threading the subscription
// through App.tsx. Uses the independent marketWatchService/useMarketWatch —
// NOT useLivePrices()/priceService, which remains untouched for the
// portfolio total and AssetRow's GOLD18/USDT live pricing.
export function MarketWatchList() {
  const snapshot = useMarketWatch();

  if (!snapshot) {
    return <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">در حال دریافت قیمت‌ها...</p>;
  }

  const updatedAtLabel = timeFormatter.format(new Date(snapshot.updatedAt));
  const groups = groupByCategory(snapshot.items);

  return <div className="grid gap-[18px]">
    <p className="text-[10px] text-[#a2a8b9] px-1">بروزرسانی: {updatedAtLabel}</p>
    {categoryOrder.map(category => {
      const items = groups[category];
      if (!items || items.length === 0) return null;
      const meta = categoryMeta[category];
      return <section key={category}>
        <div className="flex items-center gap-[8px] px-1 mb-[10px]">
          <span className="w-6 h-6 rounded-[8px] grid place-items-center bg-[#eef0ff] text-[#5264e8] shrink-0" aria-hidden="true">{meta.icon}</span>
          <h3 className="text-[13px] font-bold">{meta.label}</h3>
        </div>
        <ul className="list-none m-0 p-0 grid gap-[10px]">
          {items.map(item => <li key={item.id} className="bg-white border border-[#eef0f7] rounded-[17px] flex items-center justify-between gap-[15px] py-[14px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] max-[481px]:px-[16px] min-[1050px]:p-[14px]">
            <h4 className="text-[13px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{item.name}</h4>
            <div className="text-left shrink-0 flex items-baseline gap-[6px]">
              <strong className="text-[14px] font-bold [font-variant-numeric:tabular-nums] max-[351px]:text-[12px]">{format(item.priceToman)}</strong>
              <span className="text-[#a2a8b9] text-[10px]">تومان</span>
            </div>
          </li>)}
        </ul>
      </section>;
    })}
  </div>;
}
