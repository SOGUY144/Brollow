/**
 * Centralised formatting. Money is Thai baht (THB), stored as integer satang
 * (1 baht = 100 satang). Interface text and dates stay in English.
 */
export const LOCALE = "en-GB";
export const CURRENCY = "THB";
const MONEY_LOCALE = "th-TH"; // renders the ฿ symbol with Thai digit grouping

const money = new Intl.NumberFormat(MONEY_LOCALE, { style: "currency", currency: CURRENCY });
const moneyWhole = new Intl.NumberFormat(MONEY_LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });

export function formatMoney(satang: number): string {
  return satang % 100 === 0 ? moneyWhole.format(satang / 100) : money.format(satang / 100);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  // Date-only values are formatted as calendar dates, independent of the viewer's timezone.
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString(LOCALE, { ...opts, timeZone: "UTC" });
}

export function formatDateRange(start: string, end: string): string {
  return start === end ? formatDate(start) : `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end)}`;
}

export function pluralDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}
