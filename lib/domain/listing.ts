import { isCategory } from "../categories";
import type { CategorySlug, ItemCondition, ListingInput } from "../types";
import { isIsoDate } from "./dates";
import { parseBahtToSatang } from "./pricing";

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Daily price limits in satang (฿20 to ฿20,000); mirrored in the database check. */
export const MIN_DAILY_SATANG = 2_000;
export const MAX_DAILY_SATANG = 2_000_000;

export type ListingErrors = Partial<Record<keyof ListingInput | "photos", string>>;

export interface ValidListing {
  title: string;
  description: string;
  category: CategorySlug;
  dailyPriceSatang: number;
  location: string;
  condition: ItemCondition;
  rules: string[];
  availableFrom: string | null;
  availableUntil: string | null;
}

export function validateListing(
  input: ListingInput,
  photoCount: number,
): { ok: true; value: ValidListing } | { ok: false; errors: ListingErrors } {
  const errors: ListingErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();

  if (title.length < 5) errors.title = "Use at least 5 characters so renters know what it is.";
  else if (title.length > 80) errors.title = "Keep the title under 80 characters.";
  if (description.length < 20) errors.description = "Describe the item in at least 20 characters.";
  else if (description.length > 2000) errors.description = "Keep the description under 2,000 characters.";
  if (!isCategory(input.category)) errors.category = "Choose a category.";
  const satang = parseBahtToSatang(input.dailyPrice);
  if (satang === null) errors.dailyPrice = "Enter a price in baht, for example 450 or 99.50.";
  else if (satang < MIN_DAILY_SATANG) errors.dailyPrice = "The minimum daily price is ฿20.";
  else if (satang > MAX_DAILY_SATANG) errors.dailyPrice = "The maximum daily price is ฿20,000.";
  if (location.length < 2) errors.location = "Add an area or town, for example Hackney, London.";
  if (input.availableFrom && !isIsoDate(input.availableFrom)) errors.availableFrom = "Enter a valid date.";
  if (input.availableUntil && !isIsoDate(input.availableUntil)) errors.availableUntil = "Enter a valid date.";
  if (input.availableFrom && input.availableUntil && input.availableUntil < input.availableFrom) {
    errors.availableUntil = "This must be on or after the available-from date.";
  }
  if (photoCount < 1) errors.photos = "Add at least one photo.";
  if (photoCount > MAX_PHOTOS) errors.photos = `Add at most ${MAX_PHOTOS} photos.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description,
      category: input.category as CategorySlug,
      dailyPriceSatang: satang!,
      location,
      condition: input.condition,
      rules: input.rules.split("\n").map((r) => r.trim()).filter(Boolean).slice(0, 10),
      availableFrom: input.availableFrom || null,
      availableUntil: input.availableUntil || null,
    },
  };
}

export function photoError(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Photos must be JPG, PNG or WebP.";
  if (file.size > MAX_PHOTO_BYTES) return "Each photo must be 5 MB or smaller.";
  return null;
}
