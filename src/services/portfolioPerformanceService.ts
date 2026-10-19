import { oracleRequest } from './oracleApiClient';

export type PortfolioPerformancePoint = {
  dateUtc: string;
  marketValueToman: number;
  investedValueToman: number;
  unrealizedProfitLossToman: number;
  valuationStatus: 'current' | 'missing';
};

type PerformanceResponse = {
  points: Array<{
    dateUtc: string;
    marketValue: number | string;
    investedValue: number | string;
    unrealizedProfitLoss: number | string;
    valuationStatus: 'current' | 'missing';
  }>;
};

export async function getPortfolioPerformance(): Promise<PortfolioPerformancePoint[]> {
  const response = await oracleRequest<PerformanceResponse>('/oracle/api/me/portfolio/performance?limit=31');
  if (!response || !Array.isArray(response.points)) throw new Error('پاسخ روند عملکرد از سرور نامعتبر است');
  return response.points.map(point => ({
    dateUtc: point.dateUtc,
    marketValueToman: Number(point.marketValue) / 10,
    investedValueToman: Number(point.investedValue) / 10,
    unrealizedProfitLossToman: Number(point.unrealizedProfitLoss) / 10,
    valuationStatus: point.valuationStatus,
  }));
}
