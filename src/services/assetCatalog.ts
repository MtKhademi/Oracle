import type { Asset } from '../assets';
import { loadServerToken } from '../authStorage';

// Server-driven reference catalog — `GET /oracle/api/market/assets` is the
// single source of truth for asset identity (symbol/name/category/unit).
// The label maps below are display metadata only: the backend returns raw
// category/unit ids, not localized labels.

export interface CatalogAsset {
  id: string;
  symbol: string;
  name: string;
  category: string;
  unit: string;
}

const categoryLabels: Record<string, string> = {
  gold: 'طلا',
  silver: 'نقره',
  currency: 'ارز',
  crypto: 'رمزارز',
  fund: 'صندوق',
  stock: 'بورس',
  index: 'شاخص',
  cash: 'نقد',
};

const unitLabels: Record<string, string> = {
  gram: 'گرم',
  mesghal: 'مثقال',
  count: 'واحد',
  share: 'سهم',
  toman: 'تومان',
  usdt: 'USDT',
  btc: 'BTC',
  eth: 'ETH',
  usdc: 'USDC',
  bnb: 'BNB',
  usd: 'USD',
  eur: 'EUR',
  aud: 'AUD',
  cad: 'CAD',
  point: 'نقطه',
};

let cachedAssets: CatalogAsset[] | null = null;
let pendingLoad: Promise<CatalogAsset[]> | null = null;

// Loads (and caches) the catalog from the server. Retries on failure — the
// pending promise is cleared in the catch so the next call re-fetches.
export function loadCatalog(): Promise<CatalogAsset[]> {
  if (cachedAssets) return Promise.resolve(cachedAssets);
  if (!pendingLoad) {
    pendingLoad = (async () => {
      const token = loadServerToken();
      const response = await fetch('/oracle/api/market/assets', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('دریافت فهرست دارایی‌ها انجام نشد');
      const data = (await response.json()) as { id: string; symbol: string; name: string; category: string; unit: string }[];
      cachedAssets = data.map(asset => ({ id: asset.id, symbol: asset.symbol, name: asset.name, category: asset.category, unit: asset.unit }));
      return cachedAssets;
    })().catch(error => {
      pendingLoad = null;
      throw error;
    });
  }
  return pendingLoad;
}

export async function getCatalogAssets(): Promise<CatalogAsset[]> {
  return loadCatalog();
}

export async function getCatalogAssetBySymbol(symbol: string): Promise<CatalogAsset | undefined> {
  const catalogAssets = await loadCatalog();
  return catalogAssets.find(asset => asset.symbol === symbol);
}

export function getCategoryLabel(id: string): string {
  return categoryLabels[id] ?? id;
}

export function getUnitLabel(id: string): string {
  return unitLabels[id] ?? id;
}

// Maps a catalog entry's category to the existing internal Asset['icon']
// keys so AssetIcon/iconTint (which only know those 7 keys) keep working:
// gold/silver -> gold, cash -> cash, fund -> fund, crypto -> usdt/btc/eth
// for those exact symbols and 'other' for the rest, everything else 'other'.
export function getAssetIconForCatalogEntry(catalogAsset: CatalogAsset): Asset['icon'] {
  if (catalogAsset.category === 'gold' || catalogAsset.category === 'silver') return 'gold';
  if (catalogAsset.category === 'cash') return 'cash';
  if (catalogAsset.category === 'fund') return 'fund';
  if (catalogAsset.category === 'crypto') {
    if (catalogAsset.symbol === 'USDT') return 'usdt';
    if (catalogAsset.symbol === 'BTC') return 'btc';
    if (catalogAsset.symbol === 'ETH') return 'eth';
  }
  return 'other';
}
