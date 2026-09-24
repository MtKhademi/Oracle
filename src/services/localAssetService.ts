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
    const next = [...(loadAssets() ?? [])];
    let added = 0;
    let updated = 0;
    for (const imported of assets) {
      const existingIndex = imported.code ? next.findIndex(asset => asset.code === imported.code) : -1;
      if (existingIndex === -1) {
        next.push(imported);
        added++;
      } else {
        next[existingIndex] = { ...next[existingIndex], quantity: imported.quantity, unitPrice: imported.unitPrice };
        updated++;
      }
    }
    saveAssets(next);
    return { assets: next, added, updated };
  },

  async clearAssets() {
    saveAssets([]);
    return [];
  },
};
