import { loadServerToken } from '../authStorage';
import { loadWalletAccounts, saveWalletAccounts } from '../walletStorage';
import type { WalletAccount, WalletService } from './walletService';

type BankAccountResponse = {
  id: string;
  bankCode: string;
  accountNumberMasked: string | null;
  ibanMasked: string;
  cardNumberMasked: string | null;
  title: string | null;
  isDefault: boolean;
};

type BankAccountRequest = {
  bankCode: string | null;
  accountNumber: string | null;
  iban: string | null;
  cardNumber: string | null;
  title: string | null;
  isDefault: boolean;
};

function authorizationHeaders(): HeadersInit {
  const token = loadServerToken();
  if (!token) throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...authorizationHeaders(), ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; title?: string; errors?: Record<string, string[]> } | null;
    if (response.status === 401) throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
    if (response.status === 409) throw new Error('این حساب بانکی قبلاً ثبت شده است');
    const validationMessages = body?.errors ? Object.values(body.errors).flat().join(' ') : '';
    throw new Error(validationMessages || body?.detail || body?.title || `عملیات حساب بانکی انجام نشد (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : await response.json() as T;
}

function toRequest(account: Omit<WalletAccount, 'id'>): BankAccountRequest {
  return {
    bankCode: account.bankName ?? null,
    accountNumber: account.accountNumber ?? null,
    iban: account.shebaNumber ?? null,
    cardNumber: account.cardNumber ?? null,
    title: account.name || null,
    isDefault: false,
  };
}

function toWalletAccount(apiAccount: BankAccountResponse, cached?: WalletAccount): WalletAccount {
  return {
    id: apiAccount.id,
    name: apiAccount.title ?? 'حساب بانکی',
    balance: cached?.balance ?? 0,
    bankName: apiAccount.bankCode || undefined,
    cardNumber: cached?.cardNumber ?? apiAccount.cardNumberMasked ?? undefined,
    accountNumber: cached?.accountNumber ?? apiAccount.accountNumberMasked ?? undefined,
    shebaNumber: cached?.shebaNumber ?? apiAccount.ibanMasked ?? undefined,
    cardPin1: cached?.cardPin1,
    cardPin2: cached?.cardPin2,
  };
}

async function listRemoteAccounts(): Promise<WalletAccount[]> {
  const cached = loadWalletAccounts() ?? [];
  const localCash = cached.filter(account => account.name === 'نقدی');
  const remote = await request<BankAccountResponse[]>('/oracle/api/me/bank-accounts');
  const accounts = remote.map(account => toWalletAccount(account, cached.find(cachedAccount => cachedAccount.id === account.id)));
  saveWalletAccounts([...localCash, ...accounts]);
  return [...localCash, ...accounts];
}

function requireCachedDetails(account: WalletAccount): WalletAccount {
  const hasMaskedValue = [account.cardNumber, account.accountNumber, account.shebaNumber].some(value => value?.includes('*'));
  if (hasMaskedValue) throw new Error('برای ویرایش این حساب، شماره‌های کامل را دوباره وارد کنید.');
  return account;
}

export const serverWalletService: WalletService = {
  async listAccounts() {
    try {
      return await listRemoteAccounts();
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      return loadWalletAccounts();
    }
  },

  async addAccount(account) {
    if (account.name === 'نقدی') {
      const current = loadWalletAccounts() ?? [];
      const next = [...current, { ...account, id: crypto.randomUUID() }];
      saveWalletAccounts(next);
      return next;
    }
    const created = await request<BankAccountResponse>('/oracle/api/me/bank-accounts', { method: 'POST', body: JSON.stringify(toRequest(account)) });
    const current = loadWalletAccounts() ?? [];
    const next = [...current.filter(item => item.id !== created.id), { ...account, id: created.id }];
    saveWalletAccounts(next);
    return listRemoteAccounts();
  },

  async updateAccount(id, changes) {
    const current = loadWalletAccounts() ?? [];
    const existing = current.find(account => account.id === id);
    if (!existing) throw new Error('حساب پیدا نشد');
    const updated = { ...existing, ...changes };
    if (updated.name !== 'نقدی' && Object.keys(changes).some(key => key !== 'balance' && key !== 'cardPin1' && key !== 'cardPin2')) {
      await request<BankAccountResponse>(`/oracle/api/me/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(toRequest(requireCachedDetails(updated))) });
    }
    const next = current.map(account => account.id === id ? updated : account);
    saveWalletAccounts(next);
    return updated.name === 'نقدی' ? next : listRemoteAccounts();
  },

  async deleteAccount(id) {
    const current = loadWalletAccounts() ?? [];
    const existing = current.find(account => account.id === id);
    if (!existing) return current;
    if (existing.name !== 'نقدی') await request<void>(`/oracle/api/me/bank-accounts/${id}`, { method: 'DELETE' });
    const next = current.filter(account => account.id !== id);
    saveWalletAccounts(next);
    return existing.name === 'نقدی' ? next : listRemoteAccounts();
  },
};
