import { useEffect, useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { assets, type Asset } from './src/assets';
import { assetService } from './src/services/assetService';
import { getOrCreateCode } from './src/services/assetCodeRegistry';
import { authService } from './src/services/authService';
import { format } from './src/format';
import { AddAssetModal } from './src/components/AddAssetModal';
import { AssetRow } from './src/components/AssetRow';
import { AuthScreen } from './src/components/AuthScreen';
import { HamburgerIcon } from './src/components/icons';
import { ProfileModal } from './src/components/ProfileModal';
import { SideDrawer } from './src/components/SideDrawer';
import { SummaryCard } from './src/components/SummaryCard';
import { Toolbar } from './src/components/Toolbar';
import type { User } from './src/types';

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
    const name = String(row[0] ?? '').trim();
    // TODO(follow-up task): the add-asset form is now catalog-driven
    // (src/services/assetCatalog.ts, see AddAssetModal.tsx) and uses a catalog
    // entry's `symbol` directly as `code`. Excel import still uses the
    // auto-generated getOrCreateCode(icon, name) registry below — it needs to
    // be switched to match rows against the catalog (by name, presumably) and
    // use the matching entry's `symbol` as `code` instead, so imported rows
    // line up with the same identity as catalog-driven manual adds.
    const code = getOrCreateCode(icon, name);
    parsed.push({ id: crypto.randomUUID(), name, quantity, unit: String(row[3] ?? '').trim(), unitPrice: Number(row[4]), icon, code });
  }
  return { assets: parsed, skipped };
}

export default function App() {
  const [items, setItems] = useState<Asset[]>(assets);
  const [isSample, setIsSample] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(user => {
      setCurrentUser(user);
      setIsAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    assetService.listAssets().then(async stored => {
      if (stored === null) {
        // Nothing saved yet — still showing the static `assets` sample. Run
        // the same code-assignment path over it (registers each sample's
        // identity in the code registry, same as real data — see
        // assetCodeRegistry.ts) without ever persisting the sample list
        // itself through assetService: doing so would turn
        // `oracle_assets_v1` non-null and permanently flip `isSample` to
        // false, even though the owner hasn't actually entered anything.
        setItems(assets.map(asset => ({ ...asset, code: asset.code ?? getOrCreateCode(asset.icon, asset.name) })));
        return;
      }
      // One-time migration: assign a permanent code to any asset saved
      // before this field existed, then persist it so this only runs once.
      let next = stored;
      for (const asset of stored) {
        if (asset.code) continue;
        const code = getOrCreateCode(asset.icon, asset.name);
        next = await assetService.updateAsset(asset.id, { code });
      }
      setItems(next);
      setIsSample(false);
    });
  }, []);

  const handleLogout = async () => {
    await authService.logOut();
    setCurrentUser(null);
    setIsMenuOpen(false);
  };

  const total = items.reduce((sum, asset) => sum + asset.quantity * asset.unitPrice, 0);

  const handleAddAsset = async (newAsset: Asset) => {
    // Merge-by-code: a catalog-driven add (see AddAssetModal.tsx) whose `code`
    // (the catalog symbol) matches an asset already in the list is treated as
    // "I'm adding to what I already have" — quantity is ADDED to the existing
    // amount (unlike Excel import, which replaces) and unit price is updated to
    // the newly entered one. No match (or no code) creates a new asset as before.
    const existing = newAsset.code ? items.find(asset => asset.code === newAsset.code) : undefined;
    if (existing) {
      const next = await assetService.updateAsset(existing.id, { quantity: existing.quantity + newAsset.quantity, unitPrice: newAsset.unitPrice });
      setItems(next);
      setIsSample(false);
      toast.success(`مقدار ${existing.name} افزایش یافت`);
      return;
    }
    const next = await assetService.addAsset(newAsset);
    setItems(next);
    setIsSample(false);
    toast.success('دارایی جدید اضافه شد');
  };

  const handleDelete = async (id: string) => {
    const next = await assetService.deleteAsset(id);
    setItems(next);
    setIsSample(false);
  };

  const handleEdit = async (id: string, quantity: number, unitPrice: number) => {
    const next = await assetService.updateAsset(id, { quantity, unitPrice });
    setItems(next);
    setIsSample(false);
  };

  const clearAllAssets = async () => {
    const next = await assetService.clearAssets();
    setItems(next);
    setIsSample(false);
    toast.success('همه دارایی‌ها پاک شد');
  };

  const handleClearAllClick = () => {
    toast('همه دارایی‌ها پاک شوند؟', {
      action: { label: 'بله، پاک کن', onClick: clearAllAssets },
      cancel: { label: 'انصراف', onClick: () => {} },
    });
  };

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
    if (result.assets.length === 0) {
      toast.error('هیچ ردیف معتبری برای وارد کردن پیدا نشد');
      return;
    }
    const { assets: next, added, updated } = await assetService.importAssets(result.assets);
    setItems(next);
    setIsSample(false);
    const parts = [];
    if (added > 0) parts.push(`${format(added)} دارایی اضافه شد`);
    if (updated > 0) parts.push(`${format(updated)} دارایی به‌روزرسانی شد`);
    const message = parts.join('، ');
    if (result.skipped > 0) {
      toast.warning(`${message}، ${format(result.skipped)} ردیف نامعتبر رد شد`);
    } else {
      toast.success(message);
    }
  };

  if (!isAuthChecked) {
    return <div className="min-h-screen bg-[#f5f6fb] grid place-items-center"><span className="text-[13px] text-[#969eb2]">در حال بارگذاری...</span></div>;
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={setCurrentUser}/>;
  }

  return <div>
    <header className="bg-[#5264e8] text-white h-[224px] min-[1050px]:h-[220px] max-[481px]:h-[198px]"><div className="max-w-[900px] mx-auto pt-[35px] pb-[35px] px-8 flex items-center justify-between min-[1050px]:px-6 max-[481px]:pt-[25px] max-[481px]:pb-[25px] max-[481px]:px-[22px]">
      <span className="flex items-center gap-3 text-[22px] font-bold max-[481px]:text-[20px]"><button type="button" onClick={() => setIsMenuOpen(true)} aria-label="باز کردن منو" className="h-[46px] w-[46px] border border-[#ffffff40] bg-[#ffffff15] rounded-[15px] grid place-items-center max-[481px]:h-[41px] max-[481px]:w-[41px] cursor-pointer text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[2px]"><HamburgerIcon/></button><a className="no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[5px] focus-visible:rounded-[10px]" href="./" aria-label="Oracle، صفحه اصلی">Oracle<span className="block text-[11px] font-normal text-[#e0e4ff] mt-[1px]">سرمایه‌های من</span></a></span>
      <span className="text-[12px] text-[#e0e4ff] max-[481px]:text-[10px] max-[351px]:hidden">یک نگاه، همهٔ دارایی‌ها</span>
    </div></header>
    <main className="max-w-[800px] mx-auto mt-[-89px] px-6 pb-9 relative min-[1050px]:max-w-[900px] min-[1050px]:grid min-[1050px]:grid-cols-[300px_1fr] min-[1050px]:gap-5 min-[1050px]:items-start min-[1050px]:mt-[-65px] max-[481px]:mt-[-77px] max-[481px]:px-[18px] max-[481px]:pb-[28px]">
      <SummaryCard total={total} count={items.length} isSample={isSample}/>
      <section className="mt-[31px] min-[1050px]:mt-0 min-[1050px]:bg-white min-[1050px]:border min-[1050px]:border-[#eceef5] min-[1050px]:rounded-[22px] min-[1050px]:p-[22px] max-[481px]:mt-[27px]" aria-labelledby="assets-title">
        <Toolbar onImportFile={handleImportFile} onClearAll={handleClearAllClick} onAdd={() => setIsAddOpen(true)}/>
        <div className="flex justify-between items-center px-1 mb-[15px] min-[1050px]:mb-[19px]"><h2 id="assets-title" className="text-[17px] font-bold max-[481px]:text-[15px]">دارایی‌های من</h2><span className="text-[11px] text-[#656e87]">ارزش به تومان</span></div>
        {items.length === 0 ? <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] py-4">هنوز دارایی‌ای ثبت نشده</p> : <ul className="list-none m-0 p-0 grid gap-[10px]">{items.map(asset => <AssetRow key={asset.id} asset={asset} onDelete={handleDelete} onEdit={handleEdit}/>)}</ul>}
      </section>
      {isSample && <p className="text-center text-[11px] leading-[1.9] text-[#969eb2] mt-[25px] min-[1050px]:col-span-full min-[1050px]:mt-0">مقادیر فعلاً نمونه‌اند و دارایی واقعی شما نیستند.</p>}
    </main>
    {isAddOpen && <AddAssetModal onClose={() => setIsAddOpen(false)} onAdd={handleAddAsset}/>}
    {isMenuOpen && <SideDrawer onClose={() => setIsMenuOpen(false)} onOpenProfile={() => { setIsMenuOpen(false); setIsProfileOpen(true); }} onLogout={handleLogout}/>}
    {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)}/>}
  </div>;
}
