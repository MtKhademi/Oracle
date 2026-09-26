import { useEffect, useMemo, useState } from 'react';
import { marketWatchService, type MarketItem } from '../services/marketWatchService';
import { categoryMeta, categoryOrder } from '../services/marketCategoryMeta';
import { CloseIcon } from './icons';

// The "افزودن به چشم بازار" modal (see AI-KNOWLEDGE.md §6r) — shelled like
// AddAssetModal.tsx (backdrop + centered card + CloseIcon + heading), holding
// a searchable, category-grouped list built the same way AssetPicker.tsx
// filters/groups the asset catalog, but reading from
// marketWatchService.getAllItems() (the static 14-item catalog, not the
// live-jittered snapshot) and excluding ids already in the current
// watchlist. Unlike AssetPicker, this list has no separate floating
// dropdown panel to protect from the modal's own backdrop-click-to-close —
// it IS the modal's whole body — so it doesn't need AssetPicker's
// mousedown-based outside-click detection; the existing card
// `stopPropagation`/backdrop-`onClick`/`Escape` handling (identical to
// AddAssetModal) is the only close behavior needed here.
export function AddMarketWatchItemModal({ onClose, watchedIds, onAdd }: {
  onClose: () => void;
  watchedIds: string[];
  onAdd: (id: string) => void;
}) {
  const [allItems, setAllItems] = useState<MarketItem[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    marketWatchService.getAllItems().then(items => { if (!cancelled) setAllItems(items); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const candidates = useMemo(
    () => (allItems ?? []).filter(item => !watchedIds.includes(item.id)),
    [allItems, watchedIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    // Simple case-insensitive substring match on name only (search "by
    // name", per spec) — no fuzzy-search library, same convention as
    // AssetPicker's filterCatalogAssets.
    return candidates.filter(item => item.name.toLowerCase().includes(q));
  }, [candidates, query]);

  const grouped = useMemo(
    () => categoryOrder
      .map(category => ({ category, items: filtered.filter(item => item.category === category) }))
      .filter(group => group.items.length > 0),
    [filtered],
  );

  const selectItem = (item: MarketItem) => {
    onAdd(item.id);
    onClose();
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4" onClick={onClose}>
    <div className="min-h-full grid place-items-center">
      <section className="bg-white rounded-[20px] p-5 w-full max-w-[480px] shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="add-market-watch-item-title" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
        <h2 id="add-market-watch-item-title" className="text-[15px] font-bold mb-4">افزودن به چشم بازار</h2>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="جستجوی نام..."
          autoFocus
          className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] w-full mb-3"
        />
        <div className="max-h-[320px] overflow-y-auto grid gap-1">
          {allItems === null
            ? null
            : candidates.length === 0
              ? <p className="text-[11px] text-[#969eb2] text-center py-4">همهٔ دارایی‌ها به چشم بازار اضافه شده‌اند</p>
              : filtered.length === 0
                ? <p className="text-[11px] text-[#969eb2] text-center py-4">دارایی‌ای پیدا نشد</p>
                : grouped.map(group => <div key={group.category}>
                  <div className="text-[10px] text-[#9096aa] px-2 pt-2 pb-1">{categoryMeta[group.category].label}</div>
                  {group.items.map(item => <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item)}
                    className="w-full text-right text-[13px] px-3 py-2 rounded-[8px] cursor-pointer text-[#2a2f3d] hover:bg-[#f6f7fb]"
                  >
                    {item.name}
                  </button>)}
                </div>)}
        </div>
      </section>
    </div>
  </div>;
}
