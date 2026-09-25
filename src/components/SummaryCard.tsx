import { format } from '../format';
import { useLivePrices } from '../hooks/useLivePrices';
import { AssetIcon } from './AssetIcon';

export function SummaryCard({ total, count, isSample }: { total: number; count: number; isSample: boolean }) {
  const prices = useLivePrices();
  return <section className="bg-white rounded-[22px] pt-[26px] px-8 pb-0 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] min-[1050px]:sticky min-[1050px]:top-[28px] min-[1050px]:p-6 min-[1050px]:pb-0 max-[481px]:pt-[21px] max-[481px]:px-[23px] max-[481px]:pb-0 max-[481px]:rounded-[20px]" aria-labelledby="total-title">
    <div className="flex justify-between items-center"><span className="w-[42px] h-[42px] rounded-[13px] grid place-items-center bg-[#eef0ff] text-[#5264e8]"><AssetIcon type="cash"/></span>{isSample && <span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span>}</div>
    <h1 id="total-title" className="text-[14px] text-[#7a8097] font-normal mt-5 min-[1050px]:mt-[25px] max-[481px]:mt-4">ارزش کل دارایی‌ها</h1>
    <div className="flex items-baseline gap-[10px] mt-[5px] min-[1050px]:flex-wrap min-[1050px]:gap-[0_8px]"><strong className="text-[44px] font-bold text-[#4659d9] leading-[1.55] tracking-[-1px] min-[1050px]:text-[35px] [@media(min-width:351px)_and_(max-width:480px)]:text-[35px] max-[351px]:text-[30px]">{format(total)}</strong><span className="text-[13px] text-[#8990a9]">تومان</span></div>
    {prices && <p className="text-[11px] text-[#9096aa] mt-1 mb-[23px] max-[481px]:mb-[19px]">≈ {format(total / prices.usdToman, 2)} دلار · {format(total / prices.goldGramToman, 2)} گرم طلا</p>}
    {!prices && <div className="mb-[23px] max-[481px]:mb-[19px]"/>}
    <div className="flex justify-between border-t border-[#f0f1f7] py-4 text-[#9096aa] text-[11px]"><span className="flex items-center gap-[7px]"><i className="h-[6px] w-[6px] bg-[#8593ee] rounded-full"/>سرمایه‌ها، کنار هم</span><span>{format(count)} دارایی</span></div>
  </section>;
}
