import type { ReactNode } from 'react';
import { useLivePrices } from '../hooks/useLivePrices';
import { format } from '../format';
import type { LivePrices } from '../services/priceService';
import { AssetIcon, iconTint } from './AssetIcon';
import { DollarIcon } from './icons';

const timeFormatter = new Intl.DateTimeFormat('fa-IR', { timeStyle: 'medium' });

type MarketWatchRow = { key: string; name: string; price: number; badge: ReactNode; badgeClass: string };

// دلار and تتر both read from the same mock usdToman rate — shown as two
// separate rows since they're commonly checked independently (see AI-KNOWLEDGE.md §6l).
function buildRows(prices: LivePrices): MarketWatchRow[] {
  return [
    { key: 'usdt', name: 'تتر', price: prices.usdToman, badge: <AssetIcon type="usdt"/>, badgeClass: iconTint.usdt },
    { key: 'usd', name: 'دلار', price: prices.usdToman, badge: <DollarIcon/>, badgeClass: 'text-[#1f9d55] bg-[#d7f5e0]' },
    { key: 'gold18', name: 'عیار گرمی (۱۸ عیار)', price: prices.goldGramToman, badge: <AssetIcon type="gold"/>, badgeClass: iconTint.gold },
    { key: 'eth', name: 'اتریوم', price: prices.ethToman, badge: <AssetIcon type="eth"/>, badgeClass: iconTint.eth },
    { key: 'btc', name: 'بیت‌کوین', price: prices.btcToman, badge: <AssetIcon type="btc"/>, badgeClass: iconTint.btc },
  ];
}

// Read-only market-watch view (see AI-KNOWLEDGE.md §6l) — lists a fixed set
// of market items with their live (mock) toman price and last-update time.
// Calls useLivePrices() itself (unlike AssetRow, which takes prices as a
// prop): this list is only ever mounted while the "چشم بازار" tab is
// active, so there's no benefit to threading the subscription through
// App.tsx the way the wallet tab's prices prop is shared across many rows.
export function MarketWatchList() {
  const prices = useLivePrices();

  if (!prices) {
    return <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">در حال دریافت قیمت‌ها...</p>;
  }

  const updatedAtLabel = timeFormatter.format(new Date(prices.updatedAt));

  return <ul className="list-none m-0 p-0 grid gap-[10px]">
    {buildRows(prices).map(row => <li key={row.key} className="bg-white border border-[#eef0f7] rounded-[17px] flex items-center gap-[15px] py-[17px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:p-[14px]">
      <span className={`w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] ${row.badgeClass}`} aria-hidden="true">{row.badge}</span>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{row.name}</h3>
        <p className="text-[10px] text-[#a2a8b9] mt-[2px]">بروزرسانی: {updatedAtLabel}</p>
      </div>
      <div className="text-left shrink-0 flex items-baseline gap-[6px]">
        <strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] max-[351px]:text-[12px]">{format(row.price)}</strong>
        <span className="text-[#a2a8b9] text-[10px]">تومان</span>
      </div>
    </li>)}
  </ul>;
}
