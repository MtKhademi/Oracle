import type { Asset } from '../assets';
import type { LivePrices } from './priceService';

// Maps specific catalog-driven assets (identified by their `code`, the catalog
// symbol) to a field on LivePrices. Any asset not listed here keeps using its
// own manually stored/imported `unitPrice`, unaffected by the live price feed.
const LIVE_PRICE_ASSET_CODES: Partial<Record<string, keyof LivePrices>> = {
  GOLD18: 'goldGramToman',
  USDT: 'usdToman',
};

export function getLivePriceKeyForAsset(asset: Asset): keyof LivePrices | null {
  if (!asset.code) return null;
  return LIVE_PRICE_ASSET_CODES[asset.code] ?? null;
}

export function getEffectiveUnitPrice(asset: Asset, prices: LivePrices | null): number {
  const key = getLivePriceKeyForAsset(asset);
  return key && prices ? prices[key] : asset.unitPrice;
}
