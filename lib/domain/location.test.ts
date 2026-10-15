import { describe, expect, it } from "vitest";
import { distanceKm, validCoordinates } from "./location";
import { validateListing } from "./listing";

describe("pickup distance", () => {
  it("does not invent a distance for missing or invalid coordinates", () => {
    expect(distanceKm(null, { latitude: 0, longitude: 0 })).toBeNull();
    expect(distanceKm({ latitude: 91, longitude: 0 }, { latitude: 0, longitude: 0 })).toBeNull();
    expect(validCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
  });
  it("accepts zero coordinates and measures one degree on the equator", () => {
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.195, 2);
  });
  it("uses the short path across the date line", () => {
    expect(distanceKm({ latitude: 0, longitude: 179.99 }, { latitude: 0, longitude: -179.99 })).toBeCloseTo(2.224, 2);
  });
  it("requires both coordinate fields and permits clearing both", () => {
    const listing = { title: "Camera kit", description: "A camera with a lens and battery.", category: "electronics" as const, dailyPrice: "100", location: "London", condition: "good" as const, rules: "", availableFrom: "", availableUntil: "" };
    expect(validateListing({ ...listing, pickupLatitude: "51.5" }, 1).ok).toBe(false);
    expect(validateListing({ ...listing, pickupLatitude: "91", pickupLongitude: "0" }, 1).ok).toBe(false);
    const valid = validateListing({ ...listing, pickupLatitude: "0", pickupLongitude: "0" }, 1);
    expect(valid.ok && valid.value.coordinates).toEqual({ latitude: 0, longitude: 0 });
    const cleared = validateListing({ ...listing, pickupLatitude: "", pickupLongitude: "" }, 1);
    expect(cleared.ok && cleared.value.coordinates).toBeNull();
  });
});
