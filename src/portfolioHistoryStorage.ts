import type { PortfolioSnapshot } from './services/portfolioHistoryService';
import { getUserScopedStorageKey } from './userScopedStorage';

const STORAGE_KEY = 'oracle_portfolio_history_v1';

export function loadPortfolioHistory(): PortfolioSnapshot[] {
  try {
    const raw = localStorage.getItem(getUserScopedStorageKey(STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePortfolioHistory(history: PortfolioSnapshot[]): void {
  try {
    localStorage.setItem(getUserScopedStorageKey(STORAGE_KEY), JSON.stringify(history));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}
