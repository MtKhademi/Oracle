import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { IconButton } from './IconButton';
import { PlusIcon, TrashIcon, UploadIcon } from './icons';

export function Toolbar({ onImportFile, onClearAll, onAdd }: {
  onImportFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
  onAdd: () => void;
}) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return <div className="flex justify-between items-center px-1 mb-[10px]">
    <div className="flex gap-[8px]">
      <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={onImportFile} className="hidden" aria-hidden="true" tabIndex={-1} />
      <IconButton icon={<UploadIcon/>} onClick={() => importInputRef.current?.click()} ariaLabel="ایمپورت اکسل" tone="neutral"/>
      <IconButton icon={<TrashIcon/>} onClick={onClearAll} ariaLabel="پاک کردن همه دارایی‌ها" tone="danger"/>
      <IconButton icon={<PlusIcon/>} onClick={onAdd} ariaLabel="افزودن دارایی جدید" tone="neutral"/>
    </div>
  </div>;
}
