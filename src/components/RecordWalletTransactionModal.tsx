import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { walletService, type WalletAccount } from '../services/walletService';
import { walletTransactionService } from '../services/walletTransactionService';
import type { WalletTransactionType } from '../types/walletTransaction';
import { formatWithThousands, stripToNumberString, todayLocalIso } from '../format';
import { CloseIcon } from './icons';

// The "ثبت تراکنش" (record wallet transaction) modal — the wallet-side
// equivalent of RecordTransactionModal, minus the unit-price concept. Same
// shell (backdrop / Escape / "×" / stopPropagation), same 3-way active-color
// toggle (green add / red subtract / amber replace), but only a single
// toman amount + date + optional note. Submitting writes BOTH a
// WalletTransaction (walletTransactionService) and the resulting balance
// (walletService.updateAccount), then pushes the returned full account list
// up via onTransactionRecorded.
export function RecordWalletTransactionModal({ account, onClose, onTransactionRecorded }: { account: WalletAccount; onClose: () => void; onTransactionRecorded: (accounts: WalletAccount[]) => void }) {
  const [formType, setFormType] = useState<WalletTransactionType>('increase');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(todayLocalIso());
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = Number(formAmount);
    const validAmount = formType === 'replace' ? Number.isFinite(amount) && amount >= 0 : Number.isFinite(amount) && amount > 0;
    if (!validAmount || !formDate) {
      toast.error('مبلغ و تاریخ را به‌درستی وارد کنید.');
      return;
    }
    const newBalance = formType === 'increase' ? account.balance + amount : formType === 'decrease' ? Math.max(0, account.balance - amount) : amount;
    try {
      await walletTransactionService.addTransaction({ accountId: account.id, type: formType, amount, date: formDate, note: formNote.trim() || undefined });
      const next = await walletService.updateAccount(account.id, { balance: newBalance });
      toast.success('تراکنش ثبت شد');
      onTransactionRecorded(next);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ثبت تراکنش انجام نشد');
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="record-wallet-transaction-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <div className="flex items-center gap-2 mb-1 pr-6"><h2 id="record-wallet-transaction-title" className="text-[15px] font-bold">ثبت تراکنش جدید</h2></div>
      <p className="text-[11px] text-[#969eb2] mb-4">{account.name}</p>
      <form onSubmit={handleAddSubmit} className="grid gap-[10px] min-[560px]:grid-cols-2">
        <div className="grid grid-cols-3 border border-[#eef0f7] rounded-[10px] p-1 min-[560px]:col-span-2">
          <button type="button" onClick={() => setFormType('increase')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'increase' ? 'bg-[#1f9d55] text-white' : 'text-[#7a8097]'}`}>افزایش</button>
          <button type="button" onClick={() => setFormType('decrease')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'decrease' ? 'bg-[#d95050] text-white' : 'text-[#7a8097]'}`}>کاهش</button>
          <button type="button" onClick={() => setFormType('replace')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${formType === 'replace' ? 'bg-[#d7a144] text-white' : 'text-[#7a8097]'}`}>جایگذاری</button>
        </div>
        <label className="text-[11px] text-[#7a8097] grid gap-1 min-[560px]:col-span-2">{formType === 'replace' ? 'مبلغ جدید به تومان' : 'مبلغ به تومان'}
          <input type="text" inputMode="numeric" value={formatWithThousands(formAmount)} onChange={e => setFormAmount(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">تاریخ
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">یادداشت (اختیاری)
          <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <button type="submit" className={`text-white text-[12px] font-medium rounded-[12px] px-4 py-2 min-[560px]:col-span-2 cursor-pointer transition-colors ${formType === 'increase' ? 'bg-[#1f9d55]' : formType === 'decrease' ? 'bg-[#d95050]' : 'bg-[#d7a144]'}`}>
          {formType === 'increase' ? 'ثبت تراکنش افزایش' : formType === 'decrease' ? 'ثبت تراکنش کاهش' : 'ثبت تراکنش جایگذاری'}
        </button>
      </form>
    </section>
  </div>;
}
