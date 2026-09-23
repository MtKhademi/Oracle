import type { Asset } from '../assets';
import { loadAssets, saveAssets } from '../storage';
import type { AssetService } from './assetService';

export const localAssetService: AssetService = {
  async listAssets() {
    return loadAssets();
  },

  async addAsset(asset) {
    const current = loadAssets() ?? [];
    const next = [...current, asset];
    saveAssets(next);
    return next;
  },

  async updateAsset(id, changes) {
    const current = loadAssets() ?? [];
    const next = current.map(asset => (asset.id === id ? { ...asset, ...changes } : asset));
    saveAssets(next);
    return next;
  },

  async deleteAsset(id) {
    const current = loadAssets() ?? [];
    const next = current.filter(asset => asset.id !== id);
    saveAssets(next);
    return next;
  },

  async importAssets(assets: Asset[]) {
    const current = loadAssets() ?? [];
    const next = [...current, ...assets];
    saveAssets(next);
    return next;
  },

  async clearAssets() {
    saveAssets([]);
    return [];
  },
};
