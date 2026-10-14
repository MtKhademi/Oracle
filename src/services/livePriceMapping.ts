import type { Asset } from '../assets';
import type { LivePriceQuote, LivePrices } from './priceService';

export function getLivePriceForAsset(asset: Asset, prices: LivePrices | null): LivePriceQuote | null {
  if (!asset.code || !prices) return null;
  return prices.quotes[asset.code] ?? null;
}

export function getEffectiveUnitPrice(asset: Asset, prices: LivePrices | null): number {
  return getLivePriceForAsset(asset, prices)?.priceToman ?? asset.unitPrice;
}
