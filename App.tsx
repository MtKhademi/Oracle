import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { assets, type Asset } from './src/assets';
import { assetService, type ImportEffectiveType, type ImportMode, type ImportRow } from './src/services/assetService';
import { getOrCreateCode } from './src/services/assetCodeRegistry';
import { getAssetIconForCatalogEntry, getCatalogAssetBySymbol, getUnitLabel } from './src/services/assetCatalog';
import { authService } from './src/services/authService';
import { transactionService } from './src/services/transactionService';
import { getEffectiveUnitPrice } from './src/services/livePriceMapping';
import { portfolioHistoryService } from './src/services/portfolioHistoryService';
import { useLivePrices } from './src/hooks/useLivePrices';
import { format } from './src/format';
import { AddAssetModal } from './src/components/AddAssetModal';
import { ImportModal } from './src/components/ImportModal';
import { AssetRow } from './src/components/AssetRow';
import type { AssetSortMode } from './src/components/AssetSortMenu';
import { AuthScreen } from './src/components/AuthScreen';
import { MarketWatchList } from './src/components/MarketWatchList';
import { PortfolioTrendChart } from './src/components/PortfolioTrendChart';
import { TransactionHistoryModal } from './src/components/TransactionHistoryModal';
import { HamburgerIcon, MarketEyeIcon, WalletIcon } from './src/components/icons';
import { ProfileModal } from './src/components/ProfileModal';
import { SideDrawer } from './src/components/SideDrawer';
import { SummaryCard } from './src/components/SummaryCard';
import { Toolbar } from './src/components/Toolbar';
import type { LivePrices } from './src/services/priceService';
import type { User } from './src/types';

const ASSET_SORT_MODE_STORAGE_KEY = 'oracle_asset_sort_mode_v1';
const ASSET_SORT_MODES: readonly AssetSortMode[] = ['value', 'type'];
const BALANCE_HIDDEN_STORAGE_KEY = 'oracle_balance_hidden_v1';

// Reads the persisted sort-mode choice (see the "دارایی‌های من" sort menu,
// AssetSortMenu.tsx) from localStorage, same try/catch-safe pattern as the
// rest of this app's storage helpers (src/storage.ts etc.) — falls back to
// 'value' (the default) on a missing key, an unrecognized value, or a
// browser that blocks storage.
function readStoredSortMode(): AssetSortMode {
  try {
    const raw = localStorage.getItem(ASSET_SORT_MODE_STORAGE_KEY);
    return (ASSET_SORT_MODES as readonly string[]).includes(raw ?? '') ? (raw as AssetSortMode) : 'value';
  } catch {
    return 'value';
  }
}

// Reads the persisted "hide balance" toggle (see SummaryCard's eye button)
// from localStorage, same try/catch-safe/display-only-preference pattern as
// readStoredSortMode above — falls back to `false` (visible, today's
// behavior) on a missing key or a browser that blocks storage.
function readStoredBalanceHidden(): boolean {
  try {
    return localStorage.getItem(BALANCE_HIDDEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// The toman value of one asset — the same quantity × effective-unit-price
// calculation AssetRow/App.tsx's `total` already use (see
// src/services/livePriceMapping.ts), reused here instead of being
// reimplemented for sorting.
function getAssetTomanValue(asset: Asset, prices: LivePrices | null): number {
  return asset.quantity * getEffectiveUnitPrice(asset, prices);
}

// Sorts the asset list for display only (does not mutate/reorder the stored
// `items` array) according to the owner's chosen sort mode — see the
// "دارایی‌های من" sort menu (AssetSortMenu.tsx) and §6o of AI-KNOWLEDGE.md.
function sortAssetsForDisplay(items: Asset[], sortMode: AssetSortMode, prices: LivePrices | null): Asset[] {
  if (sortMode === 'value') {
    return [...items].sort((a, b) => getAssetTomanValue(b, prices) - getAssetTomanValue(a, prices));
  }
  // 'type': group by the asset's own `icon` field (Asset['icon'], see
  // src/assets.ts — always populated, unlike `code`/the catalog lookup,
  // which only resolves for catalog-driven assets and silently falls back
  // to a single 'other' bucket for every legacy/auto-coded asset — see the
  // 2026-09-26 bug-fix decision-log entry), order groups by total group
  // value descending, and sort assets within each group by their own value
  // descending.
  const groups = new Map<string, Asset[]>();
  for (const asset of items) {
    const categoryId = asset.icon;
    const group = groups.get(categoryId);
    if (group) group.push(asset);
    else groups.set(categoryId, [asset]);
  }
  const orderedGroups = [...groups.entries()].sort(
    ([, aAssets], [, bAssets]) =>
      bAssets.reduce((sum, asset) => sum + getAssetTomanValue(asset, prices), 0) -
      aAssets.reduce((sum, asset) => sum + getAssetTomanValue(asset, prices), 0),
  );
  return orderedGroups.flatMap(([, groupAssets]) => [...groupAssets].sort((a, b) => getAssetTomanValue(b, prices) - getAssetTomanValue(a, prices)));
}

const EXPECTED_IMPORT_HEADERS = ['نماد', 'تعداد', 'قیمت واحد (تومان)'];
const ROW_TYPE_VALUES = ['buy', 'sell', 'replace'] as const;
type RowType = (typeof ROW_TYPE_VALUES)[number];

// One parsed Excel row: the built Asset (catalog-driven) plus its own optional
// per-row type/date overrides (columns 4-5) — `null` means "not specified,
// fall back to the modal's chosen default mode / today's date" (see
// resolveEffectiveType/handleImportFile below).
interface ParsedImportRow {
  asset: Asset;
  rowType: RowType | null;
  rowDate: string | null;
}

// Converts a JS Date cell (openpyxl/xlsx gives Date objects for date-formatted
// cells) to an ISO YYYY-MM-DD string using LOCAL year/month/day — using UTC
// getters here would shift the date by one day for timezones behind UTC.
function formatLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Strictly validates an "YYYY-MM-DD" string represents a real calendar date
// (rejects e.g. "2026-13-40", which `new Date(...)` would otherwise silently
// roll over into a different, unintended date instead of failing).
function parseIsoDateStrict(raw: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return raw;
}

// Resolves the optional تاریخ cell (column 5): `{ date: null, invalid: false }`
// when empty (fall back to today at effective-date resolution time), `{ date,
// invalid: false }` when a valid ISO date or Date object, `{ date: null,
// invalid: true }` when present but unparseable (row must be skipped).
function resolveRowDate(cell: unknown): { date: string | null; invalid: boolean } {
  if (cell instanceof Date) return { date: formatLocalIsoDate(cell), invalid: false };
  const raw = String(cell ?? '').trim();
  if (raw === '') return { date: null, invalid: false };
  const iso = parseIsoDateStrict(raw);
  return iso ? { date: iso, invalid: false } : { date: null, invalid: true };
}

// Resolves the optional نوع cell (column 4): empty -> null (fall back to the
// modal's default mode), a recognized literal -> that type, anything else ->
// invalid (row must be skipped).
function resolveRowType(cell: unknown): { type: RowType | null; invalid: boolean } {
  const raw = String(cell ?? '').trim().toLowerCase();
  if (raw === '') return { type: null, invalid: false };
  if ((ROW_TYPE_VALUES as readonly string[]).includes(raw)) return { type: raw as RowType, invalid: false };
  return { type: null, invalid: true };
}

// New 6-column template: نماد | تعداد | قیمت واحد (تومان) | نوع | تاریخ |
// نام دارایی (فقط نمایشی). Only the first 3 headers are required to match —
// columns 4-6 are optional (may be entirely absent from the header row, or
// present but left empty per row).
function parseImportRows(rows: unknown[][]): { rows: ParsedImportRow[]; skipped: number } | null {
  const header = (rows[0] ?? []).map(cell => String(cell ?? '').trim());
  const headerMatches = header.length >= EXPECTED_IMPORT_HEADERS.length && EXPECTED_IMPORT_HEADERS.every((h, i) => header[i] === h);
  if (!headerMatches) return null;

  const parsed: ParsedImportRow[] = [];
  let skipped = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const isEmpty = row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
    if (isEmpty) break;

    const symbol = String(row[0] ?? '').trim();
    const catalogAsset = getCatalogAssetBySymbol(symbol);
    if (!catalogAsset) { skipped++; continue; }

    const quantity = Number(row[1]);
    if (!Number.isFinite(quantity) || quantity <= 0) break; // matches the legacy trailing-legend-row stop behavior

    const unitPrice = Number(row[2]);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) { skipped++; continue; }

    const { type: rowType, invalid: typeInvalid } = resolveRowType(row[3]);
    if (typeInvalid) { skipped++; continue; }

    const { date: rowDate, invalid: dateInvalid } = resolveRowDate(row[4]);
    if (dateInvalid) { skipped++; continue; }

    // row[5] (نام دارایی، فقط نمایشی) is intentionally never read — a
    // human-reference column only, the catalog entry is the source of truth.
    parsed.push({
      asset: {
        id: crypto.randomUUID(),
        name: catalogAsset.name,
        quantity,
        unit: getUnitLabel(catalogAsset.unit),
        unitPrice,
        icon: getAssetIconForCatalogEntry(catalogAsset),
        code: catalogAsset.symbol,
      },
      rowType,
      rowDate,
    });
  }
  return { rows: parsed, skipped };
}

// Falls back a row's optional نوع to the modal's chosen default mode:
// add -> buy, subtract -> sell, replace -> replace.
function resolveEffectiveType(rowType: RowType | null, defaultMode: ImportMode): ImportEffectiveType {
  if (rowType) return rowType;
  if (defaultMode === 'add') return 'buy';
  if (defaultMode === 'subtract') return 'sell';
  return 'replace';
}

export default function App() {
  const [items, setItems] = useState<Asset[]>(assets);
  const [isSample, setIsSample] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [historyAssetId, setHistoryAssetId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<'wallet' | 'market'>('market');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [sortMode, setSortMode] = useState<AssetSortMode>(readStoredSortMode);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(readStoredBalanceHidden);
  const prices = useLivePrices();
  const lastSnapshotDateRef = useRef<string | null>(null);

  const handleSortModeChange = (mode: AssetSortMode) => {
    setSortMode(mode);
    try {
      localStorage.setItem(ASSET_SORT_MODE_STORAGE_KEY, mode);
    } catch {
      // Same best-effort/no-op-on-failure convention as the rest of the
      // app's localStorage writes (see src/storage.ts) — a blocked storage
      // API shouldn't crash the sort action itself, it just won't persist.
    }
  };

  const handleToggleBalanceHidden = () => {
    setIsBalanceHidden(current => {
      const next = !current;
      try {
        localStorage.setItem(BALANCE_HIDDEN_STORAGE_KEY, String(next));
      } catch {
        // Same best-effort/no-op-on-failure convention as
        // handleSortModeChange above — a blocked storage API shouldn't
        // crash the toggle, it just won't persist across a reload.
      }
      return next;
    });
  };

  useEffect(() => {
    authService.getCurrentUser().then(user => {
      setCurrentUser(user);
      setIsAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    assetService.listAssets().then(async stored => {
      if (stored === null) {
        // Nothing saved yet — still showing the static `assets` sample. Run
        // the same code-assignment path over it (registers each sample's
        // identity in the code registry, same as real data — see
        // assetCodeRegistry.ts) without ever persisting the sample list
        // itself through assetService: doing so would turn
        // `oracle_assets_v1` non-null and permanently flip `isSample` to
        // false, even though the owner hasn't actually entered anything.
        setItems(assets.map(asset => ({ ...asset, code: asset.code ?? getOrCreateCode(asset.icon, asset.name) })));
        return;
      }
      // One-time migration: assign a permanent code to any asset saved
      // before this field existed, then persist it so this only runs once.
      let next = stored;
      for (const asset of stored) {
        if (asset.code) continue;
        const code = getOrCreateCode(asset.icon, asset.name);
        next = await assetService.updateAsset(asset.id, { code });
      }
      setItems(next);
      setIsSample(false);
    });
  }, []);

  const handleLogout = async () => {
    await authService.logOut();
    setCurrentUser(null);
    setIsMenuOpen(false);
  };

  const total = items.reduce((sum, asset) => sum + asset.quantity * getEffectiveUnitPrice(asset, prices), 0);

  // Display-only sorted view of the wallet's asset list (see the
  // "دارایی‌های من" sort menu, AssetSortMenu.tsx, and §6o of
  // AI-KNOWLEDGE.md) — `items` itself (state, storage, add/edit/delete)
  // stays in its original insertion order; only what's rendered changes.
  const sortedItems = useMemo(() => sortAssetsForDisplay(items, sortMode, prices), [items, sortMode, prices]);

  // Records/updates today's portfolio snapshot (see
  // src/services/portfolioHistoryService.ts) once total/prices are both
  // ready — guarded by a ref so it only re-runs when the calendar date
  // changes (or on first run this session), not on every 60s price tick.
  useEffect(() => {
    if (prices === null || total <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (lastSnapshotDateRef.current === today) return;
    lastSnapshotDateRef.current = today;
    (async () => {
      await portfolioHistoryService.seedMockHistoryIfEmpty(total, prices.usdToman, prices.goldGramToman);
      await portfolioHistoryService.recordSnapshotIfNeeded(total, prices.usdToman, prices.goldGramToman);
      setHistoryVersion(v => v + 1);
    })();
  }, [total, prices]);

  const handleAddAsset = async (newAsset: Asset) => {
    // Merge-by-code: a catalog-driven add (see AddAssetModal.tsx) whose `code`
    // (the catalog symbol) matches an asset already in the list is treated as
    // "I'm adding to what I already have" — quantity is ADDED to the existing
    // amount (unlike Excel import, which replaces) and unit price is updated to
    // the newly entered one. No match (or no code) creates a new asset as before.
    const existing = newAsset.code ? items.find(asset => asset.code === newAsset.code) : undefined;
    const today = new Date().toISOString().slice(0, 10);
    if (existing) {
      const next = await assetService.updateAsset(existing.id, { quantity: existing.quantity + newAsset.quantity, unitPrice: newAsset.unitPrice });
      await transactionService.addTransaction({ assetId: existing.id, type: 'buy', quantity: newAsset.quantity, unitPrice: newAsset.unitPrice, date: today });
      setItems(next);
      setIsSample(false);
      toast.success(`مقدار ${existing.name} افزایش یافت`);
      return;
    }
    const next = await assetService.addAsset(newAsset);
    await transactionService.addTransaction({ assetId: newAsset.id, type: 'buy', quantity: newAsset.quantity, unitPrice: newAsset.unitPrice, date: today });
    setItems(next);
    setIsSample(false);
    toast.success('دارایی جدید اضافه شد');
  };

  const handleTransactionRecorded = async (assetId: string, type: 'buy' | 'sell', quantity: number) => {
    const currentAsset = items.find(asset => asset.id === assetId);
    if (!currentAsset) return;
    const newQuantity = type === 'buy' ? currentAsset.quantity + quantity : Math.max(0, currentAsset.quantity - quantity);
    const next = await assetService.updateAsset(assetId, { quantity: newQuantity });
    setItems(next);
    setIsSample(false);
  };

  const handleDelete = async (id: string) => {
    const next = await assetService.deleteAsset(id);
    await transactionService.deleteTransactionsForAsset(id);
    setItems(next);
    setIsSample(false);
  };

  const handleEdit = async (id: string, quantity: number, unitPrice: number) => {
    const next = await assetService.updateAsset(id, { quantity, unitPrice });
    setItems(next);
    setIsSample(false);
  };

  const clearAllAssets = async () => {
    const idsToDelete = items.map(asset => asset.id);
    const next = await assetService.clearAssets();
    await Promise.all(idsToDelete.map(id => transactionService.deleteTransactionsForAsset(id)));
    setItems(next);
    setIsSample(false);
    toast.success('همه دارایی‌ها پاک شد');
  };

  const handleClearAllClick = () => {
    toast('همه دارایی‌ها پاک شوند؟', {
      action: { label: 'بله، پاک کن', onClick: clearAllAssets },
      cancel: { label: 'انصراف', onClick: () => {} },
    });
  };

  const handleImportFile = async (defaultMode: ImportMode, file: File) => {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error('فقط فایل اکسل (.xlsx یا .xls) پذیرفته می‌شود');
      return;
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const result = parseImportRows(rows);
    if (!result) {
      toast.error('فرمت فایل با قالب مورد انتظار مطابقت ندارد');
      return;
    }
    if (result.rows.length === 0) {
      toast.error('هیچ ردیف معتبری برای وارد کردن پیدا نشد');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const importRows: ImportRow[] = result.rows.map(row => ({
      asset: row.asset,
      effectiveType: resolveEffectiveType(row.rowType, defaultMode),
      effectiveDate: row.rowDate ?? today,
    }));
    const { assets: next, added, updated, skippedNoMatch, changes } = await assetService.importAssets(importRows);
    setItems(next);
    setIsSample(false);
    if (changes.length > 0) {
      try {
        await Promise.all(changes.map(change => transactionService.addTransaction({ assetId: change.assetId, type: change.type, quantity: change.quantity, unitPrice: change.unitPrice, date: change.date })));
      } catch {
        toast.error('ثبت تراکنش‌های واردشده انجام نشد');
      }
    }
    const parts = [];
    if (added > 0) parts.push(`${format(added)} دارایی اضافه شد`);
    if (updated > 0) parts.push(`${format(updated)} دارایی به‌روزرسانی شد`);
    let message = parts.join('، ');
    if (skippedNoMatch > 0) message += `، ${format(skippedNoMatch)} ردیف بابت نبود دارایی مشابه نادیده گرفته شد`;
    if (result.skipped > 0) message += `، ${format(result.skipped)} ردیف نامعتبر رد شد`;
    if (skippedNoMatch > 0 || result.skipped > 0) {
      toast.warning(message);
    } else {
      toast.success(message);
    }
    setIsImportModalOpen(false);
  };

  if (!isAuthChecked) {
    return <div className="min-h-screen bg-[#f5f6fb] grid place-items-center"><span className="text-[13px] text-[#969eb2]">در حال بارگذاری...</span></div>;
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={setCurrentUser}/>;
  }

  const historyAsset = historyAssetId ? items.find(asset => asset.id === historyAssetId) : undefined;

  return <div>
    <header className="bg-[#5264e8] text-white h-[224px] min-[1050px]:h-[220px] max-[481px]:h-[198px]"><div className="max-w-[900px] mx-auto pt-[35px] pb-[35px] px-8 flex items-center justify-between min-[1050px]:px-6 max-[481px]:pt-[25px] max-[481px]:pb-[25px] max-[481px]:px-[22px]">
      <span className="flex items-center gap-3 text-[22px] font-bold max-[481px]:text-[20px]"><button type="button" onClick={() => setIsMenuOpen(true)} aria-label="باز کردن منو" className="h-[46px] w-[46px] border border-[#ffffff40] bg-[#ffffff15] rounded-[15px] grid place-items-center max-[481px]:h-[41px] max-[481px]:w-[41px] cursor-pointer text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[2px]"><HamburgerIcon/></button><a className="no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[5px] focus-visible:rounded-[10px]" href="./" aria-label="Oracle، صفحه اصلی">Oracle<span className="block text-[11px] font-normal text-[#e0e4ff] mt-[1px]">سرمایه‌های من</span></a></span>
      <span className="text-[12px] text-[#e0e4ff] max-[481px]:text-[10px] max-[351px]:hidden">یک نگاه، همهٔ دارایی‌ها</span>
    </div></header>
    <main className="max-w-[800px] mx-auto mt-[-89px] px-6 pb-9 relative min-[1050px]:max-w-[900px] min-[1050px]:grid min-[1050px]:grid-cols-[300px_1fr] min-[1050px]:gap-5 min-[1050px]:items-start min-[1050px]:mt-[-65px] max-[481px]:mt-[-77px] max-[481px]:px-[18px] max-[481px]:pb-[28px]">
      <div>
        <SummaryCard total={total} count={items.length} isSample={isSample} prices={prices} isBalanceHidden={isBalanceHidden} onToggleBalanceHidden={handleToggleBalanceHidden} onOpenWallet={() => setActiveSectionTab('wallet')}/>
        <PortfolioTrendChart refreshKey={historyVersion}/>
      </div>
      <section className="mt-[31px] min-[1050px]:mt-0 min-[1050px]:bg-white min-[1050px]:border min-[1050px]:border-[#eceef5] min-[1050px]:rounded-[22px] min-[1050px]:p-[22px] max-[481px]:mt-[27px]" aria-labelledby={activeSectionTab === 'market' ? 'assets-title' : undefined} aria-label={activeSectionTab === 'wallet' ? 'دارایی‌های من' : undefined}>
        <div className="grid grid-cols-2 mb-[15px] min-[1050px]:mb-[19px] border border-[#eef0f7] rounded-[10px] p-1">
          <button type="button" onClick={() => setActiveSectionTab('wallet')} className={`flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${activeSectionTab === 'wallet' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}><WalletIcon/>کیف پول</button>
          <button type="button" onClick={() => setActiveSectionTab('market')} className={`flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${activeSectionTab === 'market' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}><MarketEyeIcon/>چشم بازار</button>
        </div>
        {activeSectionTab === 'wallet' ? <>
          <Toolbar onOpenImportModal={() => setIsImportModalOpen(true)} onClearAll={handleClearAllClick} onAdd={() => setIsAddOpen(true)} sortMode={sortMode} onSortModeChange={handleSortModeChange}/>
          {sortedItems.length === 0 ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">هنوز دارایی‌ای ثبت نشده</p> : <ul className="list-none m-0 p-0 grid gap-[10px]">{sortedItems.map(asset => <AssetRow key={asset.id} asset={asset} prices={prices} isBalanceHidden={isBalanceHidden} onDelete={handleDelete} onEdit={handleEdit} onHistory={setHistoryAssetId}/>)}</ul>}
        </> : <>
          <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]"><h2 id="assets-title" className="text-[17px] font-bold max-[481px]:text-[15px]">چشم بازار</h2><span className="text-[11px] text-[#656e87]">ارزش به تومان</span></div>
          <MarketWatchList/>
        </>}
      </section>
      {isSample && <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] mt-[25px] min-[1050px]:col-span-full min-[1050px]:mt-0">مقادیر فعلاً نمونه‌اند و دارایی واقعی شما نیستند.</p>}
    </main>
    {isAddOpen && <AddAssetModal onClose={() => setIsAddOpen(false)} onAdd={handleAddAsset}/>}
    {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onSubmit={handleImportFile}/>}
    {isMenuOpen && <SideDrawer onClose={() => setIsMenuOpen(false)} onOpenProfile={() => { setIsMenuOpen(false); setIsProfileOpen(true); }} onLogout={handleLogout}/>}
    {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)}/>}
    {historyAsset && <TransactionHistoryModal asset={historyAsset} isSample={isSample} onClose={() => setHistoryAssetId(null)} onTransactionRecorded={handleTransactionRecorded}/>}
  </div>;
}
