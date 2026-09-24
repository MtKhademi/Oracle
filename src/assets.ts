// `code` is optional at the type level because it is assigned lazily by the
// one-time migration in App.tsx (see src/services/assetCodeRegistry.ts) —
// assets created before this field existed, or via the add-asset form /
// Excel import (not wired up to code generation yet), may not have one.
export type Asset = { id: string; name: string; quantity: number; unit: string; unitPrice: number; icon: 'gold' | 'fund' | 'cash' | 'usdt' | 'btc' | 'eth' | 'other'; code?: string };

// Illustrative data only, not the user's actual portfolio or current market prices.
// All unit prices are in toman. Cash has unitPrice = 1.
export const assets: Asset[] = [
  { id: 'gold', name: 'طلای ۱۸ عیار', quantity: 12.5, unit: 'گرم', unitPrice: 7500000, icon: 'gold' },
  { id: 'ayar', name: 'صندوق طلای عیار', quantity: 1200, unit: 'واحد', unitPrice: 28500, icon: 'fund' },
  { id: 'ganj', name: 'صندوق طلای گنج', quantity: 800, unit: 'واحد', unitPrice: 32000, icon: 'fund' },
  { id: 'cash', name: 'پول نقد', quantity: 42000000, unit: 'تومان', unitPrice: 1, icon: 'cash' },
  { id: 'usdt', name: 'تتر', quantity: 250, unit: 'USDT', unitPrice: 100000, icon: 'usdt' },
  { id: 'btc', name: 'بیت کوین', quantity: 0.003, unit: 'BTC', unitPrice: 10000000000, icon: 'btc' },
  { id: 'eth', name: 'اتریوم', quantity: 0.04, unit: 'ETH', unitPrice: 350000000, icon: 'eth' },
];
