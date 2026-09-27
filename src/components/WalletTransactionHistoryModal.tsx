import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { walletTransactionService } from '../services/walletTransactionService';
import type { WalletAccount } from '../services/walletService';
import type { WalletTransaction } from '../types/walletTransaction';
import { format, formatDate } from '../format';
import { CloseIcon } from './icons';

const TRANSACTIONS_PER_PAGE = 6;

export function WalletTransactionHistoryModal({ account, onClose }: { account: WalletAccount; onClose: () => void }) {
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null);
  const [page, setPage] = useState(1);

  const loadTransactions = async () => {
    const next = await walletTransactionService.listTransactionsForAccount(account.id);
    setTransactions(next);
    setPage(1);
  };

  useEffect(() => {
    let active = true;
    setPage(1);
    walletTransactionService.listTransactionsForAccount(account.id).then(next => {
      if (active) setTransactions(next);
    });
    return () => { active = false; };
  }, [account.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const clearHistory = async () => {
    try {
      await walletTransactionService.deleteTransactionsForAccount(account.id);
      await loadTransactions();
      toast.success('تاریخچهٔ این حساب پاک شد');
    } catch {
      toast.error('پاک کردن تاریخچه انجام نشد');
    }
  };

  const handleClearHistoryClick = () => {
    toast('کل تاریخچه‌ی این حساب پاک شود؟', {
      action: { label: 'بله، پاک کن', onClick: clearHistory },
      cancel: { label: 'انصراف', onClick: () => {} },
    });
  };

  const newestFirst = (transactions ?? [])
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => b.transaction.date.localeCompare(a.transaction.date) || b.index - a.index);
  const totalPages = Math.max(1, Math.ceil(newestFirst.length / TRANSACTIONS_PER_PAGE));
  const pageItems = newestFirst.slice((page - 1) * TRANSACTIONS_PER_PAGE, page * TRANSACTIONS_PER_PAGE);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="wallet-transaction-history-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <div className="flex items-start justify-between gap-3 mb-1 pr-6 pl-10">
        <h2 id="wallet-transaction-history-title" className="text-[15px] font-bold">{account.name}</h2>
        <button type="button" onClick={handleClearHistoryClick} disabled={transactions === null || transactions.length === 0} className="text-[11px] font-medium rounded-[10px] px-3 py-2 text-[#d95050] bg-[#fdecec] hover:bg-[#fbe0e0] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">پاک کردن کل تاریخچه</button>
      </div>
      <p className="text-[11px] text-[#969eb2] mb-4">تاریخچهٔ تراکنش‌ها</p>
      {transactions === null ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-6">در حال بارگذاری...</p> : newestFirst.length === 0 ? <div className="text-center py-6">
        <p className="text-[12px] text-[#656e87] leading-[1.9]">هنوز تراکنشی برای این حساب ثبت نشده است.</p>
      </div> : <>
      <ul className="m-0 p-0 list-none grid gap-[6px]">
        {pageItems.map(({ transaction }) => <li key={transaction.id} className={transaction.type === 'increase' ? 'border border-[#c8ecd4] bg-[#f0fdf5] rounded-[12px] py-2 px-3' : transaction.type === 'decrease' ? 'border border-[#f3c8c8] bg-[#fdf0f0] rounded-[12px] py-2 px-3' : 'border border-[#f0dca0] bg-[#fffbf0] rounded-[12px] py-2 px-3'}>
          <div className="flex items-center justify-between gap-2">
            <span className={transaction.type === 'increase' ? 'text-[11px] font-medium text-[#1f9d55] bg-[#d7f5e0] rounded-[8px] px-2 py-[2px]' : transaction.type === 'decrease' ? 'text-[11px] font-medium text-[#d95050] bg-[#fde3e3] rounded-[8px] px-2 py-[2px]' : 'text-[11px] font-medium text-[#d7a144] bg-[#fff5df] rounded-[8px] px-2 py-[2px]'}>{transaction.type === 'increase' ? 'افزایش' : transaction.type === 'decrease' ? 'کاهش' : 'جایگذاری'}</span>
            <span className="text-[11px] text-[#999fb2]">{formatDate(transaction.date)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1 text-[12px] text-[#2a2f3d]">
            <span>{format(transaction.amount)} تومان</span>
          </div>
          {transaction.note && <p className="text-[11px] text-[#9096aa] mt-1">{transaction.note}</p>}
        </li>)}
      </ul>
      {newestFirst.length > TRANSACTIONS_PER_PAGE && <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#eef0f7] text-[11px] text-[#7a8097]">
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#5264e8] transition-colors">قبلی</button>
        <span>صفحه {format(page)} از {format(totalPages)}</span>
        <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#5264e8] transition-colors">بعدی</button>
      </div>}
      </>}
    </section>
  </div>;
}
