export const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);

const persianDateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

export const formatDate = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [year, month, day] = match.slice(1, 4).map(Number);
  return persianDateFormatter.format(new Date(year, month - 1, day));
};
