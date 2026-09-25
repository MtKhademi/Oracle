import type { Asset } from '../assets';
import { loadAssets, saveAssets } from '../storage';
import type { AssetService, ImportAssetChange } from './assetService';

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

  async importAssets(assets: Asset[], mode) {
    const next = [...(loadAssets() ?? [])];
    const changes: ImportAssetChange[] = [];
    let added = 0;
    let updated = 0;
    let skippedNoMatch = 0;
    for (const imported of assets) {
      const existingIndex = imported.code ? next.findIndex(asset => asset.code === imported.code) : -1;
      if (mode === 'subtract' && existingIndex === -1) {
        skippedNoMatch++;
        continue;
      }
      if (existingIndex === -1) {
        next.push(imported);
        added++;
        if (mode === 'add') {
          changes.push({ assetId: imported.id, type: 'buy', quantity: imported.quantity, unitPrice: imported.unitPrice });
        }
      } else {
        const existing = next[existingIndex];
        if (mode === 'add') {
          next[existingIndex] = { ...existing, quantity: existing.quantity + imported.quantity, unitPrice: imported.unitPrice };
          changes.push({ assetId: existing.id, type: 'buy', quantity: imported.quantity, unitPrice: imported.unitPrice });
        } else if (mode === 'subtract') {
          next[existingIndex] = { ...existing, quantity: Math.max(0, existing.quantity - imported.quantity) };
          changes.push({ assetId: existing.id, type: 'sell', quantity: imported.quantity, unitPrice: imported.unitPrice });
        } else {
          next[existingIndex] = { ...existing, quantity: imported.quantity, unitPrice: imported.unitPrice };
        }
        updated++;
      }
    }
    saveAssets(next);
    return { assets: next, added, updated, skippedNoMatch, changes };
  },

  async clearAssets() {
    saveAssets([]);
    return [];
  },
};
