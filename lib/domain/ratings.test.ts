import { describe, expect, it } from "vitest";
import { ratingEligibility, reputationOf, topTags, validateRating } from "./ratings";
import type { UserRating } from "../types";

const TODAY = "2026-10-15";
const booking = { id: "b1", status: "confirmed" as const, renterId: "renter", ownerId: "owner", endDate: "2026-10-10" };

describe("who can rate, and when", () => {
  it("the renter rates the owner and the owner rates the renter", () => {
    expect(ratingEligibility(booking, "renter", TODAY, [])).toMatchObject({ canRate: true, role: "owner", rateeId: "owner" });
    expect(ratingEligibility(booking, "owner", TODAY, [])).toMatchObject({ canRate: true, role: "renter", rateeId: "renter" });
  });
  it("strangers can't rate", () => {
    expect(ratingEligibility(booking, "someone", TODAY, [])).toMatchObject({ canRate: false });
  });
  it("only after the return date has passed", () => {
    expect(ratingEligibility({ ...booking, endDate: TODAY }, "renter", TODAY, [])).toMatchObject({ canRate: false, reason: expect.stringMatching(/after the return date/) });
  });
  it("only for confirmed rentals", () => {
    expect(ratingEligibility({ ...booking, status: "cancelled" }, "renter", TODAY, [])).toMatchObject({ canRate: false });
    expect(ratingEligibility({ ...booking, status: "pending" }, "renter", TODAY, [])).toMatchObject({ canRate: false });
  });
  it("closes 30 days after the return date", () => {
    expect(ratingEligibility(booking, "renter", "2026-11-09", [])).toMatchObject({ canRate: true });
    expect(ratingEligibility(booking, "renter", "2026-11-10", [])).toMatchObject({ canRate: false, reason: expect.stringMatching(/ended/) });
  });
  it("each side rates once, independently of the other side", () => {
    const existing = [{ bookingId: "b1", raterId: "renter" }];
    expect(ratingEligibility(booking, "renter", TODAY, existing)).toMatchObject({ canRate: false, reason: expect.stringMatching(/already/) });
    expect(ratingEligibility(booking, "owner", TODAY, existing)).toMatchObject({ canRate: true });
  });
});

describe("rating validation", () => {
  it("needs 1 to 5 whole stars", () => {
    expect(validateRating("owner", 0, [], "")).toMatch(/1 to 5/);
    expect(validateRating("owner", 4.5, [], "")).toMatch(/1 to 5/);
    expect(validateRating("owner", 5, [], "")).toBeNull();
  });
  it("only allows tags that fit the role", () => {
    expect(validateRating("owner", 5, ["fair_charges"], "")).toBeNull();
    expect(validateRating("renter", 5, ["fair_charges"], "")).toMatch(/doesn't apply/);
    expect(validateRating("renter", 5, ["good_care", "good_care"], "")).toMatch(/once/);
  });
});

describe("reputation", () => {
  const r = (rateeId: string, role: "owner" | "renter", score: number, tags: UserRating["tags"]): UserRating =>
    ({ id: Math.random().toString(), bookingId: "x", raterId: "y", raterName: "Y", rateeId, role, score, tags, comment: "", createdAt: "", isDemo: false });
  const ratings = [
    r("a", "owner", 5, ["on_time", "fair_charges"]),
    r("a", "owner", 4, ["fair_charges"]),
    r("a", "renter", 3, ["returned_on_time"]),
    r("b", "owner", 1, []),
  ];
  it("keeps owner and renter reputations separate", () => {
    const rep = reputationOf("a", ratings);
    expect(rep.asOwner).toMatchObject({ average: 4.5, count: 2 });
    expect(rep.asRenter).toMatchObject({ average: 3, count: 1 });
  });
  it("counts tags and lists the most common first", () => {
    expect(topTags(reputationOf("a", ratings).asOwner)).toEqual([{ tag: "fair_charges", count: 2 }, { tag: "on_time", count: 1 }]);
  });
  it("has no average without ratings", () => {
    expect(reputationOf("nobody", ratings).asOwner).toEqual({ average: null, count: 0, tagCounts: {} });
  });
});
