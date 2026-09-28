import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { walletService, type WalletAccount } from '../services/walletService';
import { format } from '../format';
import { AssetIcon, iconTint } from './AssetIcon';
import { IconButton } from './IconButton';
import { CloseIcon, PencilIcon, PlusIcon, TrashIcon } from './icons';
import { WalletAccountModal } from './WalletTab';

const accountIconBase = 'w-[40px] h-[40px] shrink-0 grid place-items-center rounded-[13px]';

// One green/red line per bank-detail field: the field's own value in green
// (#1f9d55) when set (non-blank after trim), or a red (#d95050) "—"
// placeholder when empty (see §6av, wording change of the §6aq status lines).
const statusLine = (label: string, value?: string) => {
  const set = Boolean(value && value.trim() !== '');
  return <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-[#9096aa]">{label}</span>
    <span className={`text-[11px] font-medium ${set ? 'text-[#1f9d55]' : 'text-[#d95050]'}`}>{set ? value : '—'}</span>
  </div>;
};

// The "مدیریت حساب‌ها" (manage accounts) modal (see AI-KNOWLEDGE.md §6an) — the
// home of real wallet-account add/edit/delete. Lists every account except the
// seeded "نقدی" (which is always shown in the main "کیف پول" list instead —
// see §6au), each with edit + real-delete actions. Adding a new account also
// happens here, via the exported `WalletAccountModal` (add mode). The "کیف
// پول" tab's header "+" button opens this. Every mutation pushes the
// service's returned full list up through `onAccountsChanged` so App.tsx stays
// canonical (same items ↔ assetService pattern). Shelled like the other modals
// (backdrop / Escape / "×" / stopPropagation on the card).
export function ManageWalletAccountsModal({ accounts, onAccountsChanged, onClose }: { accounts: WalletAccount[]; onAccountsChanged: (accounts: WalletAccount[]) => void; onClose: () => void }) {
  const [modal, setModal] = useState<{ account: WalletAccount | null } | null>(null);

  useEffect(() => {
    // The nested add/edit form (WalletAccountModal) adds its own Escape
    // listener; while it's open, let only that listener close things so Escape
    // dismisses the topmost modal first, not this one too.
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && modal === null) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, modal]);

  const handleAccountSubmit = async (name: string, balance: number, bankName?: string, cardNumber?: string, accountNumber?: string, shebaNumber?: string, cardPin1?: string, cardPin2?: string): Promise<boolean> => {
    const editing = modal?.account ?? null;
    try {
      const changes = { name, balance, bankName, cardNumber, accountNumber, shebaNumber, cardPin1, cardPin2 };
      const next = editing ? await walletService.updateAccount(editing.id, changes) : await walletService.addAccount(changes);
      toast.success(editing ? 'تغییرات ذخیره شد' : 'حساب اضافه شد');
      onAccountsChanged(next);
      return true;
    } catch {
      toast.error('ذخیره حساب انجام نشد');
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const next = await walletService.deleteAccount(id);
      onAccountsChanged(next);
      toast.success('حساب حذف شد');
    } catch {
      toast.error('حذف حساب انجام نشد');
    }
  };

  // Display-only: the seeded "نقدی" is never listed here — it is always shown
  // in the main "کیف پول" list instead (see AI-KNOWLEDGE.md §6au). It still
  // exists in storage and self-heals on load; it just is not managed from this
  // modal.
  const listedAccounts = accounts.filter(account => account.name !== 'نقدی');

  return <>
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="manage-wallet-accounts-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <div className="mb-4 pr-1 pl-10">
        <h2 id="manage-wallet-accounts-title" className="text-[15px] font-bold">مدیریت حساب‌ها</h2>
      </div>
      <div className="flex mb-4">
        <IconButton icon={<PlusIcon/>} onClick={() => setModal({ account: null })} ariaLabel="افزودن حساب" tone="neutral"/>
      </div>
      {listedAccounts.length === 0
        ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">هنوز حسابی ثبت نشده</p>
        : <ul className="list-none m-0 p-0 grid gap-[10px]">{listedAccounts.map(account => <li key={account.id} className="bg-white border border-[#eef0f7] rounded-[14px] flex items-center gap-[12px] py-[10px] px-[14px] min-w-0">
          <span className={`${accountIconBase} ${iconTint.cash}`} aria-hidden="true"><AssetIcon type="cash"/></span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{account.name}</h3>
            {account.bankName && <p className="m-0 text-[11px] text-[#9096aa]">{account.bankName}</p>}
            <div className="grid grid-cols-2 gap-x-3 gap-y-[3px] mt-[5px]">
              {statusLine('بانک', account.bankName)}
              {statusLine('کارت', account.cardNumber)}
              {statusLine('حساب', account.accountNumber)}
              {statusLine('شبا', account.shebaNumber)}
              {statusLine('رمز اول', account.cardPin1)}
              {statusLine('رمز دوم', account.cardPin2)}
            </div>
          </div>
          <div className="flex items-center gap-[10px] shrink-0">
            <span className="text-[12px] text-[#969eb2] whitespace-nowrap [font-variant-numeric:tabular-nums]">{format(account.balance)} <span className="text-[#a2a8b9] text-[10px]">تومان</span></span>
            {account.name !== 'نقدی' && <IconButton icon={<PencilIcon/>} onClick={() => setModal({ account })} ariaLabel="ویرایش" tone="neutral" variant="ghost"/>}
            {account.name !== 'نقدی' && <IconButton icon={<TrashIcon/>} onClick={() => handleDelete(account.id)} ariaLabel="حذف" tone="danger" variant="ghost"/>}
          </div>
        </li>)}</ul>}
    </section>
    </div>
    {modal && <WalletAccountModal account={modal.account} onClose={() => setModal(null)} onSubmit={handleAccountSubmit}/>}
  </>;
}
