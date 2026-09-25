import type { Asset } from '../assets';
import { localAssetService } from './localAssetService';

// The modal's default-mode choice, applied to rows that leave نوع empty.
export type ImportMode = 'replace' | 'add' | 'subtract';

// A row's *effective* type, after falling back to the default mode when its
// own نوع cell was empty (see resolveEffectiveType in App.tsx).
export type ImportEffectiveType = 'buy' | 'sell' | 'replace';

// One row ready to be applied: the built `Asset` (catalog-driven, see
// App.tsx's parseImportRows) paired with its resolved effective type/date.
export interface ImportRow {
  asset: Asset;
  effectiveType: ImportEffectiveType;
  effectiveDate: string; // ISO YYYY-MM-DD
}

export interface ImportAssetChange {
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  date: string; // ISO YYYY-MM-DD, the row's own effective date (not always today)
}

export interface ImportResult {
  assets: Asset[];
  added: number;
  updated: number;
  skippedNoMatch: number; // 'sell' rows with no existing matching asset
  changes: ImportAssetChange[]; // per-row transaction records for 'buy'/'sell' rows
}

export interface AssetService {
  listAssets(): Promise<Asset[] | null>; // null = nothing stored yet (use default sample data)
  addAsset(asset: Asset): Promise<Asset[]>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<Asset[]>;
  deleteAsset(id: string): Promise<Asset[]>;
  // Merges by `code` (see assetCodeRegistry.ts). Each row's own `effectiveType`
  // decides what happens, independent of the other rows in the same import:
  // 'replace' overwrites a matched asset's quantity/unitPrice or appends a new
  // one, writing no transaction; 'buy' adds the row's quantity (updating unit
  // price) or appends a new asset, always recording a 'buy'; 'sell' subtracts
  // the row's quantity (clamped at 0, unit price untouched) and records a
  // 'sell' when a match exists, or is skipped (skippedNoMatch++) when it
  // doesn't — a sale cannot be recorded against a holding that doesn't exist.
  importAssets(rows: ImportRow[]): Promise<ImportResult>;
  clearAssets(): Promise<Asset[]>; // returns []
}

// The only place that needs to change to point at a server-backed implementation later.
export const assetService: AssetService = localAssetService;
