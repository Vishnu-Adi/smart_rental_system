export const toNum = (x: unknown): number => (x === null || x === undefined || x === '' ? 0 : Number(x));

export const formatMoney = (v: number | string, currency: string = 'USD'): string =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(toNum(v));

export const formatPct = (v: number | string, digits = 0): string =>
  `${toNum(v).toFixed(digits)}%`;

export const formatNumber = (v: number | string, digits = 0): string =>
  toNum(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const relativeTimeFromIso = (iso: string): string => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Math.round((now - t) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};


