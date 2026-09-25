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
  btcToman: 10500000000, // 1 bitcoin ≈ 10,500,000,000 toman (consistent with src/assets.ts's sample BTC row)
  ethToman: 360000000, // 1 ether ≈ 360,000,000 toman (consistent with src/assets.ts's sample ETH row)
  updatedAt: Date.now(),
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
    btcToman: current.btcToman + (Math.random() * 100000000 - 50000000), // ±50,000,000 toman
    ethToman: current.ethToman + (Math.random() * 10000000 - 5000000), // ±5,000,000 toman
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
