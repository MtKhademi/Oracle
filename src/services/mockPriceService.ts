import type { LivePrices, PriceService } from './priceService';

// Starting points chosen to be consistent with the sample data already used
// elsewhere in this app (see src/assets.ts / src/data/assetCatalog.json).
// This is entirely MOCK data — there is no real price feed yet; see
// priceService.ts for the single line that would need to change to swap in a
// server-backed implementation.
const REFRESH_INTERVAL_MS = 60000;
const JITTER_RATIO = 0.01; // roughly ±0.5%

let current: LivePrices = {
  usdToman: 1000000,
  goldGramToman: 20000000,
};

const subscribers = new Set<(prices: LivePrices) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function jitter(value: number): number {
  return value * (1 + (Math.random() - 0.5) * JITTER_RATIO);
}

function tick() {
  current = {
    usdToman: jitter(current.usdToman),
    goldGramToman: jitter(current.goldGramToman),
  };
  for (const callback of subscribers) callback(current);
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

export const mockPriceService: PriceService = {
  async getPrices() {
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
};
