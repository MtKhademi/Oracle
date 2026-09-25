import type { Asset } from '../assets';
import { localAssetService } from './localAssetService';

export type ImportMode = 'replace' | 'add' | 'subtract';

export interface ImportAssetChange {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
}

export interface ImportResult {
  assets: Asset[];
  added: number;
  updated: number;
  skippedNoMatch: number; // 'subtract' rows with no existing matching asset
  changes: ImportAssetChange[]; // per-row transaction records for 'add'/'subtract' modes
}

export interface AssetService {
  listAssets(): Promise<Asset[] | null>; // null = nothing stored yet (use default sample data)
  addAsset(asset: Asset): Promise<Asset[]>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<Asset[]>;
  deleteAsset(id: string): Promise<Asset[]>;
  // Merges by `code` (see assetCodeRegistry.ts), with the mode chosen at import
  // time: 'replace' (a full snapshot) overwrites a matched asset's quantity/
  // unitPrice or appends a new one and writes no transactions; 'add' adds the
  // imported quantity (updating unit price) and records a 'buy' per row;
  // 'subtract' subtracts the imported quantity (clamped at 0, unit price
  // untouched) and records a 'sell' per row, skipping rows with no match.
  importAssets(assets: Asset[], mode: ImportMode): Promise<ImportResult>;
  clearAssets(): Promise<Asset[]>; // returns []
}

// The only place that needs to change to point at a server-backed implementation later.
export const assetService: AssetService = localAssetService;
