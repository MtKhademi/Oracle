import type { ReactNode } from 'react';

// Wraps the tab switcher (SectionTabs) + the active tab's own header row
// (Toolbar on "کیف پول", MarketWatchList's own header row on "چشم بازار")
// in a white card ONLY below the 1050px breakpoint, where the outer assets
// <section> in App.tsx has no card styling of its own. At >=1050px this
// renders no bg/border/padding/margin at all — the outer section already IS
// the card there, so wrapping it again would double the card look. Reuses
// the exact large-card tokens from SummaryCard.tsx/PortfolioTrendChart.tsx
// (bg-white, border-[#eceef8], shadow-[0_12px_36px_#2734790b]), just scoped
// to max-[1050px]: (the exact Tailwind v4 complement of the outer section's
// own min-[1050px]: card classes) instead of always-on. The asset/market
// item lists themselves stay OUTSIDE this card (each row is already its own
// card — see AI-KNOWLEDGE.md).
export function SectionHeaderCard({ children }: { children: ReactNode }) {
  return <div className="max-[1050px]:bg-white max-[1050px]:border max-[1050px]:border-[#eceef8] max-[1050px]:rounded-[20px] max-[1050px]:shadow-[0_12px_36px_#2734790b] max-[1050px]:p-[14px] max-[351px]:p-[10px] max-[1050px]:mb-[15px]">
    {children}
  </div>;
}
