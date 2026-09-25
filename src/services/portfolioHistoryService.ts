import { localPortfolioHistoryService } from './localPortfolioHistoryService';

export type PortfolioSnapshot = {
  date: string; // ISO date, YYYY-MM-DD
  totalToman: number;
  usdToman: number;
  goldGramToman: number;
};

export interface PortfolioHistoryService {
  listHistory(): Promise<PortfolioSnapshot[]>; // oldest first
  recordSnapshotIfNeeded(totalToman: number, usdToman: number, goldGramToman: number): Promise<void>;
  seedMockHistoryIfEmpty(totalToman: number, usdToman: number, goldGramToman: number): Promise<void>;
}

export const portfolioHistoryService: PortfolioHistoryService = localPortfolioHistoryService;
