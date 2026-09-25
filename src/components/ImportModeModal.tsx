import { useEffect, useRef, type ChangeEvent } from 'react';
import type { ImportMode } from '../services/assetService';
import { CloseIcon } from './icons';

const importOptions: { mode: ImportMode; title: string; description: string; color: string }[] = [
  { mode: 'replace', title: 'جایگذاری با دارایی فعلی', description: 'مقدار و قیمت وارد شده جایگزین مقدار و قیمت فعلی می‌شود. مناسب وقتی فایل بازتاب کل دارایی فعلی شماست.', color: '#5264e8' },
  { mode: 'add', title: 'اضافه کردن به دارایی فعلی', description: 'مقدار وارد شده به مقدار فعلی اضافه می‌شود و به‌عنوان خرید در تاریخچهٔ تراکنش‌ها ثبت می‌شود.', color: '#1f9d55' },
  { mode: 'subtract', title: 'کم کردن از دارایی فعلی', description: 'مقدار وارد شده از مقدار فعلی کم می‌شود و به‌عنوان فروش در تاریخچهٔ تراکنش‌ها ثبت می‌شود.', color: '#d95050' },
];

export function ImportModeModal({ onClose, onFileSelected }: { onClose: () => void; onFileSelected: (mode: ImportMode, file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingModeRef = useRef<ImportMode>('replace');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const chooseMode = (mode: ImportMode) => {
    pendingModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onFileSelected(pendingModeRef.current, file);
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="import-mode-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="import-mode-title" className="text-[15px] font-bold mb-1">حالت ایمپورت</h2>
      <p className="text-[11px] text-[#969eb2] mb-4">نحوهٔ اعمال فایل اکسل را انتخاب کنید</p>
      <div className="grid gap-[8px]">
        {importOptions.map(option => <button key={option.mode} type="button" onClick={() => chooseMode(option.mode)} className="w-full text-right border border-[#eef0f7] rounded-[12px] p-3 cursor-pointer transition-colors hover:border-[#5264e8] hover:bg-[#f6f7fb]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: option.color }}/>
            <span className="text-[13px] font-bold text-[#2a2f3d]">{option.title}</span>
          </span>
          <span className="block text-[11px] text-[#969eb2] leading-[1.8] mt-1">{option.description}</span>
        </button>)}
      </div>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" aria-hidden="true" tabIndex={-1} />
    </section>
  </div>;
}
