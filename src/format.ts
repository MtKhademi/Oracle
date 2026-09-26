export const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);

// Masks an already-formatted number string (Latin or Persian digits) for the
// "hide balance" toggle (see App.tsx's isBalanceHidden / SummaryCard /
// AssetRow) — replaces every digit with a bullet while keeping thousands
// separators/grouping intact, so the masked value still reads as a
// number-shaped placeholder, e.g. "۱,۸۹۶,۳۳۲,۵۴۶" -> "•,•••,•••,•••".
export const maskAmount = (formatted: string) => formatted.replace(/[0-9۰-۹]/g, '•');

export const stripToNumberString = (raw: string) => {
  let cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  return cleaned;
};

export const formatWithThousands = (raw: string) => {
  const cleaned = stripToNumberString(raw);
  const [intPart, decPart] = cleaned.split('.');
  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '';
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

const persianDateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

export const formatDate = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [year, month, day] = match.slice(1, 4).map(Number);
  return persianDateFormatter.format(new Date(year, month - 1, day));
};
