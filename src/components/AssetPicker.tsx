import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { getCatalogAssetBySymbol, getCatalogAssets, getCategoryLabel, type CatalogAsset } from '../services/assetCatalog';

// Catalog assets + their category order (first-appearance order, same as the
// catalog file itself) — module-level since the catalog is static/read-only.
const catalogAssets = getCatalogAssets();
const catalogCategoryIds = [...new Set(catalogAssets.map(asset => asset.category))];

function filterCatalogAssets(query: string): CatalogAsset[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalogAssets;
  // Simple case-insensitive substring match on name or symbol — no fuzzy-search
  // library. `toLowerCase()` is a no-op on Persian text (no letter casing) but
  // harmless, so this naturally works for both Persian names and Latin symbols.
  return catalogAssets.filter(asset => asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q));
}

// A small custom combobox: text input + dropdown panel, replacing the native
// <select> the add-asset form used to render the catalog with (see
// AddAssetModal.tsx). Plain React state + Tailwind only — no external
// combobox/autocomplete library.
//
// Outside-click detection uses a `document` `mousedown` listener + a
// container `ref` (not a full-viewport `fixed inset-0` overlay div). An
// overlay div sitting inside a modal card visually/functionally paints on
// top of every other element in that stacking context (including the
// modal's own "X" close button and its backdrop), because it's `fixed`
// with an explicit z-index yet still a DOM descendant of the card's
// `onClick={stopPropagation}` wrapper — so a click aimed at the X button
// would land on the overlay instead, closing only the dropdown and never
// bubbling out to the modal's `onClose`, trapping the user. A `mousedown`
// listener only *detects* whether the click landed outside this
// component's own DOM subtree; it never intercepts the click itself, so
// the same click still reaches (and can act on) the X button/backdrop
// underneath in the same event dispatch — see the AddAssetModal
// dropdown-blocks-close fix in the decision log for the a11y/UX bug this
// replaces.
export function AssetPicker({ selectedSymbol, onSelect }: { selectedSymbol: string; onSelect: (symbol: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAsset = getCatalogAssetBySymbol(selectedSymbol);

  const filtered = useMemo(() => filterCatalogAssets(query), [query]);
  const groupedFiltered = useMemo(
    () => catalogCategoryIds
      .map(categoryId => ({ categoryId, items: filtered.filter(asset => asset.category === categoryId) }))
      .filter(group => group.items.length > 0),
    [filtered],
  );
  const flatFiltered = useMemo(() => groupedFiltered.flatMap(group => group.items), [groupedFiltered]);

  const open = () => {
    setQuery('');
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  // Close on outside click/tap without intercepting the click itself — see
  // the component-level comment above for why this replaced the earlier
  // `fixed inset-0` overlay-div pattern.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const selectAsset = (asset: CatalogAsset) => {
    onSelect(asset.symbol);
    setQuery('');
    setIsOpen(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setHighlightedIndex(0);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); open(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const asset = flatFiltered[highlightedIndex];
      if (asset) selectAsset(asset);
    } else if (e.key === 'Escape') {
      // Close without changing the selection — the input falls back to
      // showing the (unchanged) selected asset's name once closed.
      e.preventDefault();
      close();
    }
  };

  return <div className="relative" ref={containerRef}>
    <input
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      value={isOpen ? query : (selectedAsset?.name ?? '')}
      placeholder="جستجوی دارایی..."
      onChange={e => handleChange(e.target.value)}
      onFocus={open}
      onClick={open}
      onKeyDown={handleKeyDown}
      className="relative z-20 border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] w-full"
    />
    {isOpen &&
      // max-h sized to comfortably fit ~5 result rows (each ~36px) plus a
      // category header or two before scrolling kicks in — was 220px,
      // which only fit ~2-3 rows and made the panel look cut off.
      <div className="absolute z-20 mt-1 w-full max-h-[280px] overflow-y-auto bg-white rounded-[14px] border border-[#eceef8] shadow-[0_12px_36px_#2734790b] p-1">
        {flatFiltered.length === 0
          ? <p className="text-[11px] text-[#969eb2] text-center py-4">دارایی‌ای پیدا نشد</p>
          : groupedFiltered.map(group => <div key={group.categoryId}>
            <div className="text-[10px] text-[#9096aa] px-2 pt-2 pb-1">{getCategoryLabel(group.categoryId)}</div>
            {group.items.map(asset => {
              const flatIndex = flatFiltered.indexOf(asset);
              const isHighlighted = flatIndex === highlightedIndex;
              return <button
                key={asset.symbol}
                type="button"
                onClick={() => selectAsset(asset)}
                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                className={`w-full text-right text-[13px] px-3 py-2 rounded-[8px] cursor-pointer ${isHighlighted ? 'bg-[#f0f1fb] text-[#4659d9]' : 'text-[#2a2f3d] hover:bg-[#f6f7fb]'}`}
              >
                {asset.name}
              </button>;
            })}
          </div>)}
      </div>}
  </div>;
}
