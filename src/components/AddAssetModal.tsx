import { useEffect, useState, type FormEvent } from 'react';
import type { Asset } from '../assets';
import { formatWithThousands, stripToNumberString } from '../format';
import { getAssetIconForCatalogEntry, getCatalogAssetBySymbol, getCatalogAssets, getUnitLabel } from '../services/assetCatalog';
import { AssetPicker } from './AssetPicker';
import { CloseIcon } from './icons';

const catalogAssets = getCatalogAssets();

export function AddAssetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (asset: Asset) => void }) {
  const [selectedSymbol, setSelectedSymbol] = useState(catalogAssets[0]?.symbol ?? '');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedAsset = getCatalogAssetBySymbol(selectedSymbol);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAddSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = Number(formQuantity);
    const unitPrice = Number(formUnitPrice);
    if (!selectedAsset || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setFormError('دارایی، مقدار و قیمت واحد را به‌درستی انتخاب/پر کنید.');
      return;
    }
    // A catalog asset's symbol IS its identity code — set directly, no
    // getOrCreateCode call (that auto-generated-code path is now only a
    // fallback for anything outside the catalog, e.g. the Excel import).
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: selectedAsset.name,
      quantity,
      unit: getUnitLabel(selectedAsset.unit),
      unitPrice,
      icon: getAssetIconForCatalogEntry(selectedAsset),
      code: selectedAsset.symbol,
    };
    onAdd(newAsset);
    setFormQuantity('');
    setFormUnitPrice('');
    setFormError(null);
    onClose();
  };

  // The scrollable boundary lives on this outer backdrop, not on the card
  // below — the card itself has no overflow/max-height, so it never clips
  // AssetPicker's absolutely-positioned dropdown panel. The inner `grid
  // place-items-center` wrapper keeps the card centered while still letting
  // the outer div scroll if the card (form + an open dropdown) ends up
  // taller than the viewport, instead of the card growing its own inner
  // scrollbar and clipping the dropdown against it.
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4" onClick={onClose}>
    <div className="min-h-full grid place-items-center">
      <section className="bg-white rounded-[20px] p-5 w-full max-w-[480px] shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="add-asset-title" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
        <h2 id="add-asset-title" className="text-[15px] font-bold mb-4">افزودن دارایی جدید</h2>
        <form onSubmit={handleAddSubmit} className="grid gap-[10px] min-[560px]:grid-cols-2">
          <label className="text-[11px] text-[#7a8097] grid gap-1 min-[560px]:col-span-2">دارایی
            <AssetPicker selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol}/>
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1">مقدار
            <input type="text" inputMode="numeric" value={formatWithThousands(formQuantity)} onChange={e => setFormQuantity(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1">واحد
            <input type="text" readOnly disabled value={selectedAsset ? getUnitLabel(selectedAsset.unit) : ''} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#9096aa] bg-[#f6f7fb] cursor-not-allowed" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1 min-[560px]:col-span-2">قیمت واحد به تومان
            <input type="text" inputMode="numeric" value={formatWithThousands(formUnitPrice)} onChange={e => setFormUnitPrice(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          {formError && <p className="text-[11px] text-[#d95050] min-[560px]:col-span-2">{formError}</p>}
          <button type="submit" className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 min-[560px]:col-span-2">افزودن دارایی</button>
        </form>
      </section>
    </div>
  </div>;
}
