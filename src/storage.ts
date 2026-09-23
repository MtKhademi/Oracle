import type { Asset } from './assets';

const STORAGE_KEY = 'oracle_assets_v1';

export function loadAssets(): Asset[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAssets(assets: Asset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
