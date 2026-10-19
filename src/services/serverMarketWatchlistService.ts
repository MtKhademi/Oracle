import { oracleRequest } from './oracleApiClient';
import { loadServerToken } from '../authStorage';
import type { MarketWatchlistService } from './marketWatchlistService';

type WatchlistItemResponse = { symbol: string };

let cachedIds: string[] | null = null;
let pending: Promise<string[]> | null = null;
let cachedToken: string | null = null;

async function fetchIds(): Promise<string[]> {
  const response = await oracleRequest<WatchlistItemResponse[]>('/oracle/api/me/watchlist');
  if (!Array.isArray(response) || response.some(item => typeof item?.symbol !== 'string')) {
    throw new Error('پاسخ چشم بازار از سرور نامعتبر است');
  }
  return response.map(item => item.symbol);
}

function loadIds(): Promise<string[]> {
  const token = loadServerToken();
  if (cachedToken !== token) {
    cachedToken = token;
    cachedIds = null;
  }
  if (cachedIds) return Promise.resolve(cachedIds);
  if (!pending) {
    pending = fetchIds().then(ids => {
      cachedIds = ids;
      return ids;
    }).finally(() => { pending = null; });
  }
  return pending;
}

export const serverMarketWatchlistService: MarketWatchlistService = {
  getWatchedIds: loadIds,

  async addItem(id) {
    await oracleRequest<WatchlistItemResponse>('/oracle/api/me/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol: id }),
    });
    const current = await loadIds();
    cachedIds = current.includes(id) ? current : [...current, id];
    return cachedIds;
  },

  async removeItem(id) {
    await oracleRequest<void>(`/oracle/api/me/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const current = await loadIds();
    cachedIds = current.filter(watchedId => watchedId !== id);
    return cachedIds;
  },
};
