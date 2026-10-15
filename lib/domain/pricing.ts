import type { IsoDate } from "../types";
import { rentalDays } from "./dates";

export interface PriceQuote {
  days: number;
  dailyPriceSatang: number;
  totalSatang: number;
}

/**
 * Money is integer satang (1 baht = 100 satang). There are no service or
 * booking fees in this version, so the total is exactly daily rate x days.
 */
export function quoteRental(dailyPriceSatang: number, start: IsoDate, end: IsoDate): PriceQuote {
  if (!Number.isInteger(dailyPriceSatang) || dailyPriceSatang < 0) {
    throw new Error("Daily price must be a non-negative whole number of satang.");
  }
  const days = rentalDays(start, end);
  return { days, dailyPriceSatang, totalSatang: dailyPriceSatang * days };
}

/** Parses a baht string like "450", "1,200" or "99.50" into satang; null if invalid. */
export function parseBahtToSatang(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(trimmed)) return null;
  const [baht, satang = ""] = trimmed.split(".");
  return Number(baht) * 100 + Number(satang.padEnd(2, "0"));
}
