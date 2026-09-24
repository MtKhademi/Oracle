import type { Asset } from '../assets';
import { localAssetService } from './localAssetService';

export interface AssetService {
  listAssets(): Promise<Asset[] | null>; // null = nothing stored yet (use default sample data)
  addAsset(asset: Asset): Promise<Asset[]>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<Asset[]>;
  deleteAsset(id: string): Promise<Asset[]>;
  // Merges by `code` (see assetCodeRegistry.ts): an imported asset whose code
  // matches an asset already in the list updates that asset's quantity/unitPrice
  // (keeping its id, not adding to the old numbers); any other imported asset is
  // appended as new. `added`/`updated` report how many rows landed in each bucket.
  importAssets(assets: Asset[]): Promise<{ assets: Asset[]; added: number; updated: number }>;
  clearAssets(): Promise<Asset[]>; // returns []
}

// The only place that needs to change to point at a server-backed implementation later.
export const assetService: AssetService = localAssetService;
