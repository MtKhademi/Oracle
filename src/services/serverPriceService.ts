import { expireServerSession, loadServerToken } from '../authStorage';
import { loadWatchedMarketItemIds } from '../storage';
import { loadCatalog, type CatalogAsset } from './assetCatalog';
import type { LivePriceQuote, LivePrices, PriceService } from './priceService';

const REFRESH_INTERVAL_MS = 60000;

type MarketPriceResponse = {
  symbol: string;
  price: number | string;
  currency: string;
  unit: string;
  source: string;
  priceChangedAtUtc: string;
  lastObservedAtUtc: string;
};

let current: LivePrices | null = null;
let pendingRefresh: Promise<LivePrices> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
const subscribers = new Map<(prices: LivePrices) => void, ((error: Error) => void) | undefined>();

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error('دریافت قیمت‌های لحظه‌ای انجام نشد');
}

function toToman(price: number, currency: string): number {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (normalizedCurrency === 'IRR') return price / 10;
  if (normalizedCurrency === 'IRT' || normalizedCurrency === 'TOMAN') return price;
  throw new Error(`واحد پول قیمت پشتیبانی نمی‌شود: ${currency}`);
}

function parseTimestamp(value: string, fieldName: string): number {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) throw new Error(`زمان نامعتبر در ${fieldName}`);
  return timestamp;
}

function toQuote(response: MarketPriceResponse, catalogBySymbol: ReadonlyMap<string, CatalogAsset>): LivePriceQuote | null {
  const providerSymbol = response.symbol.trim();
  const catalogAsset = catalogBySymbol.get(providerSymbol.toUpperCase());
  if (!catalogAsset) return null;
  const numericPrice = Number(response.price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) throw new Error('قیمت نامعتبر از سرور دریافت شد');
  return {
    assetSymbol: catalogAsset.symbol,
    providerSymbol: providerSymbol.toLowerCase(),
    priceToman: toToman(numericPrice, response.currency),
    unit: response.unit,
    source: response.source,
    priceChangedAt: parseTimestamp(response.priceChangedAtUtc, 'priceChangedAtUtc'),
    observedAt: parseTimestamp(response.lastObservedAtUtc, 'lastObservedAtUtc'),
  };
}

async function fetchPrices(): Promise<LivePrices> {
  const token = loadServerToken();
  if (!token) {
    expireServerSession();
    throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  }

  const catalog = await loadCatalog();
  const catalogBySymbol = new Map(catalog.map(asset => [asset.symbol.toUpperCase(), asset]));
  const watchedIds = loadWatchedMarketItemIds() ?? catalog.map(asset => asset.symbol);
  const requestedSymbols = watchedIds
    .map(id => catalog.find(asset => asset.id === id || asset.symbol === id)?.symbol)
    .filter((symbol): symbol is string => Boolean(symbol));
  if (requestedSymbols.length === 0) return { quotes: {}, updatedAt: null };

  const query = new URLSearchParams({ symbols: requestedSymbols.join(',') });
  const response = await fetch(`/oracle/api/market/prices?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) {
      expireServerSession();
      throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
    }
    if (response.status === 404) return { quotes: {}, updatedAt: null };
    throw new Error(`دریافت قیمت‌های لحظه‌ای انجام نشد (${response.status})`);
  }

  const data = await response.json() as MarketPriceResponse[];
  if (!Array.isArray(data)) throw new Error('پاسخ قیمت‌های لحظه‌ای نامعتبر است');
  const quotes = data.map(response => toQuote(response, catalogBySymbol)).filter((quote): quote is LivePriceQuote => quote !== null);
  const bySymbol = Object.fromEntries(quotes.map(quote => [quote.assetSymbol, quote]));
  return { quotes: bySymbol, updatedAt: quotes.length > 0 ? Math.max(...quotes.map(quote => quote.observedAt)) : null };
}

function notifySubscribers(prices: LivePrices) {
  for (const callback of subscribers.keys()) callback(prices);
}

function notifyErrors(error: Error) {
  for (const onError of subscribers.values()) onError?.(error);
}

function refresh(): Promise<LivePrices> {
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = fetchPrices()
    .then(prices => {
      current = prices;
      notifySubscribers(prices);
      return prices;
    })
    .catch(error => {
      const normalizedError = asError(error);
      notifyErrors(normalizedError);
      throw normalizedError;
    })
    .finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}

function ensureInterval() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => { void refresh().catch(() => undefined); }, REFRESH_INTERVAL_MS);
}

function stopIntervalIfIdle() {
  if (subscribers.size > 0 || intervalId === null) return;
  clearInterval(intervalId);
  intervalId = null;
}

export const serverPriceService: PriceService = {
  getPrices() {
    return current ? Promise.resolve(current) : refresh();
  },

  subscribe(callback, onError) {
    subscribers.set(callback, onError);
    ensureInterval();
    if (current) callback(current);
    void refresh().catch(() => undefined);
    return () => {
      subscribers.delete(callback);
      stopIntervalIfIdle();
    };
  },

  refreshNow() {
    return refresh();
  },
};
