import type { LivePrices, PriceService } from './priceService';

// Starting points chosen to be consistent with the sample data already used
// elsewhere in this app (see src/assets.ts / src/data/assetCatalog.json).
// This is entirely MOCK data — there is no real price feed yet; see
// priceService.ts for the single line that would need to change to swap in a
// server-backed implementation.
const REFRESH_INTERVAL_MS = 60000;

let current: LivePrices = {
  usdToman: 230000, // 1 US dollar ≈ 230,000 toman
  goldGramToman: 24000000, // 1 gram of 18-karat gold ≈ 24,000,000 toman
};

const subscribers = new Set<(prices: LivePrices) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

// Fixed absolute-amount jitter (not percentage-based): each tick nudges the
// price by a random toman amount within a fixed range, regardless of the
// current value. Shared by the 60s interval tick and the manual refreshNow()
// so both apply the exact same jitter step.
function jitterStep(): LivePrices {
  current = {
    usdToman: current.usdToman + (Math.random() * 40 - 20), // ±20 toman
    goldGramToman: current.goldGramToman + (Math.random() * 4000000 - 2000000), // ±2,000,000 toman
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

  async refreshNow() {
    // Same jitter step as a normal tick, run immediately, without touching
    // the 60-second interval timer.
    jitterStep();
    notifySubscribers();
    return current;
  },
};
