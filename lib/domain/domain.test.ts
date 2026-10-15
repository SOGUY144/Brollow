import { describe, expect, it } from "vitest";
import { checkAvailability } from "./availability";
import { allowedActions, transitionError } from "./bookings";
import { rangesOverlap, rentalDays, validateRentalDates } from "./dates";
import { validateListing } from "./listing";
import { parseBahtToSatang, quoteRental } from "./pricing";
import { formatMoney } from "../format";
import { EMPTY_FILTERS, filtersFromParams, filtersToParams, searchItems } from "./search";
import type { BlockedRange, ItemSummary } from "../types";

const TODAY = "2026-10-15";

describe("rental duration and price", () => {
  it("counts a same-day rental as one day", () => {
    expect(rentalDays("2026-10-20", "2026-10-20")).toBe(1);
  });
  it("counts both start and end days", () => {
    expect(rentalDays("2026-10-20", "2026-10-22")).toBe(3);
  });
  it("handles the UK clocks change without losing a day", () => {
    expect(rentalDays("2026-10-24", "2026-10-26")).toBe(3);
  });
  it("totals in integer satang with no extra fees", () => {
    // ฿450.50/day for 3 days = ฿1,351.50
    expect(quoteRental(45050, "2026-10-20", "2026-10-22")).toEqual({ days: 3, dailyPriceSatang: 45050, totalSatang: 135150 });
  });
  it("parses baht into satang", () => {
    expect(parseBahtToSatang("450")).toBe(45000);
    expect(parseBahtToSatang("99.5")).toBe(9950);
    expect(parseBahtToSatang("1,200")).toBe(120000);
    expect(parseBahtToSatang("0.25")).toBe(25);
    expect(parseBahtToSatang("12.345")).toBeNull();
    expect(parseBahtToSatang("-3")).toBeNull();
  });
  it("formats baht with the ฿ symbol", () => {
    expect(formatMoney(45000)).toBe("฿450");
    expect(formatMoney(135150)).toBe("฿1,351.50");
  });
});

describe("date validation", () => {
  it("rejects missing dates", () => {
    expect(validateRentalDates("", "2026-10-20", TODAY)).toMatch(/start and end/);
  });
  it("rejects past start dates", () => {
    expect(validateRentalDates("2026-10-14", "2026-10-20", TODAY)).toMatch(/past/);
  });
  it("rejects an end before the start", () => {
    expect(validateRentalDates("2026-10-20", "2026-10-19", TODAY)).toMatch(/before the start/);
  });
  it("rejects impossible dates", () => {
    expect(validateRentalDates("2026-02-30", "2026-03-01", TODAY)).toMatch(/valid dates/);
  });
  it("accepts today as a start date", () => {
    expect(validateRentalDates(TODAY, TODAY, TODAY)).toBeNull();
  });
});

describe("overlapping reservations", () => {
  const item = { id: "a", availableFrom: null, availableUntil: null, status: "active" as const };
  const blocked: BlockedRange[] = [{ itemId: "a", startDate: "2026-10-20", endDate: "2026-10-22" }];
  it("treats touching end dates as overlapping (inclusive)", () => {
    expect(rangesOverlap("2026-10-22", "2026-10-23", "2026-10-20", "2026-10-22")).toBe(true);
  });
  it("blocks dates that overlap a confirmed booking", () => {
    expect(checkAvailability(item, "2026-10-21", "2026-10-25", blocked).available).toBe(false);
  });
  it("allows the day after a confirmed booking ends", () => {
    expect(checkAvailability(item, "2026-10-23", "2026-10-25", blocked).available).toBe(true);
  });
  it("ignores bookings for other items", () => {
    expect(checkAvailability({ ...item, id: "b" }, "2026-10-21", "2026-10-21", blocked).available).toBe(true);
  });
  it("respects the owner's availability window", () => {
    expect(checkAvailability({ ...item, availableUntil: "2026-10-31" }, "2026-10-30", "2026-11-02", []).available).toBe(false);
  });
});

describe("booking permissions and transitions", () => {
  const booking = { status: "pending" as const, renterId: "renter", ownerId: "owner", startDate: "2026-10-20" };
  it("only the owner can confirm or decline", () => {
    expect(transitionError(booking, "confirmed", "owner", TODAY)).toBeNull();
    expect(transitionError(booking, "confirmed", "renter", TODAY)).toMatch(/Only the owner/);
    expect(transitionError(booking, "declined", "owner", TODAY)).toBeNull();
  });
  it("renter can cancel a pending request, strangers can do nothing", () => {
    expect(transitionError(booking, "cancelled", "renter", TODAY)).toBeNull();
    expect(transitionError(booking, "cancelled", "stranger", TODAY)).toMatch(/can't change/);
  });
  it("confirmed bookings can be cancelled only before they start", () => {
    const confirmed = { ...booking, status: "confirmed" as const };
    expect(transitionError(confirmed, "cancelled", "renter", TODAY)).toBeNull();
    expect(transitionError(confirmed, "cancelled", "renter", "2026-10-20")).toMatch(/before the start/);
  });
  it("final states cannot change", () => {
    expect(transitionError({ ...booking, status: "declined" }, "confirmed", "owner", TODAY)).not.toBeNull();
    expect(allowedActions({ ...booking, status: "cancelled" }, "owner", TODAY)).toEqual([]);
  });
});

describe("search filters", () => {
  const base = {
    ownerId: "o", description: "", condition: "good" as const, rules: [] as string[], images: [] as string[],
    availableFrom: null, availableUntil: null, status: "active" as const, createdAt: "", owner: null,
  };
  const items: ItemSummary[] = [
    { ...base, id: "1", title: "Dome tent", category: "camping-outdoors", dailyPriceSatang: 2000, location: "Hackney, London", rating: 5, reviewCount: 2, updatedAt: "2026-10-01" },
    { ...base, id: "2", title: "Family tent", category: "camping-outdoors", dailyPriceSatang: 3500, location: "Clifton, Bristol", rating: 4, reviewCount: 1, updatedAt: "2026-10-02" },
    { ...base, id: "3", title: "Tent footprint", category: "camping-outdoors", dailyPriceSatang: 500, location: "Islington, London", rating: null, reviewCount: 0, updatedAt: "2026-10-03" },
    { ...base, id: "4", title: "Cordless drill", category: "tools-diy", dailyPriceSatang: 600, location: "Hackney, London", rating: 4, reviewCount: 3, updatedAt: "2026-10-04" },
    { ...base, id: "5", title: "Old camera tent bag", category: "cameras-photography", dailyPriceSatang: 100, location: "Hackney, London", rating: 5, reviewCount: 9, updatedAt: "2026-10-05" },
  ];
  const blocked: BlockedRange[] = [{ itemId: "1", startDate: "2026-10-20", endDate: "2026-10-21" }];

  it("combines keyword, category, location, price and dates", () => {
    const result = searchItems(items, {
      ...EMPTY_FILTERS, q: "tent", category: "camping-outdoors", location: "london",
      maxPriceSatang: 2500, start: "2026-10-21", end: "2026-10-22",
    }, blocked);
    // 1 is booked, 2 is in Bristol and too expensive, 4 is the wrong category.
    expect(result.map((i) => i.id)).toEqual(["3"]);
  });
  it("sorts by price", () => {
    const result = searchItems(items, { ...EMPTY_FILTERS, sort: "price_asc" }, []);
    expect(result.map((i) => i.id)).toEqual(["3", "4", "1", "2"]);
  });
  it("hides items in categories Brollow no longer runs", () => {
    const result = searchItems(items, { ...EMPTY_FILTERS, q: "tent" }, []);
    expect(result.map((i) => i.id)).not.toContain("5");
    expect(filtersFromParams(new URLSearchParams("category=cameras-photography")).category).toBeNull();
  });
  it("round-trips through URL params and drops invalid values", () => {
    const filters = { ...EMPTY_FILTERS, q: "drill", category: "tools-diy" as const, minPriceSatang: 500, start: "2026-10-20", end: "2026-10-21", sort: "rating" as const };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
    const bad = filtersFromParams(new URLSearchParams("category=nope&start=2026-10-22&end=2026-10-20&sort=zzz&min=abc"));
    expect(bad).toEqual(EMPTY_FILTERS);
  });
});

describe("listing validation", () => {
  const input = { title: "Garden gazebo", description: "A 3x3 m gazebo with side walls and weights.", category: "party-equipment" as const, dailyPrice: "450.50", location: "Leeds", condition: "good" as const, rules: "Return dry\n\nNo wind", availableFrom: "", availableUntil: "" };
  it("accepts a valid listing and converts the price to satang", () => {
    const result = validateListing(input, 1);
    expect(result.ok && result.value.dailyPriceSatang).toBe(45050);
    expect(result.ok && result.value.rules).toEqual(["Return dry", "No wind"]);
  });
  it("enforces the ฿20 to ฿20,000 daily price range", () => {
    const low = validateListing({ ...input, dailyPrice: "19" }, 1);
    const high = validateListing({ ...input, dailyPrice: "20001" }, 1);
    expect(!low.ok && low.errors.dailyPrice).toMatch(/minimum/);
    expect(!high.ok && high.errors.dailyPrice).toMatch(/maximum/);
  });
  it("reports useful errors", () => {
    const result = validateListing({ ...input, title: "Hi", dailyPrice: "abc", category: "" }, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["category", "dailyPrice", "photos", "title"]);
  });
});
