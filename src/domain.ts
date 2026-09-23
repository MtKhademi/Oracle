export const categories = {
  gold: { label: 'طلای فیزیکی', unit: 'گرم', color: '#D9B86C', icon: 'diamond-outline' },
  fund: { label: 'صندوق طلا', unit: 'واحد', color: '#A7B8FA', icon: 'trending-up-outline' },
  cash: { label: 'پول نقد', unit: 'تومان', color: '#7CD3BB', icon: 'wallet-outline' },
  crypto: { label: 'ارز دیجیتال', unit: 'واحد', color: '#D6A6E9', icon: 'logo-bitcoin' },
} as const;
export type Kind = keyof typeof categories;
export type Asset = { id: string; kind: Kind; name: string; quantity: number; price: number; cost: number | null; updated: string };
export const headers = ['شناسه', 'نوع', 'نام', 'مقدار', 'قیمت واحد (تومان)', 'بهای خرید کل (تومان)'];
export function numberOf(value: unknown): number {
  const s = String(value ?? '').trim().replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g, x => String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[,٬\s]/g, '').replace(/٫/g, '.');
  if (!s || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}
export function validateAsset(a: Asset): void {
  if (!a.id.trim() || a.id.length > 100 || !a.name.trim() || a.name.length > 100 || !(a.kind in categories)) throw new Error('شناسه، نوع یا نام دارایی معتبر نیست.');
  if (!Number.isFinite(a.quantity) || a.quantity <= 0 || a.quantity > 1e15) throw new Error('مقدار باید عددی مثبت باشد.');
  if (!Number.isFinite(a.price) || a.price < 0 || a.price > 1e15) throw new Error('قیمت واحد باید صفر یا بیشتر باشد.');
  if (a.kind === 'cash' && a.price !== 1) throw new Error('قیمت واحد پول نقد باید ۱ باشد؛ مقدار را به تومان وارد کنید.');
  if (a.kind === 'fund' && !Number.isInteger(a.quantity)) throw new Error('تعداد واحد صندوق باید عدد صحیح باشد.');
  if (a.cost !== null && (!Number.isFinite(a.cost) || a.cost < 0)) throw new Error('بهای خرید کل معتبر نیست.');
  if (!Number.isFinite(a.quantity * a.price) || a.quantity * a.price > Number.MAX_SAFE_INTEGER) throw new Error('ارزش دارایی بیش از محدودهٔ قابل محاسبه است.');
}
export function parseRows(rows: unknown[][]): Asset[] {
  if (!rows.length || headers.some((h, i) => String(rows[0]?.[i] ?? '').trim() !== h)) throw new Error('ستون‌ها با الگو مطابقت ندارند. فایل الگو را از اپ دریافت کنید.');
  const result: Asset[] = []; const ids = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; if (r.every(v => v === null || v === undefined || String(v).trim() === '')) continue;
    if (result.length >= 2000) throw new Error('هر بار حداکثر ۲۰۰۰ دارایی وارد کنید.');
    try {
      const kind = (Object.keys(categories) as Kind[]).find(k => k === r[1] || categories[k].label === String(r[1]).trim());
      const a: Asset = { id: String(r[0] ?? '').trim(), kind: kind as Kind, name: String(r[2] ?? '').trim(), quantity: numberOf(r[3]), price: numberOf(r[4]), cost: r[5] === '' || r[5] == null ? null : numberOf(r[5]), updated: new Date().toISOString() };
      validateAsset(a); if (ids.has(a.id)) throw new Error('شناسه در همین فایل تکراری است.'); ids.add(a.id); result.push(a);
    } catch(e) { throw new Error(`ردیف ${i + 1}: ${(e as Error).message}`); }
  }
  if (!result.length) throw new Error('فایل هیچ دارایی ندارد.'); return result;
}
export function mergeAssets(current: Asset[], incoming: Asset[]): Asset[] {
  const map = new Map(current.map(a => [a.id, a])); incoming.forEach(a => { validateAsset(a); map.set(a.id, a); }); return [...map.values()];
}
export function summarize(assets: Asset[]) {
  const total = assets.reduce((n, a) => n + a.quantity * a.price, 0);
  const known = assets.filter(a => a.cost !== null);
  const cost = known.reduce((n, a) => n + a.cost!, 0);
  const profit = known.reduce((n, a) => n + a.quantity * a.price - a.cost!, 0);
  return { total, cost, profit, known: known.length, allocation: (Object.keys(categories) as Kind[]).map(kind => ({ kind, value: assets.filter(a => a.kind === kind).reduce((n, a) => n + a.quantity * a.price, 0) })) };
}
export const toRows = (assets: Asset[]) => [headers, ...assets.map(a => [a.id, categories[a.kind].label, a.name, a.quantity, a.price, a.cost ?? ''])];
// Illustrative values only. Never loaded into the user's portfolio automatically.
export const demo: Asset[] = [
  {id:'demo-gold',kind:'gold',name:'طلای ۱۸ عیار',quantity:12.5,price:7500000,cost:85000000,updated:'2026-09-23'},
  {id:'demo-ayar',kind:'fund',name:'عیار',quantity:1200,price:28500,cost:30000000,updated:'2026-09-23'},
  {id:'demo-ganj',kind:'fund',name:'گنج',quantity:800,price:32000,cost:24000000,updated:'2026-09-23'},
  {id:'demo-cash',kind:'cash',name:'حساب بانکی',quantity:42000000,price:1,cost:42000000,updated:'2026-09-23'},
  {id:'demo-usdt',kind:'crypto',name:'تتر · USDT',quantity:250,price:100000,cost:24000000,updated:'2026-09-23'},
  {id:'demo-btc',kind:'crypto',name:'بیت کوین · BTC',quantity:0.003,price:10000000000,cost:28000000,updated:'2026-09-23'},
  {id:'demo-eth',kind:'crypto',name:'اتریوم · ETH',quantity:0.04,price:350000000,cost:13000000,updated:'2026-09-23'},
];
