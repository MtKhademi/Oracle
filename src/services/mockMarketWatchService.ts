import type { MarketItem, MarketSnapshot, MarketWatchService } from './marketWatchService';

// Entirely MOCK data — no real market feed. Independent from
// priceService.ts/mockPriceService.ts (see marketWatchService.ts) — only
// drives the read-only "چشم بازار" list, never the portfolio total or
// AssetRow's live-priced assets.
const REFRESH_INTERVAL_MS = 60000;

// Each item's jitterToman is a fixed absolute toman range applied each tick
// (same fixed-amount pattern as mockPriceService.ts), sized to roughly
// 0.1%-1% of the item's starting price — proportional to its typical
// volatility. Fixed-income fund units get a much smaller ±0.05% range since
// they barely move tick to tick in real life.
type SeedItem = MarketItem & { jitterToman: number };

const seedItems: SeedItem[] = [
  // currency
  { id: 'usdt', name: 'تتر', category: 'currency', priceToman: 230000, jitterToman: 230 }, // ≈0.1%
  { id: 'usd', name: 'دلار', category: 'currency', priceToman: 230000, jitterToman: 230 }, // ≈0.1%
  { id: 'btc', name: 'بیت‌کوین', category: 'currency', priceToman: 10500000000, jitterToman: 52500000 }, // ≈0.5%
  { id: 'eth', name: 'اتریوم', category: 'currency', priceToman: 360000000, jitterToman: 1800000 }, // ≈0.5%
  // gold
  { id: 'gold-18', name: 'طلای ۱۸ عیار', category: 'gold', priceToman: 20800000, jitterToman: 104000 }, // ≈0.5%
  { id: 'gold-24', name: 'طلای ۲۴ عیار', category: 'gold', priceToman: 27700000, jitterToman: 138500 }, // ≈0.5%
  { id: 'coin-emami', name: 'سکه امامی', category: 'gold', priceToman: 320000000, jitterToman: 1600000 }, // ≈0.5%
  { id: 'coin-half', name: 'نیم سکه', category: 'gold', priceToman: 160000000, jitterToman: 800000 }, // ≈0.5%
  { id: 'coin-quarter', name: 'ربع سکه', category: 'gold', priceToman: 85000000, jitterToman: 425000 }, // ≈0.5%
  { id: 'silver', name: 'نقره آبشده', category: 'gold', priceToman: 900000, jitterToman: 9000 }, // ≈1%
  // stock
  { id: 'fund-mofid-gold', name: 'صندوق طلای عیار (مفید)', category: 'stock', priceToman: 28500, jitterToman: 285 }, // ≈1%
  { id: 'fameli', name: 'فملی', category: 'stock', priceToman: 8500, jitterToman: 85 }, // ≈1%
  // fixed-income — much smaller jitter, fund units barely move tick to tick
  { id: 'pishtaz', name: 'صندوق پیشتاز', category: 'fixed-income', priceToman: 57000, jitterToman: 28.5 }, // ≈0.05%
  { id: 'pishro-mofid', name: 'صندوق پیشرو مفید', category: 'fixed-income', priceToman: 34000, jitterToman: 17 }, // ≈0.05%
];

let current: MarketSnapshot = {
  items: seedItems.map(({ jitterToman: _jitterToman, ...item }) => item),
  updatedAt: Date.now(),
};

const subscribers = new Set<(snapshot: MarketSnapshot) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

// Fixed absolute-amount jitter per item (not percentage-based at tick time —
// each item's fixed jitterToman range was itself derived proportionally from
// its starting price, see seedItems above). Shared by the 60s interval tick
// and the manual refreshNow() so both apply the exact same jitter step.
function jitterStep(): MarketSnapshot {
  current = {
    items: seedItems.map(seed => {
      const previous = current.items.find(item => item.id === seed.id);
      const price = previous ? previous.priceToman : seed.priceToman;
      return {
        id: seed.id,
        name: seed.name,
        category: seed.category,
        priceToman: price + (Math.random() * seed.jitterToman * 2 - seed.jitterToman),
      };
    }),
    updatedAt: Date.now(),
  };
  return current;
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
    return current;
  },

  subscribe(callback) {
    subscribers.add(callback);
    ensureInterval();
    callback(current); // call back immediately with the current values
    return () => {
      subscribers.delete(callback);
      stopIntervalIfIdle(); // avoid leaking the timer when no UI is mounted
    };
  },

  async refreshNow() {
    // Same jitter step as a normal tick, run immediately, without touching
    // the 60-second interval timer.
    jitterStep();
    notifySubscribers();
    return current;
  },
};
