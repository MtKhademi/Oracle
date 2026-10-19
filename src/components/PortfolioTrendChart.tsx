import { useEffect, useState } from 'react';
import { format } from '../format';
import { getPortfolioPerformance, type PortfolioPerformancePoint } from '../services/portfolioPerformanceService';

const W = 600, H = 200, P = { top: 12, right: 10, bottom: 26, left: 10 };
const SERIES = [
  { key: 'marketValueToman', label: 'ارزش بازار', color: '#5264e8' },
  { key: 'investedValueToman', label: 'مبلغ سرمایه‌گذاری‌شده', color: '#1f9d55' },
] as const;

function indexed(points: PortfolioPerformancePoint[], key: typeof SERIES[number]['key']) {
  const first = points[0][key];
  return first === 0 ? points.map(() => 0) : points.map(point => (point[key] / first) * 100);
}

function pointsPath(values: number[], min: number, max: number) {
  const width = W - P.left - P.right, height = H - P.top - P.bottom, range = max - min || 1;
  return values.map((value, i) => {
    const x = P.left + (values.length === 1 ? 0 : i / (values.length - 1) * width);
    const y = P.top + height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
}

function dateLabel(dateUtc: string) {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateUtc).getTime()) / 86400000));
  return days === 0 ? 'امروز' : `${format(days)} روز پیش`;
}

export function PortfolioTrendChart({ refreshKey }: { refreshKey?: number }) {
  const [points, setPoints] = useState<PortfolioPerformancePoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getPortfolioPerformance().then(next => { if (!cancelled) setPoints(next); }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'دریافت روند عملکرد انجام نشد');
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const card = (children: React.ReactNode) => <section className="bg-white rounded-[22px] p-6 mt-5 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] max-[481px]:p-5 max-[481px]:mt-[19px] max-[481px]:rounded-[20px]" aria-labelledby="trend-title"><h2 id="trend-title" className="text-[14px] font-bold mb-4">روند عملکرد پرتفوی</h2>{children}</section>;
  if (points === null) return card(<p className="text-[12px] text-[#969eb2] text-center py-6">{error ?? 'در حال بارگذاری...'}</p>);
  if (points.length < 2) return card(<p className="text-[12px] text-[#969eb2] text-center py-6">دادهٔ تاریخی کافی برای نمایش روند وجود ندارد</p>);

  const all = SERIES.flatMap(series => indexed(points, series.key)), rawMin = Math.min(...all), rawMax = Math.max(...all), padding = (rawMax - rawMin) * 0.1 || 5;
  const labels = [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]];
  return card(<>
    {points.some(point => point.valuationStatus === 'missing') && <p className="text-[10px] text-[#b07b20] mb-2">بعضی نقاط به‌دلیل نبود قیمت کامل نیستند</p>}
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="نمودار روند عملکرد پرتفوی">{SERIES.map(series => <polyline key={series.key} points={pointsPath(indexed(points, series.key), rawMin - padding, rawMax + padding)} fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>)}</svg>
    <div dir="ltr" className="flex justify-between mt-2">{labels.map((point, i) => <span key={`${point.dateUtc}-${i}`} className="text-[11px] text-[#9096aa]">{dateLabel(point.dateUtc)}</span>)}</div>
    <div className="flex flex-col gap-2 mt-4">{SERIES.map(series => { const values = indexed(points, series.key); const change = values[values.length - 1] - 100; return <div key={series.key} className="flex items-center justify-between"><span className="flex items-center gap-2 text-[12px] text-[#4b5163]"><i className="h-[8px] w-[8px] rounded-full shrink-0" style={{ backgroundColor: series.color }}/>{series.label}</span><span className={`text-[12px] font-medium ${change >= 0 ? 'text-[#1f9d55]' : 'text-[#d95050]'}`}>{change >= 0 ? '+' : '-'}{format(Math.abs(change), 1)}٪</span></div>; })}</div>
  </>);
}
