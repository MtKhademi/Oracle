import type { Asset } from '../assets';
import { localAssetService } from './localAssetService';

export interface AssetService {
  listAssets(): Promise<Asset[] | null>; // null = nothing stored yet (use default sample data)
  addAsset(asset: Asset): Promise<Asset[]>;
  updateAsset(id: string, changes: Partial<Asset>): Promise<Asset[]>;
  deleteAsset(id: string): Promise<Asset[]>;
  importAssets(assets: Asset[]): Promise<Asset[]>; // appends, like the Excel import
  clearAssets(): Promise<Asset[]>; // returns []
}

// The only place that needs to change to point at a server-backed implementation later.
export const assetService: AssetService = localAssetService;
