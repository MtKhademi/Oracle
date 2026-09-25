import { IconButton } from './IconButton';
import { PlusIcon, TrashIcon, UploadIcon } from './icons';

export function Toolbar({ onOpenImportModal, onClearAll, onAdd }: {
  onOpenImportModal: () => void;
  onClearAll: () => void;
  onAdd: () => void;
}) {
  return <div className="flex justify-between items-center px-1 mb-[10px]">
    <div className="flex gap-[8px]">
      <IconButton icon={<UploadIcon/>} onClick={onOpenImportModal} ariaLabel="ایمپورت اکسل" tone="neutral"/>
      <IconButton icon={<TrashIcon/>} onClick={onClearAll} ariaLabel="پاک کردن همه دارایی‌ها" tone="danger"/>
      <IconButton icon={<PlusIcon/>} onClick={onAdd} ariaLabel="افزودن دارایی جدید" tone="neutral"/>
    </div>
  </div>;
}
