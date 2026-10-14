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

export interface PriceService {
  getPrices(): Promise<LivePrices>;
  subscribe(callback: (prices: LivePrices) => void, onError?: (error: Error) => void): () => void;
  refreshNow(): Promise<LivePrices>;
}

export const priceService: PriceService = serverPriceService;
