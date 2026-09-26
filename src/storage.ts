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

const MARKET_WATCHLIST_STORAGE_KEY = 'oracle_market_watchlist_v1';

// Persists the personal "چشم بازار" watchlist — which of the fixed market
// catalog's ids the owner has chosen to keep watching (see
// AI-KNOWLEDGE.md §6r). Same try/catch-safe, null-on-missing convention as
// loadAssets/saveAssets above; `null` (not `[]`) means "never customized
// yet", so localMarketWatchlistService.ts can tell that apart from an
// explicit empty watchlist.
export function loadWatchedMarketItemIds(): string[] | null {
  try {
    const raw = localStorage.getItem(MARKET_WATCHLIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWatchedMarketItemIds(ids: string[]): void {
  try {
    localStorage.setItem(MARKET_WATCHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
