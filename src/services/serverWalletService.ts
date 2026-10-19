import { loadWalletAccounts, saveWalletAccounts } from '../walletStorage';
import { getActiveStorageUserId } from '../userScopedStorage';
import type { WalletAccount, WalletService } from './walletService';
import { oracleRequest } from './oracleApiClient';
import { generateUuidV4 } from '../uuid';

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

const bankCodeAliases: Record<string, string> = {
  'بانک رسالت': 'resalat',
  'رسالت': 'resalat',
  'بانک ملی': 'melli',
  'ملی': 'melli',
  'بانک ملت': 'mellat',
  'ملت': 'mellat',
  'بانک صادرات': 'saderat',
  'صادرات': 'saderat',
  'بانک تجارت': 'tejarat',
  'تجارت': 'tejarat',
  'بانک پاسارگاد': 'pasargad',
  'پاسارگاد': 'pasargad',
  'بانک سامان': 'saman',
  'سامان': 'saman',
  'بانک پارسیان': 'parsian',
  'پارسیان': 'parsian',
  'بانک آینده': 'ayandeh',
  'آینده': 'ayandeh',
  'بانک شهر': 'shahr',
  'شهر': 'shahr',
};

const bankNameByCode: Record<string, string> = Object.fromEntries(
  Object.entries(bankCodeAliases).filter(([name]) => name.startsWith('بانک ')).map(([name, code]) => [code, name]),
);

const persianToAscii: Record<string, string> = {
  ا: 'a', آ: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch', ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's', ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'gh', ک: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n', و: 'v', ه: 'h', ی: 'y', ئ: 'y', ء: 'a', ؤ: 'v', ة: 'h',
};

function normalizeBankName(value: string): string {
  return value.trim().replace(/[\u200c\u200f]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ');
}

function toBankCode(bankName?: string): string | null {
  if (!bankName) return null;
  const normalized = normalizeBankName(bankName);
  if (!normalized) return null;
  if (bankCodeAliases[normalized]) return bankCodeAliases[normalized];

  const asciiInput = normalized.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (/^[a-z0-9-]{2,32}$/.test(asciiInput)) return asciiInput;

  const transliterated = Array.from(normalized.replace(/^بانک\s+/, '')).map(character => persianToAscii[character] ?? (/[a-z0-9]/i.test(character) ? character.toLowerCase() : '')).join('');
  const code = transliterated.replace(/[^a-z0-9-]/g, '').slice(0, 32);
  if (/^[a-z0-9-]{2,32}$/.test(code)) return code;
  throw new Error('نام بانک را وارد کنید؛ کد فنی آن باید دست‌کم دو حرف یا عدد انگلیسی داشته باشد.');
}

const request = oracleRequest;

function toRequest(account: Omit<WalletAccount, 'id'>): BankAccountRequest {
  return {
    bankCode: toBankCode(account.bankName) ?? account.bankCode ?? null,
    accountNumber: account.accountNumber ?? null,
    iban: account.shebaNumber ?? null,
    cardNumber: account.cardNumber ?? null,
    title: account.name || null,
    isDefault: account.isDefault ?? false,
  };
}

function normalizeBankValue(value: string): string {
  return value.toUpperCase().replace(/[X•]/g, '*').replace(/[^A-Z0-9*]/g, '');
}

function cachedValueMatchesMask(cachedValue: string, maskedValue: string): boolean {
  const cached = normalizeBankValue(cachedValue);
  const masked = normalizeBankValue(maskedValue);
  if (!masked.includes('*')) return cached === masked;
  if (masked.replace(/\*/g, '') === '') return false;
  const pattern = masked.split(/\*+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${pattern}$`).test(cached);
}

function resolveBankValue(cachedValue: string | undefined, maskedValue: string | null): string | undefined {
  if (!maskedValue) return undefined;
  if (cachedValue && cachedValueMatchesMask(cachedValue, maskedValue)) return cachedValue;
  return maskedValue;
}

function toWalletAccount(apiAccount: BankAccountResponse, cached?: WalletAccount): WalletAccount {
  const bankCode = apiAccount.bankCode.toLowerCase();
  let cachedBankNameMatches = false;
  try {
    cachedBankNameMatches = Boolean(cached?.bankName && toBankCode(cached.bankName) === bankCode);
  } catch {
    cachedBankNameMatches = false;
  }
  return {
    id: apiAccount.id,
    name: apiAccount.title ?? 'حساب بانکی',
    balance: cached?.balance ?? 0,
    bankName: cachedBankNameMatches ? cached?.bankName : bankNameByCode[bankCode] ?? apiAccount.bankCode,
    bankCode,
    isDefault: apiAccount.isDefault,
    cardNumber: resolveBankValue(cached?.cardNumber, apiAccount.cardNumberMasked),
    accountNumber: resolveBankValue(cached?.accountNumber, apiAccount.accountNumberMasked),
    shebaNumber: resolveBankValue(cached?.shebaNumber, apiAccount.ibanMasked),
    cardPin1: cached?.cardPin1,
    cardCvv: cached?.cardCvv,
    cardExpiry: cached?.cardExpiry,
  };
}

async function listRemoteAccounts(ownerId = getActiveStorageUserId()): Promise<WalletAccount[]> {
  const cached = loadWalletAccounts(ownerId) ?? [];
  const localCash = cached.filter(account => account.name === 'نقدی');
  const remote = await request<BankAccountResponse[]>('/oracle/api/me/bank-accounts');
  const accounts = remote.map(account => toWalletAccount(account, cached.find(cachedAccount => cachedAccount.id === account.id)));
  saveWalletAccounts([...localCash, ...accounts], ownerId);
  return [...localCash, ...accounts];
}

function requireCachedDetails(account: WalletAccount): WalletAccount {
  const hasMaskedValue = [account.cardNumber, account.accountNumber, account.shebaNumber].some(value => value && normalizeBankValue(value).includes('*'));
  if (hasMaskedValue) throw new Error('برای ویرایش این حساب، شماره‌های کامل را دوباره وارد کنید.');
  return account;
}

export const serverWalletService: WalletService = {
  async listAccounts() {
    const ownerId = getActiveStorageUserId();
    return listRemoteAccounts(ownerId);
  },

  async addAccount(account) {
    const ownerId = getActiveStorageUserId();
    if (account.name === 'نقدی') {
      const current = loadWalletAccounts(ownerId) ?? [];
      const next = [...current, { ...account, id: generateUuidV4() }];
      saveWalletAccounts(next, ownerId);
      return next;
    }
    const created = await request<BankAccountResponse>('/oracle/api/me/bank-accounts', { method: 'POST', body: JSON.stringify(toRequest(account)) });
    const current = loadWalletAccounts(ownerId) ?? [];
    const next = [...current.filter(item => item.id !== created.id), { ...account, id: created.id }];
    saveWalletAccounts(next, ownerId);
    return listRemoteAccounts(ownerId);
  },

  async updateAccount(id, changes) {
    const ownerId = getActiveStorageUserId();
    const current = loadWalletAccounts(ownerId) ?? [];
    const existing = current.find(account => account.id === id);
    if (!existing) throw new Error('حساب پیدا نشد');
    const updated = { ...existing, ...changes };
    if (updated.name !== 'نقدی' && Object.keys(changes).some(key => key !== 'balance' && key !== 'cardPin1' && key !== 'cardCvv' && key !== 'cardExpiry')) {
      await request<BankAccountResponse>(`/oracle/api/me/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(toRequest(requireCachedDetails(updated))) });
    }
    const next = current.map(account => account.id === id ? updated : account);
    saveWalletAccounts(next, ownerId);
    return updated.name === 'نقدی' ? next : listRemoteAccounts(ownerId);
  },

  async deleteAccount(id) {
    const ownerId = getActiveStorageUserId();
    const current = loadWalletAccounts(ownerId) ?? [];
    const existing = current.find(account => account.id === id);
    if (!existing) return current;
    if (existing.name !== 'نقدی') await request<void>(`/oracle/api/me/bank-accounts/${id}`, { method: 'DELETE' });
    const next = current.filter(account => account.id !== id);
    saveWalletAccounts(next, ownerId);
    return existing.name === 'نقدی' ? next : listRemoteAccounts(ownerId);
  },
};
