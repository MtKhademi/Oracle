import { useEffect, useState } from 'react';
import { transactionService } from '../services/transactionService';
import type { Asset } from '../assets';
import type { Transaction } from '../types/transaction';
import { format, formatDate } from '../format';
import { CloseIcon } from './icons';

export function TransactionHistoryModal({ asset, isSample, onClose }: { asset: Asset; isSample: boolean; onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    transactionService.listTransactionsForAsset(asset.id).then(setTransactions);
  }, [asset.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const newestFirst = (transactions ?? [])
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => b.transaction.date.localeCompare(a.transaction.date) || b.index - a.index);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="transaction-history-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <div className="flex items-center gap-2 mb-1 pr-6"><h2 id="transaction-history-title" className="text-[15px] font-bold">{asset.name}</h2>{isSample && <span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span>}</div>
      <p className="text-[11px] text-[#969eb2] mb-4">تاریخچهٔ تراکنش‌ها</p>
      {transactions === null ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-6">در حال بارگذاری...</p> : newestFirst.length === 0 ? <div className="text-center py-6">
        <p className="text-[12px] text-[#656e87] leading-[1.9]">هنوز تراکنشی برای این دارایی ثبت نشده است.</p>
        {asset.quantity > 0 && <p className="text-[11px] text-[#969eb2] leading-[1.9] mt-2">تراکنش‌های گذشتهٔ این دارایی هنوز ثبت نشده‌اند.</p>}
      </div> : <ul className="m-0 p-0 list-none grid gap-[8px]">
        {newestFirst.map(({ transaction }) => <li key={transaction.id} className="border border-[#eef0f7] rounded-[12px] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={transaction.type === 'buy' ? 'text-[11px] font-medium text-[#4659d9] bg-[#eef0ff] rounded-[8px] px-2 py-[2px]' : 'text-[11px] font-medium text-[#77809c] bg-[#f6f7fb] rounded-[8px] px-2 py-[2px]'}>{transaction.type === 'buy' ? 'خرید' : 'فروش'}</span>
            <span className="text-[11px] text-[#999fb2]">{formatDate(transaction.date)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2 text-[12px] text-[#2a2f3d]">
            <span>{format(transaction.quantity, 8)} {asset.unit}</span>
            <span>{format(transaction.unitPrice)} تومان / هر {asset.unit}</span>
          </div>
          {transaction.note && <p className="text-[11px] text-[#9096aa] mt-2">{transaction.note}</p>}
        </li>)}
      </ul>}
    </section>
  </div>;
}
