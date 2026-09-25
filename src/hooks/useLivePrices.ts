import { useEffect, useState } from 'react';
import { priceService, type LivePrices } from '../services/priceService';

// Subscribes to the price service on mount, unsubscribes on unmount.
// Returns null until the first callback arrives (so callers can render a
// loading/placeholder state instead of flashing zeroed-out values).
export function useLivePrices(): LivePrices | null {
  const [prices, setPrices] = useState<LivePrices | null>(null);

  useEffect(() => {
    const unsubscribe = priceService.subscribe(setPrices);
    return unsubscribe;
  }, []);

  return prices;
}
