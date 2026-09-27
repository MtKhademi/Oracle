import { MarketEyeIcon, WalletIcon } from './icons';

export type SectionTab = 'wallet' | 'market';

// The "کیف پول" / "چشم بازار" tab switcher — moved out of App.tsx unchanged
// (markup/behavior identical) so it can be rendered once per tab, wrapped
// together with that tab's own header row in SectionHeaderCard.tsx (see
// AI-KNOWLEDGE.md). Bottom margin below 1050px shrunk from mb-[15px] to
// mb-[12px] since it now sits inside SectionHeaderCard's own padded card
// rather than directly above the section's outer padding.
export function SectionTabs({ activeTab, onChange }: {
  activeTab: SectionTab;
  onChange: (tab: SectionTab) => void;
}) {
  return <div className="grid grid-cols-2 mb-[12px] min-[1050px]:mb-[19px] border border-[#eef0f7] rounded-[10px] p-1">
    <button type="button" onClick={() => onChange('wallet')} className={`flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${activeTab === 'wallet' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}><WalletIcon/>کیف پول</button>
    <button type="button" onClick={() => onChange('market')} className={`flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${activeTab === 'market' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}><MarketEyeIcon/>چشم بازار</button>
  </div>;
}
