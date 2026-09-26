import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { transactionService } from '../services/transactionService';
import type { Asset } from '../assets';
import type { TransactionType } from '../types/transaction';
import type { LivePrices } from '../services/priceService';
import { getEffectiveUnitPrice } from '../services/livePriceMapping';
import { formatWithThousands, stripToNumberString, todayLocalIso } from '../format';
import { CloseIcon, DollarIcon } from './icons';
import { IconButton } from './IconButton';

export function RecordTransactionModal({ asset, isSample, prices, onClose, onTransactionRecorded }: { asset: Asset; isSample: boolean; prices: LivePrices | null; onClose: () => void; onTransactionRecorded: (assetId: string, type: TransactionType, quantity: number, unitPrice: number) => void }) {
  const lastPrice = getEffectiveUnitPrice(asset, prices);
  const [formType, setFormType] = useState<TransactionType>('buy');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [formDate, setFormDate] = useState(todayLocalIso());
  const [formNote, setFormNote] = useState('');

  const fillLastPrice = () => setFormUnitPrice(String(Math.round(lastPrice)));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = Number(formQuantity);
    const unitPrice = Number(formUnitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !formDate) {
      toast.error('مقدار و قیمت واحد را به‌درستی وارد کنید.');
      return;
    }
    try {
      await transactionService.addTransaction({ assetId: asset.id, type: formType, quantity, unitPrice, date: formDate, note: formNote.trim() || undefined });
      toast.success('تراکنش ثبت شد');
      onTransactionRecorded(asset.id, formType, quantity, unitPrice);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ثبت تراکنش انجام نشد');
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="record-transaction-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <div className="flex items-center gap-2 mb-1 pr-6"><h2 id="record-transaction-title" className="text-[15px] font-bold">ثبت تراکنش جدید</h2>{isSample && <span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span>}</div>
      <p className="text-[11px] text-[#969eb2] mb-4">{asset.name}</p>
      <form onSubmit={handleAddSubmit} className="grid gap-[10px] min-[560px]:grid-cols-2">
        <div className="grid grid-cols-3 border border-[#eef0f7] rounded-[10px] p-1 min-[560px]:col-span-2">
          <button type="button" onClick={() => setFormType('buy')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'buy' ? 'bg-[#1f9d55] text-white' : 'text-[#7a8097]'}`}>خرید</button>
          <button type="button" onClick={() => setFormType('sell')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'sell' ? 'bg-[#d95050] text-white' : 'text-[#7a8097]'}`}>فروش</button>
          <button type="button" onClick={() => setFormType('replace')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'replace' ? 'bg-[#d7a144] text-white' : 'text-[#7a8097]'}`}>جایگذاری</button>
        </div>
        <div className="grid gap-[10px] min-[560px]:grid-cols-[2fr_3fr] min-[560px]:col-span-2">
          <label className="text-[11px] text-[#7a8097] grid gap-1">{formType === 'replace' ? 'مقدار جدید' : 'مقدار'}
            <input type="text" inputMode="numeric" value={formatWithThousands(formQuantity)} onChange={e => setFormQuantity(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1 min-w-0">{formType === 'replace' ? 'قیمت واحد جدید (تومان)' : 'قیمت واحد به تومان'}
            <span className="flex gap-[6px] min-w-0">
              <input type="text" inputMode="numeric" value={formatWithThousands(formUnitPrice)} onChange={e => setFormUnitPrice(stripToNumberString(e.target.value))} className="flex-1 min-w-0 border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
              <IconButton icon={<DollarIcon/>} onClick={fillLastPrice} ariaLabel="پر کردن با آخرین قیمت" tone="neutral" variant="filled"/>
            </span>
          </label>
        </div>
        <label className="text-[11px] text-[#7a8097] grid gap-1">تاریخ
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">یادداشت (اختیاری)
          <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <button type="submit" className={`text-white text-[12px] font-medium rounded-[12px] px-4 py-2 min-[560px]:col-span-2 cursor-pointer transition-colors ${formType === 'buy' ? 'bg-[#1f9d55]' : formType === 'sell' ? 'bg-[#d95050]' : 'bg-[#d7a144]'}`}>
          {formType === 'buy' ? 'ثبت تراکنش خرید' : formType === 'sell' ? 'ثبت تراکنش فروش' : 'ثبت تراکنش جایگذاری'}
        </button>
      </form>
    </section>
  </div>;
}
