import { mockMarketWatchService } from './mockMarketWatchService';

// The "چشم بازار" (market watch) feed. Item identity (symbol/name/category)
// comes from the server catalog (see assetCatalog.ts); prices are still
// mocked — the backend exposes no price endpoint yet. Does not affect
// priceService/mockPriceService, which remain the source of truth for the
// portfolio total's USD/gold-gram conversions and AssetRow's GOLD18/USDT
// live pricing.
export type MarketCategory = 'gold' | 'silver' | 'currency' | 'crypto' | 'fund' | 'stock' | 'index' | 'cash';

export type MarketItem = {
  id: string;
  name: string;
  category: MarketCategory;
  priceToman: number;
};

export type MarketSnapshot = {
  items: MarketItem[];
  updatedAt: number; // Date.now() when these values were last computed
};

export interface MarketWatchService {
  getSnapshot(): Promise<MarketSnapshot>;
  // Calls back immediately with the current snapshot, then again on every
  // refresh (see mockMarketWatchService's ~60s jitter tick). Returns an
  // unsubscribe function.
  subscribe(callback: (snapshot: MarketSnapshot) => void): () => void;
  // Immediately re-computes the snapshot (applying the same jitter step as a
  // normal tick) and notifies all current subscribers, without resetting the
  // 60-second timer.
  refreshNow(): Promise<MarketSnapshot>;
  // The full static catalog of all seeded market items (no jitter — this is
  // only used for picking an item to watch, see marketWatchlistService.ts/
  // AddMarketWatchItemModal.tsx, never for display), independent of the
  // live-jittered snapshot above.
  getAllItems(): Promise<MarketItem[]>;
}

// The only place that needs to change to point at a real server-backed market feed later.
export const marketWatchService: MarketWatchService = mockMarketWatchService;
