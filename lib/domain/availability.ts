import type { BlockedRange, IsoDate, Item } from "../types";
import { rangesOverlap } from "./dates";

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: "outside_window" | "booked" | "paused" };

/**
 * Only confirmed reservations block dates; pending requests do not.
 * The item's own availability window also applies.
 */
export function checkAvailability(
  item: Pick<Item, "id" | "availableFrom" | "availableUntil" | "status">,
  start: IsoDate,
  end: IsoDate,
  blocked: BlockedRange[],
): AvailabilityResult {
  if (item.status !== "active") return { available: false, reason: "paused" };
  if (item.availableFrom && start < item.availableFrom) return { available: false, reason: "outside_window" };
  if (item.availableUntil && end > item.availableUntil) return { available: false, reason: "outside_window" };
  const clash = blocked.some((b) => b.itemId === item.id && rangesOverlap(start, end, b.startDate, b.endDate));
  return clash ? { available: false, reason: "booked" } : { available: true };
}

export function availabilityMessage(result: AvailabilityResult): string {
  if (result.available) return "Available for your dates";
  switch (result.reason) {
    case "booked":
      return "Already booked for some of these dates";
    case "outside_window":
      return "Not offered on these dates";
    case "paused":
      return "Not currently available";
  }
}
