import { IconButton } from './IconButton';
import { PencilIcon, PlusIcon, TrashIcon, UploadIcon } from './icons';
import { AssetSortMenu, type AssetSortMode } from './AssetSortMenu';

// Single header row above the "دارایی‌های من" list on the "کیف پول" tab —
// merges what used to be two separate rows (the icon toolbar and the
// heading/sort-menu row) into one, since the "دارایی‌های من" heading itself
// was removed (see §6q of AI-KNOWLEDGE.md): import/clear-all/add/
// add-transaction icons on the right, the sort menu + "ارزش به تومان" label
// on the left.
export function Toolbar({ onOpenImportModal, onClearAll, onAdd, onAddTransaction, sortMode, onSortModeChange }: {
  onOpenImportModal: () => void;
  onClearAll: () => void;
  onAdd: () => void;
  onAddTransaction: () => void;
  sortMode: AssetSortMode;
  onSortModeChange: (mode: AssetSortMode) => void;
}) {
  return <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]">
    <div className="flex gap-[8px]">
      <IconButton icon={<UploadIcon/>} onClick={onOpenImportModal} ariaLabel="ایمپورت اکسل" tone="neutral"/>
      <IconButton icon={<TrashIcon/>} onClick={onClearAll} ariaLabel="پاک کردن همه دارایی‌ها" tone="danger"/>
      <IconButton icon={<PlusIcon/>} onClick={onAdd} ariaLabel="افزودن دارایی جدید" tone="neutral"/>
      <IconButton icon={<PencilIcon/>} onClick={onAddTransaction} ariaLabel="ثبت تراکنش جدید" tone="neutral"/>
    </div>
    <span className="flex items-center gap-1"><AssetSortMenu value={sortMode} onChange={onSortModeChange}/><span className="text-[11px] text-[#656e87]">ارزش به تومان</span></span>
  </div>;
}
