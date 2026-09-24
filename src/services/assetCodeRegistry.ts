import type { Asset } from '../assets';

// Maps an asset's icon/category to the code prefix used in its permanent
// identity code (see getOrCreateCode below).
const prefixByIcon: Record<Asset['icon'], string> = {
  gold: 'GOLD',
  fund: 'FUND',
  cash: 'CASH',
  usdt: 'USDT',
  btc: 'BTC',
  eth: 'ETH',
  other: 'OTHR',
};

const COUNTERS_KEY = 'oracle_code_counters_v1';
const REGISTRY_KEY = 'oracle_asset_registry_v1';

// { GOLD: 2, USDT: 1, ... } — highest NNNN already issued per prefix.
type CounterMap = Record<string, number>;

// `${category}|${name.trim().toLowerCase()}` -> already-assigned code.
type RegistryMap = Record<string, string>;

function loadCounters(): CounterMap {
  try {
    const raw = localStorage.getItem(COUNTERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCounters(counters: CounterMap): void {
  try {
    localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}

function loadRegistry(): RegistryMap {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveRegistry(registry: RegistryMap): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    // storage blocked or full — ignore, in-memory state still works
  }
}

function identityKey(category: Asset['icon'], name: string): string {
  return `${category}|${name.trim().toLowerCase()}`;
}

// Returns the permanent `<PREFIX>-<NNNN>` code for a given asset identity
// (category + name), e.g. `GOLD-0001`. If this exact category+name has
// already been assigned a code, that same code is returned again — so the
// same real-world asset always maps to the same record across separate
// Excel imports or manual re-entry. Otherwise a new code is generated (next
// unused number for that category's prefix) and permanently recorded.
export function getOrCreateCode(category: Asset['icon'], name: string): string {
  const key = identityKey(category, name);
  const registry = loadRegistry();
  const existing = registry[key];
  if (existing) return existing;

  const prefix = prefixByIcon[category];
  const counters = loadCounters();
  const nextNumber = (counters[prefix] ?? 0) + 1;
  const code = `${prefix}-${String(nextNumber).padStart(4, '0')}`;

  counters[prefix] = nextNumber;
  saveCounters(counters);

  registry[key] = code;
  saveRegistry(registry);

  return code;
}
