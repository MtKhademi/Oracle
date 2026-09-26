import { useEffect, useRef, useState } from 'react';
import { format, maskAmount } from '../format';
import { priceService, type LivePrices } from '../services/priceService';
import { marketWatchService } from '../services/marketWatchService';
import { AssetIcon } from './AssetIcon';
import { DollarIcon, EyeClosedIcon, GoldBarIcon, MarketEyeIcon, RefreshIcon } from './icons';

const SPIN_DURATION_MS = 700;

export function SummaryCard({ total, count, isSample, prices, isBalanceHidden, onToggleBalanceHidden, onOpenWallet }: { total: number; count: number; isSample: boolean; prices: LivePrices | null; isBalanceHidden: boolean; onToggleBalanceHidden: () => void; onOpenWallet: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const isFirstPrices = useRef(true);

  useEffect(() => {
    if (prices === null) return;
    if (isFirstPrices.current) {
      // Don't spin for the very first value delivered right after subscribing.
      isFirstPrices.current = false;
      return;
    }
    setIsSpinning(true);
    const timeoutId = setTimeout(() => setIsSpinning(false), SPIN_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [prices]);

  return <section className="bg-white rounded-[22px] pt-[26px] px-8 pb-0 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] min-[1050px]:sticky min-[1050px]:top-[28px] min-[1050px]:p-6 min-[1050px]:pb-0 max-[481px]:pt-[21px] max-[481px]:px-[23px] max-[481px]:pb-0 max-[481px]:rounded-[20px]" aria-label="ارزش کل دارایی‌ها">
    <div className="flex justify-between items-center">
      <button type="button" onClick={onOpenWallet} aria-label="نمایش کیف پول" className="w-[42px] h-[42px] rounded-[13px] grid place-items-center bg-[#eef0ff] text-[#5264e8] cursor-pointer hover:bg-[#e0e3fd] transition-colors"><AssetIcon type="cash"/></button>
      <span className="flex items-center gap-2">
        {isSample && <span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span>}
        <span className="flex items-center gap-1">
          <button type="button" onClick={onToggleBalanceHidden} aria-label={isBalanceHidden ? 'نمایش ارزش دارایی‌ها' : 'مخفی کردن ارزش دارایی‌ها'} className={`w-6 h-6 rounded-full grid place-items-center hover:bg-[#f0f1f7] transition-colors ${isBalanceHidden ? 'text-[#9096aa] hover:text-[#5264e8]' : 'text-[#1f9d55]'}`}>
            {isBalanceHidden ? <EyeClosedIcon/> : <MarketEyeIcon/>}
          </button>
          <button type="button" onClick={() => { void Promise.all([priceService.refreshNow(), marketWatchService.refreshNow()]); }} disabled={isSpinning} aria-label="بروزرسانی قیمت‌ها" className="w-6 h-6 rounded-full grid place-items-center text-[#9096aa] hover:bg-[#f0f1f7] hover:text-[#5264e8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            <span className={isSpinning ? 'animate-spin' : ''}><RefreshIcon/></span>
          </button>
        </span>
      </span>
    </div>
    <div className="flex items-baseline gap-[10px] mt-4 min-[1050px]:mt-5 max-[481px]:mt-3 min-[1050px]:flex-wrap min-[1050px]:gap-[0_8px]"><strong className="text-[44px] font-bold text-[#4659d9] leading-[1.55] tracking-[-1px] min-[1050px]:text-[35px] [@media(min-width:351px)_and_(max-width:480px)]:text-[35px] max-[351px]:text-[30px]">{isBalanceHidden ? maskAmount(format(total)) : format(total)}</strong><span className="text-[13px] text-[#8990a9]">تومان</span></div>
    <div className={`flex flex-col gap-[7px] mt-2 mb-[23px] max-[481px]:mb-[19px] ${prices ? '' : 'invisible'}`} aria-hidden={!prices}>
      <div className="flex items-center gap-[8px]">
        <span className="w-6 h-6 rounded-[8px] grid place-items-center bg-[#d7f5e0] text-[#1f9d55] shrink-0"><DollarIcon/></span>
        <span className="text-[13px] font-medium text-[#1f9d55]">≈ {isBalanceHidden ? maskAmount(format(total / (prices?.usdToman ?? 1), 2)) : format(total / (prices?.usdToman ?? 1), 2)} دلار</span>
        <span className="text-[10px] text-[#8fa89a]">هر دلار {format(prices?.usdToman ?? 0)} تومان</span>
      </div>
      <div className="flex items-center gap-[8px]">
        <span className="w-6 h-6 rounded-[8px] grid place-items-center bg-[#fff5df] text-[#d7a144] shrink-0"><GoldBarIcon/></span>
        <span className="text-[13px] font-medium text-[#d7a144]">≈ {isBalanceHidden ? maskAmount(format(total / (prices?.goldGramToman ?? 1), 2)) : format(total / (prices?.goldGramToman ?? 1), 2)} گرم طلا</span>
        <span className="text-[10px] text-[#c7b48a]">هر گرم {format(prices?.goldGramToman ?? 0)} تومان</span>
      </div>
    </div>
    <div className="flex justify-between border-t border-[#f0f1f7] py-4 text-[#9096aa] text-[11px]"><span className="flex items-center gap-[7px]"><i className="h-[6px] w-[6px] bg-[#8593ee] rounded-full"/>سرمایه‌ها، کنار هم</span><span>{format(count)} دارایی</span></div>
  </section>;
}
