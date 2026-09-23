import type { Asset } from '../assets';

export const iconTint: Record<Asset['icon'], string> = {
  gold: 'text-[#d7a144] bg-[#fff5df]',
  fund: 'text-[#6e68dc] bg-[#f0edff]',
  cash: 'text-[#4ab3b4] bg-[#e5f7f6]',
  usdt: 'text-[#3daf99] bg-[#e6f6f0]',
  btc: 'text-[#efa451] bg-[#fff1e3]',
  eth: 'text-[#617cdb] bg-[#ecf0ff]',
  other: 'text-[#6b7280] bg-[#eef0f3]',
};

export function AssetIcon({ type }: { type: string }) {
  if (type === 'btc' || type === 'usdt') return <span className="font-[Arial,sans-serif] text-[27px] leading-none font-semibold">{type === 'btc' ? '₿' : '₮'}</span>;
  return <svg className="w-6 h-6 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'gold' ? <><path d="m7 7-4 11h18L17 7Z"/><path d="M7 7h10M8 14h8M10 10h4"/></> : type === 'cash' ? <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M4 6V5a2 2 0 0 1 2-2h12v3M21 11h-6v5h6"/><path d="M17 13.5h.01"/></> : type === 'eth' ? <><path d="m12 2 6 10-6 4-6-4Zm-6 13 6 7 6-7-6 4Z"/><path d="M12 2v14M6 12l6-3 6 3"/></> : <><path d="M4 19h16M6 15v-3m6 3V9m6 6V5M4 8l6-4 5 2 5-3"/></>}
  </svg>;
}
