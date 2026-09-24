import { useEffect, useState, type FormEvent } from 'react';
import type { Asset } from '../assets';
import { getOrCreateCode } from '../services/assetCodeRegistry';
import { CloseIcon } from './icons';

const iconLabel: Record<Asset['icon'], string> = {
  gold: 'طلا',
  fund: 'صندوق',
  cash: 'نقد',
  usdt: 'تتر',
  btc: 'بیت‌کوین',
  eth: 'اتریوم',
  other: 'سایر',
};

const iconOptions = Object.keys(iconLabel) as Asset['icon'][];

const stripToNumberString = (raw: string) => {
  let cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  return cleaned;
};

const formatWithThousands = (raw: string) => {
  const cleaned = stripToNumberString(raw);
  const [intPart, decPart] = cleaned.split('.');
  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '';
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

export function AddAssetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (asset: Asset) => void }) {
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [formIcon, setFormIcon] = useState<Asset['icon']>('gold');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAddSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = Number(formQuantity);
    const unitPrice = Number(formUnitPrice);
    if (!formName.trim() || !formUnit.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setFormError('نام، مقدار، واحد و قیمت واحد را به‌درستی پر کنید.');
      return;
    }
    const name = formName.trim();
    const code = getOrCreateCode(formIcon, name);
    const newAsset: Asset = { id: crypto.randomUUID(), name, quantity, unit: formUnit.trim(), unitPrice, icon: formIcon, code };
    onAdd(newAsset);
    setFormName('');
    setFormQuantity('');
    setFormUnit('');
    setFormUnitPrice('');
    setFormIcon('gold');
    setFormError(null);
    onClose();
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="add-asset-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="add-asset-title" className="text-[15px] font-bold mb-4">افزودن دارایی جدید</h2>
      <form onSubmit={handleAddSubmit} className="grid gap-[10px] min-[560px]:grid-cols-2">
        <label className="text-[11px] text-[#7a8097] grid gap-1">نام
          <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثلاً سکه بهار آزادی" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">دسته/آیکن
          <select value={formIcon} onChange={e => setFormIcon(e.target.value as Asset['icon'])} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] bg-white">
            {iconOptions.map(key => <option key={key} value={key}>{iconLabel[key]}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">مقدار
          <input type="text" inputMode="numeric" value={formatWithThousands(formQuantity)} onChange={e => setFormQuantity(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">واحد
          <input type="text" value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="گرم/واحد/تومان/USDT/BTC/ETH" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1 min-[560px]:col-span-2">قیمت واحد به تومان
          <input type="text" inputMode="numeric" value={formatWithThousands(formUnitPrice)} onChange={e => setFormUnitPrice(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        {formError && <p className="text-[11px] text-[#d95050] min-[560px]:col-span-2">{formError}</p>}
        <button type="submit" className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 min-[560px]:col-span-2">افزودن دارایی</button>
      </form>
    </section>
  </div>;
}
