import { expireServerSession, loadServerToken } from '../authStorage';
import type { LivePriceQuote, LivePrices, PriceService } from './priceService';

const REFRESH_INTERVAL_MS = 60000;

// The price API currently persists TGJU's provider symbol, while the asset
// catalog uses GOLD18. Keep that boundary explicit until the backend exposes
// one canonical symbol in both contracts.
const requestedProviderSymbols = ['geram18'] as const;
const assetSymbolByProviderSymbol: Readonly<Record<string, string>> = {
  geram18: 'GOLD18',
};

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

function toQuote(response: MarketPriceResponse): LivePriceQuote | null {
  const providerSymbol = response.symbol.trim().toLowerCase();
  const assetSymbol = assetSymbolByProviderSymbol[providerSymbol];
  if (!assetSymbol) return null;
  const numericPrice = Number(response.price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) throw new Error('قیمت نامعتبر از سرور دریافت شد');
  return {
    assetSymbol,
    providerSymbol,
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

  const query = new URLSearchParams({ symbols: requestedProviderSymbols.join(',') });
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
  const quotes = data.map(toQuote).filter((quote): quote is LivePriceQuote => quote !== null);
  if (quotes.length === 0) throw new Error('سرور برای نمادهای پشتیبانی‌شده قیمتی برنگرداند');
  const bySymbol = Object.fromEntries(quotes.map(quote => [quote.assetSymbol, quote]));
  return { quotes: bySymbol, updatedAt: Math.max(...quotes.map(quote => quote.observedAt)) };
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
