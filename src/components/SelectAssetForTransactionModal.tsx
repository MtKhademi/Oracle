import { useEffect, useMemo, useState } from 'react';
import type { Asset } from '../assets';
import { getAssetIconForCatalogEntry, getCatalogAssets, getUnitLabel, type CatalogAsset } from '../services/assetCatalog';
import { getEffectiveUnitPrice } from '../services/livePriceMapping';
import type { LivePrices } from '../services/priceService';
import { AssetIcon, iconTint } from './AssetIcon';
import { CloseIcon } from './icons';

// Static catalog (committed reference data, never changes at runtime) —
// module-level, same convention as AssetPicker.tsx/AddAssetModal used.
const catalogAssets = getCatalogAssets();

// The "ثبت تراکنش برای کدام دارایی؟" picker modal, opened from the wallet
// toolbar's "ثبت تراکنش جدید" button (see AI-KNOWLEDGE.md §6z, extended in
// §6aa) — lets the owner record a transaction for any existing asset without
// first finding its row, OR pick a catalog asset not yet in the wallet: that
// one is silently created with quantity 0 via `onAddAsset` (the same
// assetService.addAsset call AddAssetModal used) and the exact same
// RecordTransactionModal opens for it — the very next خرید transaction sets
// the real amount/price. Same shell/style as RecordTransactionModal.tsx
// (backdrop/"×"/Escape/stopPropagation), plus a plain name/symbol-substring
// search input (same case-insensitive convention as AssetPicker.tsx's
// catalog filter) above a scrollable list. Existing wallet assets are always
// the primary/first entries (name-filtered, original behavior); matching
// catalog assets NOT yet owned are listed below in a separate
// "دارایی‌های جدید" section, each row carrying a small "دارایی جدید" badge.
// Selecting an existing asset or a just-created one calls
// `onSelect(assetId)`; App.tsx closes this modal and opens the exact same
// RecordTransactionModal already wired to `recordTransactionAssetId` — no
// duplicate modal logic here.
export function SelectAssetForTransactionModal({ items, prices, onClose, onSelect, onAddAsset }: {
  items: Asset[];
  prices: LivePrices | null;
  onClose: () => void;
  onSelect: (assetId: string) => void;
  onAddAsset: (asset: Asset) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  // One-click-at-a-time guard: while a not-yet-owned catalog asset is being
  // created via onAddAsset, further clicks are ignored so a double-click
  // (or a second, different pick in the same instant) can't race two
  // creations.
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  // Existing wallet assets, filtered by name (the original behavior) — these
  // stay the primary/first section whether or not a search is active.
  const filteredOwned = useMemo(
    () => (q ? items.filter(asset => asset.name.toLowerCase().includes(q)) : items),
    [items, q],
  );

  // Catalog assets matching the search that are NOT already in the wallet.
  // "Owned" = `code` === catalog symbol (the identity link catalog adds /
  // the Excel import use) OR an exact name match — the latter catches
  // legacy/auto-coded assets (e.g. the default samples, coded `USDT-0001`
  // instead of `USDT`) that predate catalog codes. Only shown while a
  // search is active (no query = the plain owned-asset list, as before).
  const newCatalogMatches = useMemo(
    () => (q
      ? catalogAssets.filter(asset => (asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q)) && !items.some(owned => owned.code === asset.symbol || owned.name.trim().toLowerCase() === asset.name.toLowerCase()))
      : []),
    [items, q],
  );

  const nothingFound = q !== '' && filteredOwned.length === 0 && newCatalogMatches.length === 0;

  const pickCatalogAsset = async (catalogAsset: CatalogAsset) => {
    if (pendingSymbol) return;
    // Quantity 0 on purpose — the very next step is a خرید (buy) transaction
    // that sets the real amount/price. Unit price defaults to the live mock
    // rate when livePriceMapping.ts knows this symbol (GOLD18/USDT) via
    // getEffectiveUnitPrice (the same source AssetRow/the total use), else
    // stays 0 — no separate price lookup invented.
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: catalogAsset.name,
      quantity: 0,
      unit: getUnitLabel(catalogAsset.unit),
      unitPrice: 0,
      icon: getAssetIconForCatalogEntry(catalogAsset),
      code: catalogAsset.symbol,
    };
    newAsset.unitPrice = getEffectiveUnitPrice(newAsset, prices);
    setPendingSymbol(catalogAsset.symbol);
    try {
      await onAddAsset(newAsset);
      onSelect(newAsset.id);
    } finally {
      setPendingSymbol(null);
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="select-asset-for-transaction-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="select-asset-for-transaction-title" className="text-[15px] font-bold mb-4 pr-6">ثبت تراکنش برای کدام دارایی؟</h2>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="جستجوی دارایی..."
        autoFocus
        className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] w-full mb-3"
      />
      <div className="max-h-[320px] overflow-y-auto grid gap-1">
        {items.length === 0 && q === '' && <p className="text-[11px] text-[#969eb2] text-center py-4">هنوز دارایی‌ای ثبت نشده — نام دارایی موردنظر را جست‌وجو کنید تا اضافه شود</p>}
        {filteredOwned.map(asset => <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset.id)}
          className="w-full flex items-center gap-3 text-right text-[13px] px-3 py-2 rounded-[10px] cursor-pointer text-[#2a2f3d] hover:bg-[#f6f7fb]"
        >
          <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-[10px] ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
          {asset.name}
        </button>)}
        {newCatalogMatches.length > 0 && <>
          <p className="text-[10px] text-[#9096aa] px-3 pt-2 pb-1">دارایی‌های جدید</p>
          {newCatalogMatches.map(catalogAsset => {
            const icon = getAssetIconForCatalogEntry(catalogAsset);
            return <button
              key={catalogAsset.symbol}
              type="button"
              disabled={pendingSymbol !== null}
              onClick={() => pickCatalogAsset(catalogAsset)}
              className="w-full flex items-center gap-3 text-right text-[13px] px-3 py-2 rounded-[10px] cursor-pointer text-[#2a2f3d] hover:bg-[#f6f7fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-[10px] ${iconTint[icon]}`} aria-hidden="true"><AssetIcon type={icon}/></span>
              <span className="flex-1 min-w-0">{catalogAsset.name}</span>
              <span className="text-[9px] text-[#5264e8] bg-[#eef0ff] rounded-[10px] px-2 py-[2px] shrink-0">دارایی جدید</span>
            </button>;
          })}
        </>}
        {nothingFound && <p className="text-[11px] text-[#969eb2] text-center py-4">دارایی‌ای پیدا نشد</p>}
      </div>
    </section>
  </div>;
}
