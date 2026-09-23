import { assets } from './src/assets';

const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);

function AssetIcon({ type }: { type: string }) {
  if (type === 'btc' || type === 'usdt') return <span className="coin-letter">{type === 'btc' ? '₿' : '₮'}</span>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type === 'gold' ? <><path d="m7 7-4 11h18L17 7Z"/><path d="M7 7h10M8 14h8M10 10h4"/></> : type === 'cash' ? <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M4 6V5a2 2 0 0 1 2-2h12v3M21 11h-6v5h6"/><path d="M17 13.5h.01"/></> : type === 'eth' ? <><path d="m12 2 6 10-6 4-6-4Zm-6 13 6 7 6-7-6 4Z"/><path d="M12 2v14M6 12l6-3 6 3"/></> : <><path d="M4 19h16M6 15v-3m6 3V9m6 6V5M4 8l6-4 5 2 5-3"/></>}
  </svg>;
}

export default function App() {
  const total = assets.reduce((sum, asset) => sum + asset.quantity * asset.unitPrice, 0);
  return <div className="app">
    <header className="header"><div className="header-inner">
      <a className="brand" href="./" aria-label="دارایی، صفحه اصلی"><span className="brand-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 15v-3m4 3V8m4 7v-5"/></svg></span><span>دارایی<span className="brand-caption">سرمایه‌های من</span></span></a>
      <span className="header-note">یک نگاه، همهٔ دارایی‌ها</span>
    </div></header>
    <main>
      <section className="summary" aria-labelledby="total-title">
        <div className="summary-top"><span className="summary-icon"><AssetIcon type="cash"/></span><span className="sample-badge">نمایش نمونه</span></div>
        <h1 id="total-title">ارزش کل دارایی‌ها</h1>
        <div className="total"><strong>{format(total)}</strong><span>تومان</span></div>
        <div className="summary-bottom"><span><i/>سرمایه‌ها، کنار هم</span><span>{format(assets.length)} دارایی</span></div>
      </section>
      <section className="portfolio" aria-labelledby="assets-title">
        <div className="section-heading"><h2 id="assets-title">دارایی‌های من</h2><span>ارزش به تومان</span></div>
        <ul className="asset-list">{assets.map(asset => <li className="asset-row" key={asset.id}>
          <span className={`asset-icon ${asset.icon}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
          <div className="asset-detail"><h3>{asset.name}</h3><p>{format(asset.quantity, 8)} {asset.unit}</p></div>
          <div className="asset-value"><strong>{format(asset.quantity * asset.unitPrice)}</strong><span>تومان</span></div>
        </li>)}</ul>
      </section>
      <p className="sample-note">مقادیر فعلاً نمونه‌اند و دارایی واقعی شما نیستند.</p>
    </main>
  </div>;
}
