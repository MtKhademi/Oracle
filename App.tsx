import { assets, type Asset } from './src/assets';

const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);

const iconTint: Record<Asset['icon'], string> = {
  gold: 'text-[#d7a144] bg-[#fff5df]',
  fund: 'text-[#6e68dc] bg-[#f0edff]',
  cash: 'text-[#4ab3b4] bg-[#e5f7f6]',
  usdt: 'text-[#3daf99] bg-[#e6f6f0]',
  btc: 'text-[#efa451] bg-[#fff1e3]',
  eth: 'text-[#617cdb] bg-[#ecf0ff]',
};

const assetIconBase = 'w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] [@media(min-width:351px)_and_(max-width:480px)]:w-[41px] [@media(min-width:351px)_and_(max-width:480px)]:h-[41px] max-[351px]:w-[35px] max-[351px]:h-[35px]';

function AssetIcon({ type }: { type: string }) {
  if (type === 'btc' || type === 'usdt') return <span className="font-[Arial,sans-serif] text-[27px] leading-none font-semibold">{type === 'btc' ? '₿' : '₮'}</span>;
  return <svg className="w-6 h-6 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'gold' ? <><path d="m7 7-4 11h18L17 7Z"/><path d="M7 7h10M8 14h8M10 10h4"/></> : type === 'cash' ? <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M4 6V5a2 2 0 0 1 2-2h12v3M21 11h-6v5h6"/><path d="M17 13.5h.01"/></> : type === 'eth' ? <><path d="m12 2 6 10-6 4-6-4Zm-6 13 6 7 6-7-6 4Z"/><path d="M12 2v14M6 12l6-3 6 3"/></> : <><path d="M4 19h16M6 15v-3m6 3V9m6 6V5M4 8l6-4 5 2 5-3"/></>}
  </svg>;
}

export default function App() {
  const total = assets.reduce((sum, asset) => sum + asset.quantity * asset.unitPrice, 0);
  return <div>
    <header className="bg-[#5264e8] text-white h-[224px] min-[1050px]:h-[220px] max-[481px]:h-[198px]"><div className="max-w-[900px] mx-auto pt-[35px] pb-[35px] px-8 flex items-center justify-between min-[1050px]:px-6 max-[481px]:pt-[25px] max-[481px]:pb-[25px] max-[481px]:px-[22px]">
      <a className="flex items-center gap-3 text-[22px] font-bold no-underline max-[481px]:text-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[5px] focus-visible:rounded-[10px]" href="./" aria-label="Oracle، صفحه اصلی"><span className="h-[46px] w-[46px] border border-[#ffffff40] bg-[#ffffff15] rounded-[15px] grid place-items-center max-[481px]:h-[41px] max-[481px]:w-[41px]"><svg className="w-[30px] h-[30px] block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 15v-3m4 3V8m4 7v-5"/></svg></span><span>Oracle<span className="block text-[11px] font-normal text-[#e0e4ff] mt-[1px]">سرمایه‌های من</span></span></a>
      <span className="text-[12px] text-[#e0e4ff] max-[481px]:text-[10px] max-[351px]:hidden">یک نگاه، همهٔ دارایی‌ها</span>
    </div></header>
    <main className="max-w-[800px] mx-auto mt-[-89px] px-6 pb-9 relative min-[1050px]:max-w-[900px] min-[1050px]:grid min-[1050px]:grid-cols-[300px_1fr] min-[1050px]:gap-5 min-[1050px]:items-start min-[1050px]:mt-[-65px] max-[481px]:mt-[-77px] max-[481px]:px-[18px] max-[481px]:pb-[28px]">
      <section className="bg-white rounded-[22px] pt-[26px] px-8 pb-0 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] min-[1050px]:sticky min-[1050px]:top-[28px] min-[1050px]:p-6 min-[1050px]:pb-0 max-[481px]:pt-[21px] max-[481px]:px-[23px] max-[481px]:pb-0 max-[481px]:rounded-[20px]" aria-labelledby="total-title">
        <div className="flex justify-between items-center"><span className="w-[42px] h-[42px] rounded-[13px] grid place-items-center bg-[#eef0ff] text-[#5264e8]"><AssetIcon type="cash"/></span><span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span></div>
        <h1 id="total-title" className="text-[14px] text-[#7a8097] font-normal mt-5 min-[1050px]:mt-[25px] max-[481px]:mt-4">ارزش کل دارایی‌ها</h1>
        <div className="flex items-baseline gap-[10px] mt-[5px] mb-[23px] min-[1050px]:flex-wrap min-[1050px]:gap-[0_8px] max-[481px]:mb-[19px]"><strong className="text-[44px] font-bold text-[#4659d9] leading-[1.55] tracking-[-1px] min-[1050px]:text-[35px] [@media(min-width:351px)_and_(max-width:480px)]:text-[35px] max-[351px]:text-[30px]">{format(total)}</strong><span className="text-[13px] text-[#8990a9]">تومان</span></div>
        <div className="flex justify-between border-t border-[#f0f1f7] py-4 text-[#9096aa] text-[11px]"><span className="flex items-center gap-[7px]"><i className="h-[6px] w-[6px] bg-[#8593ee] rounded-full"/>سرمایه‌ها، کنار هم</span><span>{format(assets.length)} دارایی</span></div>
      </section>
      <section className="mt-[31px] min-[1050px]:mt-0 min-[1050px]:bg-white min-[1050px]:border min-[1050px]:border-[#eceef5] min-[1050px]:rounded-[22px] min-[1050px]:p-[22px] max-[481px]:mt-[27px]" aria-labelledby="assets-title">
        <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]"><h2 id="assets-title" className="text-[17px] font-bold max-[481px]:text-[15px]">دارایی‌های من</h2><span className="text-[11px] text-[#656e87]">ارزش به تومان</span></div>
        <ul className="list-none m-0 p-0 grid gap-[10px]">{assets.map(asset => <li className={`bg-white border border-[#eef0f7] rounded-[17px] flex items-center gap-[15px] py-[17px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:p-[14px] [@media(min-width:351px)_and_(max-width:480px)]:gap-[12px] [@media(min-width:351px)_and_(max-width:480px)]:py-[15px] [@media(min-width:351px)_and_(max-width:480px)]:px-[14px] max-[351px]:gap-[9px] max-[351px]:py-[13px] max-[351px]:px-[10px]`} key={asset.id}>
          <span className={`${assetIconBase} ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
          <div className="flex-1 min-w-0"><h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{asset.name}</h3><p className="text-[11px] text-[#999fb2] mt-[5px]">{format(asset.quantity, 8)} {asset.unit}</p></div>
          <div className="text-left shrink-0 flex flex-col gap-[5px]"><strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] [@media(min-width:351px)_and_(max-width:480px)]:text-[14px] max-[351px]:text-[12px]">{format(asset.quantity * asset.unitPrice)}</strong><span className="text-[#a2a8b9] text-[10px]">تومان</span></div>
        </li>)}</ul>
      </section>
      <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] mt-[25px] min-[1050px]:col-span-full min-[1050px]:mt-0">مقادیر فعلاً نمونه‌اند و دارایی واقعی شما نیستند.</p>
    </main>
  </div>;
}
