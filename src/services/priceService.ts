import { serverPriceService } from './serverPriceService';

export type LivePriceQuote = {
  assetSymbol: string;
  providerSymbol: string;
  priceToman: number;
  unit: string;
  source: string;
  priceChangedAt: number;
  observedAt: number;
};

export type LivePrices = {
  quotes: Readonly<Record<string, LivePriceQuote>>;
  updatedAt: number | null;
};

export const PRICE_STALE_AFTER_MS = 45 * 60 * 1000;

export function isLivePriceStale(observedAt: number, now = Date.now()): boolean {
  return now - observedAt > PRICE_STALE_AFTER_MS;
}

export interface PriceService {
  getPrices(): Promise<LivePrices>;
  subscribe(callback: (prices: LivePrices) => void, onError?: (error: Error) => void): () => void;
  refreshNow(): Promise<LivePrices>;
}

export const priceService: PriceService = serverPriceService;
