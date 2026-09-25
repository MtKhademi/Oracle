import { useEffect, useState } from 'react';
import { marketWatchService, type MarketSnapshot } from '../services/marketWatchService';

// Subscribes to the market watch service on mount, unsubscribes on unmount.
// Returns null until the first callback arrives (so callers can render a
// loading/placeholder state instead of flashing zeroed-out values). Same
// pattern as useLivePrices.ts, but for the independent چشم بازار feed.
export function useMarketWatch(): MarketSnapshot | null {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    const unsubscribe = marketWatchService.subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  return snapshot;
}
