import { useEffect, useMemo, useState } from 'react';
import type { Asset } from '../assets';
import { AssetIcon, iconTint } from './AssetIcon';
import { CloseIcon } from './icons';

// The "ثبت تراکنش برای کدام دارایی؟" picker modal, opened from the wallet
// toolbar's new "ثبت تراکنش جدید" button (see AI-KNOWLEDGE.md §6z) — lets
// the owner record a transaction for any existing asset without first
// finding its row and clicking its own pencil icon. Same shell/style as
// RecordTransactionModal.tsx (backdrop/"×"/Escape/stopPropagation), plus a
// plain name-substring search input (same case-insensitive convention as
// AssetPicker.tsx's catalog filter) above a scrollable list of asset
// buttons. Selecting one calls `onSelect(assetId)`; App.tsx then closes
// this modal and opens the exact same RecordTransactionModal already wired
// to `recordTransactionAssetId` — no duplicate modal logic here.
export function SelectAssetForTransactionModal({ items, onClose, onSelect }: {
  items: Asset[];
  onClose: () => void;
  onSelect: (assetId: string) => void;
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(asset => asset.name.toLowerCase().includes(q));
  }, [items, query]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="select-asset-for-transaction-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="select-asset-for-transaction-title" className="text-[15px] font-bold mb-4 pr-6">ثبت تراکنش برای کدام دارایی؟</h2>
      {items.length === 0 ? <p className="text-[11px] text-[#969eb2] text-center py-4">هنوز دارایی‌ای ثبت نشده</p> : <>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="جستجوی دارایی..."
          autoFocus
          className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] w-full mb-3"
        />
        <div className="max-h-[320px] overflow-y-auto grid gap-1">
          {filtered.length === 0
            ? <p className="text-[11px] text-[#969eb2] text-center py-4">دارایی‌ای پیدا نشد</p>
            : filtered.map(asset => <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              className="w-full flex items-center gap-3 text-right text-[13px] px-3 py-2 rounded-[10px] cursor-pointer text-[#2a2f3d] hover:bg-[#f6f7fb]"
            >
              <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-[10px] ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
              {asset.name}
            </button>)}
        </div>
      </>}
    </section>
  </div>;
}
