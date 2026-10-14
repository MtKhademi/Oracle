import { loadPortfolioHistory, savePortfolioHistory } from '../portfolioHistoryStorage';
import type { PortfolioHistoryService, PortfolioSnapshot } from './portfolioHistoryService';

const MAX_HISTORY_ENTRIES = 90;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const localPortfolioHistoryService: PortfolioHistoryService = {
  async listHistory() {
    return loadPortfolioHistory();
  },

  async recordSnapshotIfNeeded(totalToman, usdToman, goldGramToman) {
    const today = todayIsoDate();
    const history = loadPortfolioHistory();
    const todayIndex = history.findIndex(snapshot => snapshot.date === today);
    const todaySnapshot: PortfolioSnapshot = { date: today, totalToman, usdToman, goldGramToman };
    let next: PortfolioSnapshot[];
    if (todayIndex === -1) {
      next = [...history, todaySnapshot];
    } else {
      next = history.map((snapshot, i) => (i === todayIndex ? todaySnapshot : snapshot));
    }
    if (next.length > MAX_HISTORY_ENTRIES) {
      next = next.slice(next.length - MAX_HISTORY_ENTRIES);
    }
    savePortfolioHistory(next);
  },
};
