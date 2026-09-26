import { useCallback, useEffect, useState } from 'react';
import { marketWatchService, type MarketSnapshot } from '../services/marketWatchService';
import { marketWatchlistService } from '../services/marketWatchlistService';

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

// The personal چشم بازار watchlist (see AI-KNOWLEDGE.md §6r): loads the
// watched-id list once on mount via marketWatchlistService.getWatchedIds()
// into local state, and exposes add(id)/remove(id) which call the service
// and update that local state directly from the returned list — so the UI
// reflects the change immediately without a full re-fetch. `watchedIds` is
// null until the initial load resolves.
export function useMarketWatchlist(): { watchedIds: string[] | null; add: (id: string) => void; remove: (id: string) => void } {
  const [watchedIds, setWatchedIds] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    marketWatchlistService.getWatchedIds().then(ids => {
      if (!cancelled) setWatchedIds(ids);
    });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback((id: string) => {
    marketWatchlistService.addItem(id).then(setWatchedIds);
  }, []);

  const remove = useCallback((id: string) => {
    marketWatchlistService.removeItem(id).then(setWatchedIds);
  }, []);

  return { watchedIds, add, remove };
}
