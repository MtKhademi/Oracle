import { useState, type ReactNode } from 'react';
import { useMarketWatch, useMarketWatchlist } from '../hooks/useMarketWatch';
import { format } from '../format';
import type { MarketCategory, MarketItem } from '../services/marketWatchService';
import { categoryMeta, categoryOrder } from '../services/marketCategoryMeta';
import { IconButton } from './IconButton';
import { PlusIcon, TrashIcon } from './icons';
import { AddMarketWatchItemModal } from './AddMarketWatchItemModal';
import { SectionHeaderCard } from './SectionHeaderCard';

const timeFormatter = new Intl.DateTimeFormat('fa-IR', { timeStyle: 'medium' });

function groupByCategory(items: MarketItem[]): Partial<Record<MarketCategory, MarketItem[]>> {
  const groups: Partial<Record<MarketCategory, MarketItem[]>> = {};
  for (const item of items) {
    (groups[item.category] ??= []).push(item);
  }
  return groups;
}

// Categorized "چشم بازار" view (see AI-KNOWLEDGE.md §6l/§6m/§6r) — groups
// the owner's personal watchlist subset of the fixed market catalog by
// category, each with their live (mock) toman price, plus an add button
// (opens AddMarketWatchItemModal) and a per-item remove button. Calls
// useMarketWatch() and useMarketWatchlist() itself (unlike AssetRow, which
// takes prices as a prop): this list is only ever mounted while the "چشم
// بازار" tab is active, so there's no benefit to threading either
// subscription through App.tsx. Uses the independent marketWatchService/
// marketWatchlistService — NOT useLivePrices()/priceService/assetService,
// which remain untouched for the portfolio total, AssetRow's GOLD18/USDT
// live pricing, and the wallet's own asset list.
export function MarketWatchList({ tabs }: { tabs?: ReactNode } = {}) {
  const snapshot = useMarketWatch();
  const { watchedIds, add, remove } = useMarketWatchlist();
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (!snapshot || watchedIds === null) {
    return <>
      <SectionHeaderCard>
        {tabs}
        <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">در حال دریافت قیمت‌ها...</p>
      </SectionHeaderCard>
    </>;
  }

  const updatedAtLabel = timeFormatter.format(new Date(snapshot.updatedAt));
  const watchedItems = snapshot.items.filter(item => watchedIds.includes(item.id));
  const groups = groupByCategory(watchedItems);

  return <>
    <SectionHeaderCard>
      {tabs}
      <div className="flex justify-between items-center px-1 min-[1050px]:mb-[19px]">
        <IconButton icon={<PlusIcon/>} onClick={() => setIsAddOpen(true)} ariaLabel="افزودن به چشم بازار" tone="neutral"/>
        <p className="text-[10px] text-[#a2a8b9]">بروزرسانی: {updatedAtLabel}</p>
      </div>
    </SectionHeaderCard>
    <div className="grid gap-[18px]">
    {watchedItems.length === 0
      ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">چیزی به چشم بازار اضافه نشده</p>
      : categoryOrder.map(category => {
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
              <div className="flex items-center gap-[10px] shrink-0">
                <div className="text-left flex items-baseline gap-[6px]">
                  <strong className="text-[14px] font-bold [font-variant-numeric:tabular-nums] max-[351px]:text-[12px]">{format(item.priceToman)}</strong>
                  <span className="text-[#a2a8b9] text-[10px]">تومان</span>
                </div>
                <IconButton icon={<TrashIcon/>} onClick={() => remove(item.id)} ariaLabel={`حذف ${item.name} از چشم بازار`} tone="danger" variant="ghost"/>
              </div>
            </li>)}
          </ul>
        </section>;
      })}
    {isAddOpen && <AddMarketWatchItemModal onClose={() => setIsAddOpen(false)} watchedIds={watchedIds} onAdd={add}/>}
    </div>
  </>;
}
