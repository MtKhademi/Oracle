import { loadServerToken } from '../authStorage';
import type { Asset } from '../assets';
import { getAssetIconForCatalogEntry, getUnitLabel } from './assetCatalog';
import type { AssetService, ImportResult } from './assetService';

// Server-backed asset list. The backend (OpenAPI v1) only exposes the market
// catalog — there are no holding/quantity endpoints yet — so every asset
// arrives with quantity 0 and the mutating operations below are not
// supported until the backend adds them.
type MarketAssetResponse = {
  id: string;
  symbol: string;
  name: string;
  category: string;
  unit: string;
  isTradable: boolean;
  source: string;
  externalId: string | null;
};

function authorizationHeaders(): HeadersInit {
  const token = loadServerToken();
  if (!token) throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  return { Authorization: `Bearer ${token}` };
}

function toAsset(apiAsset: MarketAssetResponse): Asset {
  return {
    id: apiAsset.id,
    name: apiAsset.name,
    quantity: 0, // Server provides the catalog; holdings are recorded locally via transactions
    unit: getUnitLabel(apiAsset.unit),
    unitPrice: 0, // Live prices come from livePriceMapping/priceService, not the catalog
    icon: getAssetIconForCatalogEntry({ symbol: apiAsset.symbol, name: apiAsset.name, category: apiAsset.category, unit: apiAsset.unit }),
    code: apiAsset.symbol,
  };
}

export const serverAssetService: AssetService = {
  async listAssets() {
    try {
      const response = await fetch('/oracle/api/market/assets', {
        headers: authorizationHeaders(),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as MarketAssetResponse[];
      return data.filter(asset => asset.isTradable).map(toAsset);
    } catch (error) {
      console.error('Failed to fetch market assets:', error);
      return null;
    }
  },

  async addAsset() {
    throw new Error('ثبت دارایی جدید هنوز توسط بک‌اند پشتیبانی نمی‌شود');
  },

  async updateAsset() {
    throw new Error('به‌روزرسانی دارایی هنوز توسط بک‌اند پشتیبانی نمی‌شود');
  },

  async deleteAsset() {
    throw new Error('حذف دارایی هنوز توسط بک‌اند پشتیبانی نمی‌شود');
  },

  async importAssets(): Promise<ImportResult> {
    throw new Error('وارد کردن فایل اکسل هنوز توسط بک‌اند پشتیبانی نمی‌شود');
  },

  async clearAssets() {
    throw new Error('پاک کردن دارایی‌ها هنوز توسط بک‌اند پشتیبانی نمی‌شود');
  },
};
