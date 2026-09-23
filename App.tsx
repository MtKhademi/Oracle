import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { assets, type Asset } from './src/assets';
import { loadAssets, saveAssets } from './src/storage';

const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);

const iconTint: Record<Asset['icon'], string> = {
  gold: 'text-[#d7a144] bg-[#fff5df]',
  fund: 'text-[#6e68dc] bg-[#f0edff]',
  cash: 'text-[#4ab3b4] bg-[#e5f7f6]',
  usdt: 'text-[#3daf99] bg-[#e6f6f0]',
  btc: 'text-[#efa451] bg-[#fff1e3]',
  eth: 'text-[#617cdb] bg-[#ecf0ff]',
  other: 'text-[#6b7280] bg-[#eef0f3]',
};

const iconLabel: Record<Asset['icon'], string> = {
  gold: 'طلا',
  fund: 'صندوق',
  cash: 'نقد',
  usdt: 'تتر',
  btc: 'بیت‌کوین',
  eth: 'اتریوم',
  other: 'سایر',
};

const iconOptions = Object.keys(iconLabel) as Asset['icon'][];

const EXPECTED_IMPORT_HEADERS = ['نام دارایی', 'دسته‌بندی', 'تعداد', 'واحد', 'قیمت واحد (تومان)'];

const importCategoryToIcon: Record<string, Asset['icon']> = {
  'طلا': 'gold',
  'صندوق': 'fund',
  'نقد': 'cash',
  'تتر': 'usdt',
  'بیت‌کوین': 'btc',
  'اتریوم': 'eth',
  'سایر': 'other',
};

function parseImportRows(rows: unknown[][]): { assets: Asset[]; skipped: number } | null {
  const header = (rows[0] ?? []).map(cell => String(cell ?? '').trim());
  const headerMatches = header.length === EXPECTED_IMPORT_HEADERS.length && EXPECTED_IMPORT_HEADERS.every((h, i) => h === header[i]);
  if (!headerMatches) return null;

  const parsed: Asset[] = [];
  let skipped = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const isEmpty = row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
    if (isEmpty) break;
    const quantity = Number(row[2]);
    if (!Number.isFinite(quantity) || quantity <= 0) break;
    const icon = importCategoryToIcon[String(row[1] ?? '').trim()];
    if (!icon) { skipped++; continue; }
    parsed.push({ id: crypto.randomUUID(), name: String(row[0] ?? '').trim(), quantity, unit: String(row[3] ?? '').trim(), unitPrice: Number(row[4]), icon });
  }
  return { assets: parsed, skipped };
}

function UploadIcon() {
  return <svg className="w-4 h-4 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v10"/>
    <path d="m8 9 4 4 4-4"/>
    <path d="M5 19h14"/>
  </svg>;
}

const assetIconBase = 'w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] [@media(min-width:351px)_and_(max-width:480px)]:w-[41px] [@media(min-width:351px)_and_(max-width:480px)]:h-[41px] max-[351px]:w-[35px] max-[351px]:h-[35px]';

function AssetIcon({ type }: { type: string }) {
  if (type === 'btc' || type === 'usdt') return <span className="font-[Arial,sans-serif] text-[27px] leading-none font-semibold">{type === 'btc' ? '₿' : '₮'}</span>;
  return <svg className="w-6 h-6 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'gold' ? <><path d="m7 7-4 11h18L17 7Z"/><path d="M7 7h10M8 14h8M10 10h4"/></> : type === 'cash' ? <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M4 6V5a2 2 0 0 1 2-2h12v3M21 11h-6v5h6"/><path d="M17 13.5h.01"/></> : type === 'eth' ? <><path d="m12 2 6 10-6 4-6-4Zm-6 13 6 7 6-7-6 4Z"/><path d="M12 2v14M6 12l6-3 6 3"/></> : <><path d="M4 19h16M6 15v-3m6 3V9m6 6V5M4 8l6-4 5 2 5-3"/></>}
  </svg>;
}

function AssetRow({ asset, onDelete, onEdit }: { asset: Asset; onDelete: (id: string) => void; onEdit: (id: string, quantity: number, unitPrice: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState(String(asset.quantity));
  const [draftUnitPrice, setDraftUnitPrice] = useState(String(asset.unitPrice));
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraftQuantity(String(asset.quantity));
    setDraftUnitPrice(String(asset.unitPrice));
    setError(null);
    setIsEditing(true);
  };

  const save = () => {
    const quantity = Number(draftQuantity);
    const unitPrice = Number(draftUnitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setError('عدد نامعتبر است.');
      return;
    }
    onEdit(asset.id, quantity, unitPrice);
    setIsEditing(false);
  };

  return <li className="bg-white border border-[#eef0f7] rounded-[17px] flex items-center gap-[15px] py-[17px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:p-[14px] [@media(min-width:351px)_and_(max-width:480px)]:gap-[12px] [@media(min-width:351px)_and_(max-width:480px)]:py-[15px] [@media(min-width:351px)_and_(max-width:480px)]:px-[14px] max-[351px]:gap-[9px] max-[351px]:py-[13px] max-[351px]:px-[10px]">
    <span className={`${assetIconBase} ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
    <div className="flex-1 min-w-0">
      <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{asset.name}</h3>
      {isEditing ? <div className="flex flex-wrap items-center gap-[6px] mt-[6px]">
        <input type="number" step="any" value={draftQuantity} onChange={e => setDraftQuantity(e.target.value)} className="w-[90px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`مقدار ${asset.name}`} />
        <span className="text-[11px] text-[#999fb2]">{asset.unit}</span>
        <input type="number" step="any" value={draftUnitPrice} onChange={e => setDraftUnitPrice(e.target.value)} className="w-[110px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`قیمت واحد ${asset.name} به تومان`} />
        {error && <span className="text-[10px] text-[#d95050] w-full">{error}</span>}
      </div> : <p className="text-[11px] text-[#999fb2] mt-[5px]">{format(asset.quantity, 8)} {asset.unit}</p>}
    </div>
    <div className="text-left shrink-0 flex flex-col gap-[6px] items-end">
      {!isEditing && <div className="flex flex-col gap-[5px] items-end"><strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] [@media(min-width:351px)_and_(max-width:480px)]:text-[14px] max-[351px]:text-[12px]">{format(asset.quantity * asset.unitPrice)}</strong><span className="text-[#a2a8b9] text-[10px]">تومان</span></div>}
      <div className="flex gap-[8px]">
        {isEditing ? <>
          <button type="button" onClick={save} className="text-[10px] font-medium text-white bg-[#5264e8] rounded-[8px] px-2 py-1">ذخیره</button>
          <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] text-[#9096aa] border border-[#eef0f7] rounded-[8px] px-2 py-1">انصراف</button>
        </> : <>
          <button type="button" onClick={startEdit} className="text-[10px] text-[#77809c] cursor-pointer px-2 rounded-md hover:bg-[#eef0ff] transition-colors" aria-label={`ویرایش ${asset.name}`}>ویرایش</button>
          <button type="button" onClick={() => onDelete(asset.id)} className="text-[10px] text-[#d95050] cursor-pointer px-2 rounded-md hover:bg-[#fdecec] transition-colors" aria-label={`حذف ${asset.name}`}>حذف</button>
        </>}
      </div>
    </div>
  </li>;
}

export default function App() {
  const [items, setItems] = useState<Asset[]>(() => loadAssets() ?? assets);
  const [isSample, setIsSample] = useState(() => loadAssets() === null);

  useEffect(() => { saveAssets(items); }, [items]);

  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [formIcon, setFormIcon] = useState<Asset['icon']>('gold');
  const [formError, setFormError] = useState<string | null>(null);

  const total = items.reduce((sum, asset) => sum + asset.quantity * asset.unitPrice, 0);

  const handleAddSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const quantity = Number(formQuantity);
    const unitPrice = Number(formUnitPrice);
    if (!formName.trim() || !formUnit.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setFormError('نام، مقدار، واحد و قیمت واحد را به‌درستی پر کنید.');
      return;
    }
    const newAsset: Asset = { id: crypto.randomUUID(), name: formName.trim(), quantity, unit: formUnit.trim(), unitPrice, icon: formIcon };
    setItems(prev => [...prev, newAsset]);
    setIsSample(false);
    setFormName('');
    setFormQuantity('');
    setFormUnit('');
    setFormUnitPrice('');
    setFormIcon('gold');
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(asset => asset.id !== id));
    setIsSample(false);
  };

  const handleEdit = (id: string, quantity: number, unitPrice: number) => {
    setItems(prev => prev.map(asset => asset.id === id ? { ...asset, quantity, unitPrice } : asset));
    setIsSample(false);
  };

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error('فقط فایل اکسل (.xlsx یا .xls) پذیرفته می‌شود');
      return;
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const result = parseImportRows(rows);
    if (!result) {
      toast.error('فرمت فایل با قالب مورد انتظار مطابقت ندارد');
      return;
    }
    setItems(prev => [...prev, ...result.assets]);
    if (result.assets.length > 0) setIsSample(false);
    const message = `${format(result.assets.length)} دارایی وارد شد`;
    toast.success(result.skipped > 0 ? `${message}، ${format(result.skipped)} ردیف نامعتبر رد شد` : message);
  };

  return <div>
    <header className="bg-[#5264e8] text-white h-[224px] min-[1050px]:h-[220px] max-[481px]:h-[198px]"><div className="max-w-[900px] mx-auto pt-[35px] pb-[35px] px-8 flex items-center justify-between min-[1050px]:px-6 max-[481px]:pt-[25px] max-[481px]:pb-[25px] max-[481px]:px-[22px]">
      <a className="flex items-center gap-3 text-[22px] font-bold no-underline max-[481px]:text-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[5px] focus-visible:rounded-[10px]" href="./" aria-label="Oracle، صفحه اصلی"><span className="h-[46px] w-[46px] border border-[#ffffff40] bg-[#ffffff15] rounded-[15px] grid place-items-center max-[481px]:h-[41px] max-[481px]:w-[41px]"><svg className="w-[30px] h-[30px] block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 15v-3m4 3V8m4 7v-5"/></svg></span><span>Oracle<span className="block text-[11px] font-normal text-[#e0e4ff] mt-[1px]">سرمایه‌های من</span></span></a>
      <span className="text-[12px] text-[#e0e4ff] max-[481px]:text-[10px] max-[351px]:hidden">یک نگاه، همهٔ دارایی‌ها</span>
    </div></header>
    <main className="max-w-[800px] mx-auto mt-[-89px] px-6 pb-9 relative min-[1050px]:max-w-[900px] min-[1050px]:grid min-[1050px]:grid-cols-[300px_1fr] min-[1050px]:gap-5 min-[1050px]:items-start min-[1050px]:mt-[-65px] max-[481px]:mt-[-77px] max-[481px]:px-[18px] max-[481px]:pb-[28px]">
      <section className="bg-white rounded-[22px] pt-[26px] px-8 pb-0 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] min-[1050px]:sticky min-[1050px]:top-[28px] min-[1050px]:p-6 min-[1050px]:pb-0 max-[481px]:pt-[21px] max-[481px]:px-[23px] max-[481px]:pb-0 max-[481px]:rounded-[20px]" aria-labelledby="total-title">
        <div className="flex justify-between items-center"><span className="w-[42px] h-[42px] rounded-[13px] grid place-items-center bg-[#eef0ff] text-[#5264e8]"><AssetIcon type="cash"/></span>{isSample && <span className="text-[11px] text-[#77809c] bg-[#f6f7fb] border border-[#eef0f7] rounded-[20px] py-1 px-3">نمایش نمونه</span>}</div>
        <h1 id="total-title" className="text-[14px] text-[#7a8097] font-normal mt-5 min-[1050px]:mt-[25px] max-[481px]:mt-4">ارزش کل دارایی‌ها</h1>
        <div className="flex items-baseline gap-[10px] mt-[5px] mb-[23px] min-[1050px]:flex-wrap min-[1050px]:gap-[0_8px] max-[481px]:mb-[19px]"><strong className="text-[44px] font-bold text-[#4659d9] leading-[1.55] tracking-[-1px] min-[1050px]:text-[35px] [@media(min-width:351px)_and_(max-width:480px)]:text-[35px] max-[351px]:text-[30px]">{format(total)}</strong><span className="text-[13px] text-[#8990a9]">تومان</span></div>
        <div className="flex justify-between border-t border-[#f0f1f7] py-4 text-[#9096aa] text-[11px]"><span className="flex items-center gap-[7px]"><i className="h-[6px] w-[6px] bg-[#8593ee] rounded-full"/>سرمایه‌ها، کنار هم</span><span>{format(items.length)} دارایی</span></div>
      </section>
      <section className="mt-[31px] min-[1050px]:mt-0 min-[1050px]:bg-white min-[1050px]:border min-[1050px]:border-[#eceef5] min-[1050px]:rounded-[22px] min-[1050px]:p-[22px] max-[481px]:mt-[27px]" aria-labelledby="assets-title">
        <div className="flex justify-between items-center px-1 mb-[10px]">
          <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" aria-hidden="true" tabIndex={-1} />
          <button type="button" onClick={() => importInputRef.current?.click()} aria-label="ایمپورت اکسل" className="grid place-items-center text-[#5264e8] bg-[#eef0ff] rounded-[10px] p-2 cursor-pointer hover:bg-[#e2e5ff] transition-colors"><UploadIcon/></button>
        </div>
        <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]"><h2 id="assets-title" className="text-[17px] font-bold max-[481px]:text-[15px]">دارایی‌های من</h2><span className="text-[11px] text-[#656e87]">ارزش به تومان</span></div>
        <ul className="list-none m-0 p-0 grid gap-[10px]">{items.map(asset => <AssetRow key={asset.id} asset={asset} onDelete={handleDelete} onEdit={handleEdit}/>)}</ul>
      </section>
      <section className="mt-[20px] bg-white border border-[#eef0f7] rounded-[20px] p-5 max-[481px]:rounded-[16px] max-[481px]:p-4 min-[1050px]:col-span-full" aria-labelledby="add-asset-title">
        <h2 id="add-asset-title" className="text-[15px] font-bold mb-4">افزودن دارایی جدید</h2>
        <form onSubmit={handleAddSubmit} className="grid gap-[10px] min-[560px]:grid-cols-2">
          <label className="text-[11px] text-[#7a8097] grid gap-1">نام
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثلاً سکه بهار آزادی" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1">دسته/آیکن
            <select value={formIcon} onChange={e => setFormIcon(e.target.value as Asset['icon'])} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d] bg-white">
              {iconOptions.map(key => <option key={key} value={key}>{iconLabel[key]}</option>)}
            </select>
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1">مقدار
            <input type="number" step="any" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1">واحد
            <input type="text" value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="گرم/واحد/تومان/USDT/BTC/ETH" className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          <label className="text-[11px] text-[#7a8097] grid gap-1 min-[560px]:col-span-2">قیمت واحد به تومان
            <input type="number" step="any" value={formUnitPrice} onChange={e => setFormUnitPrice(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
          </label>
          {formError && <p className="text-[11px] text-[#d95050] min-[560px]:col-span-2">{formError}</p>}
          <button type="submit" className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 min-[560px]:col-span-2">افزودن دارایی</button>
        </form>
      </section>
      {isSample && <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] mt-[25px] min-[1050px]:col-span-full min-[1050px]:mt-0">مقادیر فعلاً نمونه‌اند و دارایی واقعی شما نیستند.</p>}
    </main>
  </div>;
}
