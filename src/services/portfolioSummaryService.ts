import { oracleRequest } from './oracleApiClient';

export type PortfolioValuationStatus = 'empty' | 'current' | 'stale' | 'missing';

export type PortfolioSummary = {
  marketValueToman: number;
  investedValueToman: number;
  unrealizedProfitLossToman: number;
  valuationStatus: PortfolioValuationStatus;
  latestPriceObservedAtUtc: string | null;
  generatedAtUtc: string;
  positions: Array<{
    symbol: string;
    quantity: number;
    marketValueToman: number | null;
    priceStatus: 'current' | 'stale' | 'missing';
  }>;
};

type PortfolioSummaryResponse = {
  marketValue: number | string;
  investedValue: number | string;
  unrealizedProfitLoss: number | string;
  valuationStatus: PortfolioValuationStatus;
  latestPriceObservedAtUtc: string | null;
  generatedAtUtc: string;
  positions: Array<{
    symbol: string;
    quantity: number | string;
    marketValue: number | string | null;
    priceStatus: 'current' | 'stale' | 'missing';
  }>;
};

const irrToToman = (value: number | string | null): number | null => value === null ? null : Number(value) / 10;

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await oracleRequest<PortfolioSummaryResponse>('/oracle/api/me/portfolio/summary');
  if (!response || !Array.isArray(response.positions)) throw new Error('پاسخ خلاصهٔ پرتفوی از سرور نامعتبر است');
  return {
    marketValueToman: Number(response.marketValue) / 10,
    investedValueToman: Number(response.investedValue) / 10,
    unrealizedProfitLossToman: Number(response.unrealizedProfitLoss) / 10,
    valuationStatus: response.valuationStatus,
    latestPriceObservedAtUtc: response.latestPriceObservedAtUtc,
    generatedAtUtc: response.generatedAtUtc,
    positions: response.positions.map(position => ({
      symbol: position.symbol,
      quantity: Number(position.quantity),
      marketValueToman: irrToToman(position.marketValue),
      priceStatus: position.priceStatus,
    })),
  };
}
