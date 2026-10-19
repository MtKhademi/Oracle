import { loadCatalog, type CatalogAsset } from './assetCatalog';
import { isLivePriceStale, priceService, type LivePrices } from './priceService';

export type MarketCategory = 'gold' | 'silver' | 'currency' | 'crypto' | 'fund' | 'stock' | 'index' | 'cash';

export type MarketItem = {
  id: string;
  name: string;
  category: MarketCategory;
  priceToman: number | null;
  observedAt: number | null;
  isStale: boolean;
};

export type MarketSnapshot = {
  items: MarketItem[];
  updatedAt: number | null;
};

export interface MarketWatchService {
  getSnapshot(): Promise<MarketSnapshot>;
  subscribe(callback: (snapshot: MarketSnapshot) => void): () => void;
  refreshNow(): Promise<MarketSnapshot>;
  getAllItems(): Promise<MarketItem[]>;
}

let catalog: CatalogAsset[] | null = null;
let currentPrices: LivePrices | null = null;
let current: MarketSnapshot | null = null;
let priceUnsubscribe: (() => void) | null = null;
let pendingCatalog: Promise<CatalogAsset[]> | null = null;
const subscribers = new Set<(snapshot: MarketSnapshot) => void>();

function isMarketCategory(category: string): category is MarketCategory {
  return ['gold', 'silver', 'currency', 'crypto', 'fund', 'stock', 'index', 'cash'].includes(category);
}

function buildSnapshot(): MarketSnapshot {
  const items = (catalog ?? [])
    .filter(asset => isMarketCategory(asset.category))
    .map(asset => ({
      id: asset.symbol,
      name: asset.name,
      category: asset.category as MarketCategory,
      priceToman: currentPrices?.quotes[asset.symbol]?.priceToman ?? null,
      observedAt: currentPrices?.quotes[asset.symbol]?.observedAt ?? null,
      isStale: currentPrices?.quotes[asset.symbol] ? isLivePriceStale(currentPrices.quotes[asset.symbol].observedAt) : false,
    }));
  current = { items, updatedAt: currentPrices?.updatedAt ?? null };
  return current;
}

function notifySubscribers() {
  const snapshot = buildSnapshot();
  for (const callback of subscribers) callback(snapshot);
}

async function ensureCatalog(): Promise<CatalogAsset[]> {
  if (catalog) return catalog;
  if (!pendingCatalog) {
    pendingCatalog = loadCatalog().then(loaded => {
      catalog = loaded;
      notifySubscribers();
      return loaded;
    }).finally(() => { pendingCatalog = null; });
  }
  return pendingCatalog;
}

function ensurePriceSubscription() {
  if (priceUnsubscribe) return;
  priceUnsubscribe = priceService.subscribe(prices => {
    currentPrices = prices;
    notifySubscribers();
  });
}

function stopPriceSubscriptionIfIdle() {
  if (subscribers.size > 0 || !priceUnsubscribe) return;
  priceUnsubscribe();
  priceUnsubscribe = null;
}

export const marketWatchService: MarketWatchService = {
  async getSnapshot() {
    await ensureCatalog();
    currentPrices = await priceService.getPrices();
    return buildSnapshot();
  },

  subscribe(callback) {
    subscribers.add(callback);
    ensurePriceSubscription();
    if (current) callback(current);
    void ensureCatalog().catch(() => undefined);
    return () => {
      subscribers.delete(callback);
      stopPriceSubscriptionIfIdle();
    };
  },

  async refreshNow() {
    await ensureCatalog();
    currentPrices = await priceService.refreshNow();
    return buildSnapshot();
  },

  async getAllItems() {
    await ensureCatalog();
    return buildSnapshot().items;
  },
};
