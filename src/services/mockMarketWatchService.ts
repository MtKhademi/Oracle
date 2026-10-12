import { loadCatalog } from './assetCatalog';
import type { MarketItem, MarketSnapshot, MarketWatchService } from './marketWatchService';

// Server-driven market watch feed: item identity (symbol/name/category) comes
// from `GET /oracle/api/market/assets` (via assetCatalog.ts); prices are
// seeded deterministically per item and jitted in place every 60s — the
// backend exposes no price endpoint yet, so the numbers themselves remain
// mocks. Independent from priceService.ts/mockPriceService.ts, which only
// drive the portfolio total's USD/gold-gram conversions and AssetRow's
// GOLD18/USDT live pricing.
const REFRESH_INTERVAL_MS = 60000;

// Small deterministic pseudo-random in [0, 1) from a string seed — used for
// the starting price so the same item always starts at the same value.
function seededFraction(seed: string): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  const sin = Math.sin(hash) * 10000;
  return sin - Math.floor(sin);
}

// Rough starting toman value per unit, keyed by symbol or category.
function seededPriceToman(item: { symbol: string; category: string }): number {
  switch (item.symbol) {
    case 'USD':
      return 42000;
    case 'EUR':
    case 'AUD':
    case 'CAD':
      return 45000;
    case 'USDT':
    case 'USDC':
      return 42000;
    case 'BTC':
      return 350000000000;
    case 'ETH':
      return 11500000000;
    case 'BNB':
      return 1200000000;
    case 'GOLD18':
      return 48000000;
    case 'GOLD24':
      return 64000000;
    case 'GOLD-MESGHAL':
      return 185000000;
    case 'SILVER-GRAM':
      return 1200000;
    case 'COIN-EMAMI':
      return 650000000;
    case 'COIN-BAHAR':
      return 780000000;
    case 'COIN-HALF':
      return 330000000;
    case 'COIN-QUARTER':
      return 170000000;
    case 'COIN-GRAM':
      return 9000000;
    case 'CASH-TOMAN':
      return 1;
    default:
      break;
  }
  if (item.category === 'gold') return 50000000;
  if (item.category === 'silver') return 1000000;
  if (item.category === 'fund') return 30000;
  if (item.category === 'stock') return 12000;
  if (item.category === 'index') return 2000000;
  if (item.category === 'crypto') return 1000000000;
  if (item.category === 'currency') return 42000;
  if (item.category === 'cash') return 1;
  return 100000;
}

// Fixed absolute toman jitter range per ~60s tick (±0.5% of the start value,
// minimum 1 toman) — sized proportionally so index values and 1-toman cash
// don't get the same absolute nudge.
function jitterTomanFor(item: { symbol: string; category: string }): number {
  return Math.max(1, Math.round(seededPriceToman(item) * 0.005));
}

type LiveItem = { id: string; name: string; category: MarketItem['category']; priceToman: number; jitterToman: number };

let liveItems: LiveItem[] = [];
let current: MarketSnapshot = { items: [], updatedAt: Date.now() };
const subscribers = new Set<(snapshot: MarketSnapshot) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let catalogLoadFailed = false;

function toMarketItem(item: LiveItem): MarketItem {
  return { id: item.id, name: item.name, category: item.category, priceToman: item.priceToman };
}

// Loads the server catalog once and (re)seeds the live items. Existing live
// items keep their (jittered) price when their catalog entry is still
// present; new entries are seeded at their starting value; entries removed
// from the catalog are dropped.
function seedFromCatalog() {
  return loadCatalog().then(catalogAssets => {
    catalogLoadFailed = false;
    const bySymbol = new Map(liveItems.map(item => [item.id, item]));
    liveItems = catalogAssets
      .filter(asset => asset.symbol !== 'CASH-TOMAN' || asset.category === 'cash')
      .map(asset => {
        const previous = bySymbol.get(asset.symbol);
        return {
          id: asset.symbol,
          name: asset.name,
          category: asset.category as MarketItem['category'],
          priceToman: previous ? previous.priceToman : seededPriceToman(asset),
          jitterToman: jitterTomanFor(asset),
        };
      });
    current = { items: liveItems.map(toMarketItem), updatedAt: Date.now() };
  }).catch(error => {
    catalogLoadFailed = true;
    console.error('Failed to load market catalog:', error);
  });
}

function jitterStep() {
  liveItems = liveItems.map(item => ({
    ...item,
    priceToman: item.priceToman + (Math.random() * item.jitterToman * 2 - item.jitterToman),
  }));
  current = { items: liveItems.map(toMarketItem), updatedAt: Date.now() };
}

function notifySubscribers() {
  for (const callback of subscribers) callback(current);
}

function tick() {
  jitterStep();
  notifySubscribers();
}

function ensureInterval() {
  if (intervalId === null) {
    intervalId = setInterval(tick, REFRESH_INTERVAL_MS);
  }
}

function stopIntervalIfIdle() {
  if (subscribers.size === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const mockMarketWatchService: MarketWatchService = {
  async getSnapshot() {
    if (liveItems.length === 0) await seedFromCatalog();
    return current;
  },

  subscribe(callback) {
    subscribers.add(callback);
    ensureInterval();
    void seedFromCatalog().then(() => {
      if (subscribers.has(callback)) {
        callback(current);
        notifySubscribers();
      }
    });
    return () => {
      subscribers.delete(callback);
      stopIntervalIfIdle();
    };
  },

  async refreshNow() {
    // Re-sync items with the server catalog, then apply one jitter step.
    await seedFromCatalog();
    if (!catalogLoadFailed) {
      jitterStep();
      notifySubscribers();
    }
    return current;
  },

  async getAllItems() {
    // The full catalog (no jitter) — used for picking an item to watch,
    // independent of the live snapshot timing.
    if (liveItems.length === 0) await seedFromCatalog();
    return liveItems.map(toMarketItem);
  },
};
