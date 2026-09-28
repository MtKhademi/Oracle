import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { walletService, type WalletAccount } from '../services/walletService';
import { walletTransactionService } from '../services/walletTransactionService';
import { format, formatWithThousands, stripToNumberString } from '../format';
import { AssetIcon, iconTint } from './AssetIcon';
import { IconButton } from './IconButton';
import { CloseIcon, HistoryIcon, PlusIcon, TrashIcon } from './icons';
import { SectionHeaderCard } from './SectionHeaderCard';
import { RecordWalletTransactionModal } from './RecordWalletTransactionModal';
import { WalletTransactionHistoryModal } from './WalletTransactionHistoryModal';
import { ManageWalletAccountsModal } from './ManageWalletAccountsModal';

const accountIconBase = 'w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] [@media(min-width:351px)_and_(max-width:480px)]:w-[41px] [@media(min-width:351px)_and_(max-width:480px)]:h-[41px] max-[351px]:w-[35px] max-[351px]:h-[35px]';

// The small add/edit form, shelled like RecordTransactionModal (backdrop /
// Escape / "×" / stopPropagation on the card). `account === null` means add
// mode; otherwise the form is pre-filled with that account's values (edit
// mode). `onSubmit` resolves true only when the save succeeded (it owns the
// walletService call + toasts), so the modal closes itself on success only.
// Exported since §6an: only `ManageWalletAccountsModal` opens it now (the
// wallet tab's "+" button routes there).
export function WalletAccountModal({ account, onClose, onSubmit }: { account: WalletAccount | null; onClose: () => void; onSubmit: (name: string, balance: number, bankName?: string, cardNumber?: string, accountNumber?: string, shebaNumber?: string, cardPin1?: string, cardPin2?: string) => Promise<boolean> }) {
  const [formName, setFormName] = useState(account ? account.name : '');
  const [formBalance, setFormBalance] = useState(account ? String(account.balance) : '0');
  const [formBankName, setFormBankName] = useState(account?.bankName ?? '');
  const [formCardNumber, setFormCardNumber] = useState(account?.cardNumber ?? '');
  const [formAccountNumber, setFormAccountNumber] = useState(account?.accountNumber ?? '');
  const [formShebaNumber, setFormShebaNumber] = useState(account?.shebaNumber ?? '');
  const [formCardPin1, setFormCardPin1] = useState(account?.cardPin1 ?? '');
  const [formCardPin2, setFormCardPin2] = useState(account?.cardPin2 ?? '');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = formName.trim();
    const balance = formBalance === '' ? 0 : Number(formBalance);
    if (!name) {
      toast.error('نام حساب را وارد کنید.');
      return;
    }
    if (!Number.isFinite(balance) || balance < 0) {
      toast.error('موجودی را به‌درستی وارد کنید.');
      return;
    }
    const bankName = formBankName.trim() || undefined;
    const cardNumber = formCardNumber.trim() || undefined;
    const accountNumber = formAccountNumber.trim() || undefined;
    const shebaNumber = formShebaNumber.trim() || undefined;
    const cardPin1 = formCardPin1.trim() || undefined;
    const cardPin2 = formCardPin2.trim() || undefined;
    const saved = await onSubmit(name, balance, bankName, cardNumber, accountNumber, shebaNumber, cardPin1, cardPin2);
    if (saved) onClose();
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="wallet-account-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="wallet-account-title" className="text-[15px] font-bold mb-4">{account ? 'ویرایش حساب' : 'افزودن حساب'}</h2>
      <form onSubmit={handleSubmit} className="grid gap-[10px]">
        <label className="text-[11px] text-[#7a8097] grid gap-1">نام حساب
          <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثلا: کارت بانک ملی" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">نام بانک
          <input type="text" value={formBankName} onChange={e => setFormBankName(e.target.value)} placeholder="مثلا: بانک ملی" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">شماره کارت
          <input type="text" value={formCardNumber} onChange={e => setFormCardNumber(e.target.value)} placeholder="مثلا: 6104 3399 0000 0000" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">شماره حساب
          <input type="text" value={formAccountNumber} onChange={e => setFormAccountNumber(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">شماره شبا
          <input type="text" value={formShebaNumber} onChange={e => setFormShebaNumber(e.target.value)} placeholder="IRxx xxx xxx xxx xxx xxxx xxx" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">رمز اول
          <input type="text" inputMode="numeric" value={formCardPin1} onChange={e => setFormCardPin1(e.target.value)} placeholder="مثلا: 1234" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">رمز دوم
          <input type="text" inputMode="numeric" value={formCardPin2} onChange={e => setFormCardPin2(e.target.value)} placeholder="مثلا: 5678" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">موجودی به تومان
          <input type="text" inputMode="numeric" value={formatWithThousands(formBalance)} onChange={e => setFormBalance(stripToNumberString(e.target.value))} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <button type="submit" className="text-white text-[12px] font-medium rounded-[12px] px-4 py-2 bg-[#5264e8] cursor-pointer transition-colors">{account ? 'ذخیره تغییرات' : 'افزودن حساب'}</button>
      </form>
    </section>
  </div>;
}

// The "کیف پول" (wallet) tab content (see AI-KNOWLEDGE.md §6ad) — the
// owner's cash/bank accounts (e.g. "نقد", "کارت بانک ملی"), fully dynamic:
// each row's trash icon resets (balance → 0 + wipes that account's
// transaction history, behind a toast-confirm — it never deletes the account
// itself; see §6am), and real add/edit/delete now happens through the
// "مدیریت حساب‌ها" modal opened by the header "+" button (see §6an), persisted
// through walletService (localStorage). `accounts` is
// `null` until App.tsx's mount-time load resolves; every mutation pushes the
// service's returned full list back up through `onAccountsChanged` so
// App.tsx stays canonical (the same items ↔ assetService pattern).
export function WalletTab({ tabs, accounts, onAccountsChanged }: { tabs?: ReactNode; accounts: WalletAccount[] | null; onAccountsChanged: (accounts: WalletAccount[]) => void }) {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [recordFor, setRecordFor] = useState<WalletAccount | null>(null);
  const [historyFor, setHistoryFor] = useState<WalletAccount | null>(null);

  const handleResetAccount = (account: WalletAccount) => {
    const reset = async () => {
      try {
        await walletTransactionService.deleteTransactionsForAccount(account.id);
        const next = await walletService.updateAccount(account.id, { balance: 0 });
        onAccountsChanged(next);
        toast.success('موجودی و تاریخچه پاک شد');
      } catch {
        toast.error('پاک کردن موجودی و تاریخچه انجام نشد');
      }
    };
    toast('موجودی و کل تاریخچه‌ی این حساب پاک شود؟', {
      action: { label: 'بله، پاک کن', onClick: reset },
      cancel: { label: 'انصراف', onClick: () => {} },
    });
  };

  if (accounts === null) {
    return <SectionHeaderCard>
      {tabs}
      <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">در حال بارگذاری...</p>
    </SectionHeaderCard>;
  }

  // Display-only: the main list shows only non-"نقدی" accounts with a positive
  // balance. The seeded "نقدی" is never shown here (at any balance); it remains
  // visible, locked, and fully present in storage, and stays fully visible in
  // "مدیریت حساب‌ها", which keeps receiving the full, unfiltered `accounts`
  // prop (see AI-KNOWLEDGE.md §6ao/§6ap).
  const visibleAccounts = accounts.filter(account => account.balance > 0 && account.name !== 'نقدی');

  // Display-only: the rendered list is sorted by balance, highest first —
  // the `accounts` prop itself (state, storage, modals, onAccountsChanged)
  // keeps its stored order untouched (see AI-KNOWLEDGE.md §6al). Re-sorts
  // automatically whenever any add/edit/transaction changes a balance.
  const sortedAccounts = [...visibleAccounts].sort((a, b) => b.balance - a.balance);

  return <>
    <SectionHeaderCard>
      {tabs}
      <div className="flex justify-between items-center px-1 min-[1050px]:mb-[19px]">
        <IconButton icon={<PlusIcon/>} onClick={() => setIsManageOpen(true)} ariaLabel="مدیریت حساب‌ها" tone="neutral"/>
        <span className="text-[11px] text-[#656e87]">حساب‌های نقدی</span>
      </div>
    </SectionHeaderCard>
    {sortedAccounts.length === 0
      ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">هنوز حسابی ثبت نشده</p>
      : <ul className="list-none m-0 p-0 grid gap-[10px]">{sortedAccounts.map(account => <li key={account.id} className="bg-white border border-[#eef0f7] rounded-[17px] flex items-center gap-[15px] py-[12px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:py-[10px] min-[1050px]:px-[14px] [@media(min-width:351px)_and_(max-width:480px)]:gap-[12px] [@media(min-width:351px)_and_(max-width:480px)]:py-[11px] [@media(min-width:351px)_and_(max-width:480px)]:px-[14px] max-[351px]:gap-[9px] max-[351px]:py-[10px] max-[351px]:px-[10px]">
        <span className={`${accountIconBase} ${iconTint.cash}`} aria-hidden="true"><AssetIcon type="cash"/></span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{account.name}</h3>
          {account.bankName && <div className="grid gap-[2px] mt-[3px]">
            <p className="m-0 text-[11px] text-[#9096aa]">{account.bankName}</p>
          </div>}
        </div>
        <div className="text-left shrink-0 flex flex-col gap-[6px] items-end">
          <div className="flex items-baseline gap-[6px]"><strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] [@media(min-width:351px)_and_(max-width:480px)]:text-[14px] max-[351px]:text-[12px]">{format(account.balance)}</strong><span className="text-[#a2a8b9] text-[10px]">تومان</span></div>
          <div className="flex gap-[8px]">
            <IconButton icon={<HistoryIcon/>} onClick={() => setHistoryFor(account)} ariaLabel="تاریخچه" tone="neutral" variant="ghost"/>
            <IconButton icon={<PlusIcon/>} onClick={() => setRecordFor(account)} ariaLabel="ثبت تراکنش" tone="neutral" variant="ghost"/>
            <IconButton icon={<TrashIcon/>} onClick={() => handleResetAccount(account)} ariaLabel="صفر کردن موجودی و تاریخچه" tone="danger" variant="ghost"/>
          </div>
        </div>
      </li>)}</ul>}
    {isManageOpen && <ManageWalletAccountsModal accounts={accounts} onAccountsChanged={onAccountsChanged} onClose={() => setIsManageOpen(false)}/>}
    {historyFor && <WalletTransactionHistoryModal account={historyFor} onClose={() => setHistoryFor(null)}/>}
    {recordFor && <RecordWalletTransactionModal account={recordFor} onClose={() => setRecordFor(null)} onTransactionRecorded={onAccountsChanged}/>}
  </>;
}
