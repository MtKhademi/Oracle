import { useEffect, useState } from 'react';
import { format } from '../format';
import { portfolioHistoryService, type PortfolioSnapshot } from '../services/portfolioHistoryService';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = { top: 12, right: 10, bottom: 26, left: 10 };

const SERIES = [
  { key: 'toman', label: 'دارایی من (تومان)', color: '#5264e8' },
  { key: 'usd', label: 'معادل دلار', color: '#1f9d55' },
  { key: 'gold', label: 'معادل گرم طلا', color: '#d7a144' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];

// Normalizes each series to "% of day 1" (day 1 = exactly 100) so toman/USD/gold
// (different units, different magnitudes) become directly comparable on one chart.
function computeIndexedSeries(history: PortfolioSnapshot[]): Record<SeriesKey, number[]> {
  const first = history[0];
  const firstUsdValue = first.totalToman / first.usdToman;
  const firstGoldValue = first.totalToman / first.goldGramToman;
  return {
    toman: history.map(s => (s.totalToman / first.totalToman) * 100),
    usd: history.map(s => ((s.totalToman / s.usdToman) / firstUsdValue) * 100),
    gold: history.map(s => ((s.totalToman / s.goldGramToman) / firstGoldValue) * 100),
  };
}

// Whole-day difference between two "YYYY-MM-DD" dates, parsed as local dates
// (not UTC) so the result isn't off by one for timezones behind UTC.
function daysBetweenIso(fromIso: string, toIso: string): number {
  const toLocalTime = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((toLocalTime(toIso) - toLocalTime(fromIso)) / 86400000);
}

function relativeDaysAgoLabel(daysAgo: number): string {
  return `${format(daysAgo)} روز پیش`;
}

// The 3 X-axis labels: oldest point, midpoint, and "امروز" (today) for the
// newest point — relative-time, not calendar dates, so they read at a glance.
// The oldest-point day-count is computed from the actual oldest/newest dates
// (naturally "30" once 30 days of history have accumulated — no hardcoding —
// and correctly smaller if the stored history is shorter than that).
function buildXAxisLabels(history: PortfolioSnapshot[]): { index: number; text: string }[] {
  const oldest = history[0];
  const newest = history[history.length - 1];
  const midIndex = Math.floor((history.length - 1) / 2);
  const mid = history[midIndex];
  const todayIso = new Date().toISOString().slice(0, 10);

  const oldestDaysAgo = daysBetweenIso(oldest.date, newest.date);
  const midDaysAgo = daysBetweenIso(mid.date, todayIso);

  return [
    { index: 0, text: relativeDaysAgoLabel(oldestDaysAgo) },
    { index: midIndex, text: relativeDaysAgoLabel(midDaysAgo) },
    { index: history.length - 1, text: 'امروز' },
  ];
}

function buildPoints(values: number[], minVal: number, maxVal: number): string {
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const range = maxVal - minVal || 1;
  return values
    .map((value, i) => {
      const x = PADDING.left + (values.length === 1 ? 0 : (i / (values.length - 1)) * innerWidth);
      const y = PADDING.top + innerHeight - ((value - minVal) / range) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

function PercentBadge({ percent }: { percent: number }) {
  const isPositive = percent >= 0;
  const sign = isPositive ? '+' : '-';
  return <span className={`text-[12px] font-medium ${isPositive ? 'text-[#1f9d55]' : 'text-[#d95050]'}`}>{sign}{format(Math.abs(percent), 1)}٪</span>;
}

export function PortfolioTrendChart({ refreshKey }: { refreshKey?: number }) {
  const [history, setHistory] = useState<PortfolioSnapshot[] | null>(null);

  useEffect(() => {
    portfolioHistoryService.listHistory().then(setHistory);
  }, [refreshKey]);

  const card = (children: React.ReactNode) => <section className="bg-white rounded-[22px] p-6 mt-5 shadow-[0_12px_36px_#2734790b] border border-[#eceef8] max-[481px]:p-5 max-[481px]:mt-[19px] max-[481px]:rounded-[20px]" aria-labelledby="trend-title">
    <h2 id="trend-title" className="text-[14px] font-bold mb-4">روند رشد دارایی نسبت به دلار و طلا</h2>
    {children}
  </section>;

  if (history === null) {
    return card(<p className="text-[12px] text-[#969eb2] text-center py-6">در حال بارگذاری...</p>);
  }

  if (history.length < 2) {
    return card(<p className="text-[12px] text-[#969eb2] text-center py-6">داده کافی برای نمودار وجود ندارد</p>);
  }

  const indexed = computeIndexedSeries(history);
  const allValues = [...indexed.toman, ...indexed.usd, ...indexed.gold];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.1 || 5;
  const minVal = rawMin - pad;
  const maxVal = rawMax + pad;

  const xAxisLabels = buildXAxisLabels(history);

  return card(<>
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto" role="img" aria-label="نمودار روند رشد دارایی نسبت به دلار و طلا">
      {SERIES.map(series => <polyline key={series.key} points={buildPoints(indexed[series.key], minVal, maxVal)} fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>)}
    </svg>
    {/* Rendered as real HTML (not SVG <text>) so the text-[11px] size class
        below is literal on-screen pixels, unaffected by the SVG viewBox
        scaling that made the old in-chart date labels unreadable on mobile.
        dir="ltr" keeps this row left(oldest)-to-right(today), matching the
        SVG's always-LTR coordinate space, regardless of the page's own RTL
        direction (otherwise the RTL flex row would visually reverse it). */}
    <div dir="ltr" className="flex justify-between mt-2">
      <span className="text-[11px] text-[#9096aa]">{xAxisLabels[0].text}</span>
      <span className="text-[11px] text-[#9096aa]">{xAxisLabels[1].text}</span>
      <span className="text-[11px] text-[#9096aa]">{xAxisLabels[2].text}</span>
    </div>
    <div className="flex flex-col gap-2 mt-4">
      {SERIES.map(series => {
        const latestPercent = indexed[series.key][indexed[series.key].length - 1] - 100;
        return <div key={series.key} className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] text-[#4b5163]"><i className="h-[8px] w-[8px] rounded-full shrink-0" style={{ backgroundColor: series.color }}/>{series.label}</span>
          <PercentBadge percent={latestPercent}/>
        </div>;
      })}
    </div>
  </>);
}
