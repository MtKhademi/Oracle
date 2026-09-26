import { loadWatchedMarketItemIds, saveWatchedMarketItemIds } from '../storage';
import type { MarketWatchlistService } from './marketWatchlistService';
import { marketWatchService } from './marketWatchService';

// Reads the currently watched ids, falling back to ALL catalog ids when
// nothing has been saved yet (see loadWatchedMarketItemIds's null-on-missing
// convention) — so existing users see exactly what they see today (all 14
// items) until they make their first add/remove. Deliberately does NOT
// persist that fallback itself; only addItem/removeItem below ever write to
// storage, so "never customized" (null) stays distinguishable from
// "customized to include everything" (an explicit array with all ids) — see
// AI-KNOWLEDGE.md §6r.
async function readWatchedIds(): Promise<string[]> {
  const stored = loadWatchedMarketItemIds();
  if (stored !== null) return stored;
  const all = await marketWatchService.getAllItems();
  return all.map(item => item.id);
}

export const localMarketWatchlistService: MarketWatchlistService = {
  async getWatchedIds() {
    return readWatchedIds();
  },

  async addItem(id) {
    const current = await readWatchedIds();
    const next = current.includes(id) ? current : [...current, id];
    saveWatchedMarketItemIds(next);
    return next;
  },

  async removeItem(id) {
    const current = await readWatchedIds();
    const next = current.filter(watchedId => watchedId !== id);
    saveWatchedMarketItemIds(next);
    return next;
  },
};
