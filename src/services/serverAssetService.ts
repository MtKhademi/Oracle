import type { Asset } from '../assets';
import { getAssetIconForCatalogEntry, getUnitLabel } from './assetCatalog';
import type { AssetService, ImportResult } from './assetService';
import { oracleRequest } from './oracleApiClient';

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

type UserAssetResponse = {
  id: string;
  marketAssetId: string;
  symbol: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  averageUnitCost: number | null;
  note: string | null;
};

function toAsset(apiAsset: MarketAssetResponse): Asset {
  return {
    id: apiAsset.id,
    name: apiAsset.name,
    quantity: 0, // Server provides the catalog; holdings are recorded locally via transactions
    unit: getUnitLabel(apiAsset.unit),
    unitPrice: 0, // Live prices come from livePriceMapping/priceService, not the catalog
    icon: getAssetIconForCatalogEntry({ id: apiAsset.id, symbol: apiAsset.symbol, name: apiAsset.name, category: apiAsset.category, unit: apiAsset.unit }),
    code: apiAsset.symbol,
  };
}

function toUserAsset(apiAsset: UserAssetResponse): Asset {
  return {
    id: apiAsset.id,
    name: apiAsset.name,
    quantity: apiAsset.quantity,
    unit: getUnitLabel(apiAsset.unit),
    unitPrice: apiAsset.averageUnitCost ?? 0,
    icon: getAssetIconForCatalogEntry({ id: apiAsset.marketAssetId, symbol: apiAsset.symbol, name: apiAsset.name, category: apiAsset.category, unit: apiAsset.unit }),
    code: apiAsset.symbol,
  };
}

const request = oracleRequest;

async function listUserAssets(): Promise<Asset[]> {
  const data = await request<UserAssetResponse[]>('/oracle/api/me/assets');
  return data.map(toUserAsset);
}

export const serverAssetService: AssetService = {
  async listAssets() {
    return listUserAssets();
  },

  async addAsset(asset) {
    if (asset.quantity <= 0) throw new Error('مقدار دارایی باید بیشتر از صفر باشد');
    await request<UserAssetResponse>('/oracle/api/me/assets', {
      method: 'POST',
      body: JSON.stringify({ marketAssetId: asset.code ? (await findMarketAssetId(asset.code)) : asset.id, quantity: asset.quantity, averageUnitCost: asset.unitPrice, note: null }),
    });
    return listUserAssets();
  },

  async updateAsset(id, changes) {
    const current = (await listUserAssets()).find(asset => asset.id === id);
    if (!current) throw new Error('دارایی پیدا نشد');
    if (changes.quantity === 0) {
      await request<void>(`/oracle/api/me/assets/${id}`, { method: 'DELETE' });
      return listUserAssets();
    }
    const updated = await request<UserAssetResponse>(`/oracle/api/me/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: changes.quantity ?? current.quantity, averageUnitCost: changes.unitPrice ?? current.unitPrice, note: null }),
    });
    const result = toUserAsset(updated);
    return (await listUserAssets()).map(asset => asset.id === result.id ? result : asset);
  },

  async deleteAsset(id) {
    await request<void>(`/oracle/api/me/assets/${id}`, { method: 'DELETE' });
    return listUserAssets();
  },

  async importAssets(rows): Promise<ImportResult> {
    let assets = await listUserAssets();
    let added = 0;
    let updated = 0;
    let skippedNoMatch = 0;
    const changes: ImportResult['changes'] = [];

    for (const row of rows) {
      const existing = assets.find(asset => asset.code === row.asset.code);
      if (row.effectiveType === 'sell' && !existing) {
        skippedNoMatch += 1;
        continue;
      }
      const nextQuantity = row.effectiveType === 'replace'
        ? row.asset.quantity
        : row.effectiveType === 'buy'
          ? (existing?.quantity ?? 0) + row.asset.quantity
          : Math.max(0, (existing?.quantity ?? 0) - row.asset.quantity);

      if (nextQuantity === 0 && existing) {
        await request<void>(`/oracle/api/me/assets/${existing.id}`, { method: 'DELETE' });
        assets = assets.filter(asset => asset.id !== existing.id);
      } else if (existing) {
        const updatedResponse = await request<UserAssetResponse>(`/oracle/api/me/assets/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: nextQuantity, averageUnitCost: row.asset.unitPrice, note: null }),
        });
        assets = assets.map(asset => asset.id === existing.id ? toUserAsset(updatedResponse) : asset);
        updated += 1;
      } else if (nextQuantity > 0) {
        const created = await request<UserAssetResponse>('/oracle/api/me/assets', {
          method: 'POST',
          body: JSON.stringify({ marketAssetId: row.asset.id, quantity: nextQuantity, averageUnitCost: row.asset.unitPrice, note: null }),
        });
        assets = [...assets, toUserAsset(created)];
        added += 1;
      }

      if (row.effectiveType !== 'replace') {
        changes.push({ assetId: existing?.id ?? row.asset.id, type: row.effectiveType, quantity: row.asset.quantity, unitPrice: row.asset.unitPrice, date: row.effectiveDate });
      }
    }
    return { assets, added, updated, skippedNoMatch, changes };
  },

  async clearAssets() {
    const assets = await listUserAssets();
    await Promise.all(assets.map(asset => request<void>(`/oracle/api/me/assets/${asset.id}`, { method: 'DELETE' })));
    return [];
  },
};

async function findMarketAssetId(symbol: string): Promise<string> {
  const data = await request<MarketAssetResponse[]>('/oracle/api/market/assets');
  const match = data.find(asset => asset.symbol === symbol);
  if (!match) throw new Error('دارایی بازار پیدا نشد');
  return match.id;
}
