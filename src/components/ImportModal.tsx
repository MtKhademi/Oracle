import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { ImportMode } from '../services/assetService';
import { CloseIcon } from './icons';

const modeOptions: { mode: ImportMode; title: string; description: string; color: string }[] = [
  { mode: 'replace', title: 'جایگذاری با دارایی فعلی', description: 'مقدار و قیمت وارد شده جایگزین مقدار و قیمت فعلی می‌شود. تراکنشی ثبت نمی‌شود.', color: '#5264e8' },
  { mode: 'add', title: 'اضافه کردن به دارایی فعلی', description: 'مقدار وارد شده به مقدار فعلی اضافه می‌شود (یا دارایی تازه ساخته می‌شود) و به‌عنوان خرید ثبت می‌شود.', color: '#1f9d55' },
  { mode: 'subtract', title: 'کم کردن از دارایی فعلی', description: 'مقدار وارد شده از مقدار فعلی کم می‌شود و به‌عنوان فروش ثبت می‌شود؛ بدون دارایی مشابه، ردیف نادیده گرفته می‌شود.', color: '#d95050' },
];

// Unified file+mode import modal: combines picking a file AND the DEFAULT
// mode (applied to rows that leave their own نوع column empty) into one
// screen, instead of two separate steps like the previous ImportModeModal.
export function ImportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (defaultMode: ImportMode, file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [defaultMode, setDefaultMode] = useState<ImportMode>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (chosen) setFile(chosen);
  };

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(defaultMode, file);
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="import-modal-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="import-modal-title" className="text-[15px] font-bold mb-1">ایمپورت اکسل</h2>
      <p className="text-[11px] text-[#969eb2] mb-4">فایل را انتخاب کنید و حالت پیش‌فرض ردیف‌هایی که ستون «نوع» را خالی گذاشته‌اند را مشخص کنید</p>

      <div className="mb-4">
        <span className="block text-[11px] text-[#7a8097] mb-1">فایل اکسل</span>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" aria-hidden="true" tabIndex={-1} />
        {file ? (
          <div className="flex items-center justify-between gap-2 border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[12px] text-[#2a2f3d]">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 text-[11px] font-medium text-[#5264e8] cursor-pointer hover:underline">تغییر فایل</button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-center border border-dashed border-[#c7ccdd] rounded-[10px] px-3 py-3 text-[12px] font-medium text-[#5264e8] cursor-pointer hover:bg-[#f6f7fb] transition-colors">انتخاب فایل اکسل...</button>
        )}
      </div>

      <div className="mb-5">
        <span className="block text-[11px] text-[#7a8097] mb-2">حالت پیش‌فرض</span>
        <div className="grid gap-[8px]" role="radiogroup" aria-label="حالت پیش‌فرض ایمپورت">
          {modeOptions.map(option => {
            const selected = defaultMode === option.mode;
            return <button key={option.mode} type="button" role="radio" aria-checked={selected} onClick={() => setDefaultMode(option.mode)} className={`w-full text-right border rounded-[12px] p-3 cursor-pointer transition-colors ${selected ? 'border-[#5264e8] bg-[#f6f7fb]' : 'border-[#eef0f7] hover:border-[#5264e8] hover:bg-[#f6f7fb]'}`}>
              <span className="flex items-center gap-2">
                <span className={`w-[14px] h-[14px] rounded-full shrink-0 border-2 grid place-items-center ${selected ? 'border-[#5264e8]' : 'border-[#c7ccdd]'}`}>
                  {selected && <span className="w-[6px] h-[6px] rounded-full" style={{ background: option.color }}/>}
                </span>
                <span className="text-[13px] font-bold text-[#2a2f3d]">{option.title}</span>
              </span>
              <span className="block text-[11px] text-[#969eb2] leading-[1.8] mt-1 pr-[22px]">{option.description}</span>
            </button>;
          })}
        </div>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!file} className="w-full bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">بارگذاری</button>
    </section>
  </div>;
}
