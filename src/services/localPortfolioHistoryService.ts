import { loadPortfolioHistory, savePortfolioHistory } from '../portfolioHistoryStorage';
import type { PortfolioHistoryService, PortfolioSnapshot } from './portfolioHistoryService';

const MAX_HISTORY_ENTRIES = 90;
const BACKFILL_DAYS = 30;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Nudges `value` by a random percentage within ±maxPercent (e.g. maxPercent=1
// means the result is value * (1 + r) for r in [-0.01, 0.01]).
function jitterByPercent(value: number, maxPercent: number): number {
  const r = (Math.random() * 2 - 1) * (maxPercent / 100);
  return value * (1 + r);
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

  async seedMockHistoryIfEmpty(totalToman, usdToman, goldGramToman) {
    const history = loadPortfolioHistory();
    if (history.length > 0) return;

    // Work backwards from today's values, one synthetic day at a time, for
    // BACKFILL_DAYS days ending yesterday (today's real snapshot is recorded
    // separately via recordSnapshotIfNeeded).
    const generated: PortfolioSnapshot[] = [];
    let runningTotal = totalToman;
    let runningUsd = usdToman;
    let runningGold = goldGramToman;
    const today = new Date();
    for (let daysAgo = 1; daysAgo <= BACKFILL_DAYS; daysAgo++) {
      runningTotal = jitterByPercent(runningTotal, 2);
      runningUsd = jitterByPercent(runningUsd, 0.3);
      runningGold = jitterByPercent(runningGold, 1);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const iso = date.toISOString().slice(0, 10);
      generated.push({ date: iso, totalToman: runningTotal, usdToman: runningUsd, goldGramToman: runningGold });
    }
    generated.reverse(); // oldest first
    savePortfolioHistory(generated);
  },
};
