import { mockPriceService } from './mockPriceService';

export type LivePrices = {
  usdToman: number;      // current price of 1 US dollar, in toman
  goldGramToman: number; // current price of 1 gram of 18-karat gold, in toman
};

export interface PriceService {
  getPrices(): Promise<LivePrices>;
  // Calls back immediately with the current prices, then again on every
  // refresh (see mockPriceService's ~60s jitter tick). Returns an unsubscribe
  // function.
  subscribe(callback: (prices: LivePrices) => void): () => void;
}

// The only place that needs to change to point at a real server-backed price feed later.
export const priceService: PriceService = mockPriceService;
