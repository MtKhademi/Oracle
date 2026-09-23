export const format = (value: number, decimals = 0) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }).format(value);
