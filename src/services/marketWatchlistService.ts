import { localMarketWatchlistService } from './localMarketWatchlistService';

// The personal "چشم بازار" watchlist — which of the fixed market catalog's
// ids (see marketWatchService.ts's getAllItems()) the owner has chosen to
// keep watching (see AI-KNOWLEDGE.md §6r). Same singleton-swap pattern as
// assetService.ts (§6d): this is the only line that needs to change to point
// at a server-backed implementation later.
export interface MarketWatchlistService {
  getWatchedIds(): Promise<string[]>;
  addItem(id: string): Promise<string[]>;
  removeItem(id: string): Promise<string[]>;
}

export const marketWatchlistService: MarketWatchlistService = localMarketWatchlistService;
