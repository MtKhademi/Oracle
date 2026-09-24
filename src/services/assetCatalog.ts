import type { Asset } from '../assets';
import catalog from '../data/assetCatalog.json';

// Fixed reference catalog of known assets (symbol/name/category/unit), provided
// by the owner to stop free-typed asset names from creating duplicate or
// inconsistent entries. See AddAssetModal.tsx: the add-asset form is now driven
// by this catalog instead of a free-text name field. A catalog asset's `symbol`
// IS its unique identity `code` — it supersedes the auto-generated
// `GOLD-0001`-style codes from assetCodeRegistry.ts for anything picked from
// here (that registry remains only as a fallback for non-catalog codes).

export interface CatalogCategory {
  id: string;
  label: string;
}

export interface CatalogUnit {
  id: string;
  label: string;
}

export interface CatalogAsset {
  symbol: string;
  name: string;
  category: string;
  unit: string;
}

const categories = catalog.categories as CatalogCategory[];
const units = catalog.units as CatalogUnit[];
const catalogAssets = catalog.assets as CatalogAsset[];

export function getCatalogAssets(): CatalogAsset[] {
  return catalogAssets;
}

export function getCatalogAssetBySymbol(symbol: string): CatalogAsset | undefined {
  return catalogAssets.find(asset => asset.symbol === symbol);
}

export function getCategoryLabel(id: string): string {
  return categories.find(category => category.id === id)?.label ?? id;
}

export function getUnitLabel(id: string): string {
  return units.find(unit => unit.id === id)?.label ?? id;
}

// Maps a catalog entry's category (gold/currency/stock/cash/other) to the
// existing internal Asset['icon'] categories, so AssetIcon/iconTint (which only
// know about those 7 keys) keep working unchanged for catalog-driven assets:
// gold -> gold, cash -> cash, stock -> other, and currency -> usdt/btc/eth for
// those exact symbols, other for any other currency (e.g. USDC, BNB).
export function getAssetIconForCatalogEntry(catalogAsset: CatalogAsset): Asset['icon'] {
  if (catalogAsset.category === 'gold') return 'gold';
  if (catalogAsset.category === 'cash') return 'cash';
  if (catalogAsset.category === 'currency') {
    if (catalogAsset.symbol === 'USDT') return 'usdt';
    if (catalogAsset.symbol === 'BTC') return 'btc';
    if (catalogAsset.symbol === 'ETH') return 'eth';
    return 'other';
  }
  // stock, and any unrecognized category, fall back to the neutral 'other' icon.
  return 'other';
}
