import type { CategorySlug, ItemCondition } from "./types";

/** Every category the data model knows (older listings may still use these). */
export const ALL_CATEGORIES: { slug: CategorySlug; name: string; blurb: string }[] = [
  { slug: "cameras-photography", name: "Cameras & Photography", blurb: "Cameras, lenses, lights and tripods" },
  { slug: "electronics", name: "Electronics", blurb: "Projectors, drones, consoles and power" },
  { slug: "camping-outdoors", name: "Camping & Outdoors", blurb: "Tents, sleeping bags and stoves" },
  { slug: "tools-diy", name: "Tools & DIY", blurb: "Drills, washers, ladders and saws" },
  { slug: "music-equipment", name: "Music Equipment", blurb: "Guitars, keyboards and PA" },
  { slug: "sports-equipment", name: "Sports Equipment", blurb: "Bikes, boards and rackets" },
  { slug: "party-equipment", name: "Party Equipment", blurb: "Gazebos, lights and machines" },
];

/**
 * Categories Brollow currently runs. Kept to three popular, sturdy, low-dispute groups:
 * small to mid-size items that are rarely damaged and easy to hand over.
 * Items in other categories are hidden from browsing and can't be listed.
 */
export const ACTIVE_CATEGORY_SLUGS: CategorySlug[] = ["camping-outdoors", "tools-diy", "party-equipment"];

export const CATEGORIES = ALL_CATEGORIES.filter((c) => ACTIVE_CATEGORY_SLUGS.includes(c.slug));

export function isActiveCategory(slug: string): boolean {
  return (ACTIVE_CATEGORY_SLUGS as string[]).includes(slug);
}

export function categoryName(slug: string): string {
  return ALL_CATEGORIES.find((c) => c.slug === slug)?.name ?? "Other";
}

export function isCategory(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair, fully working" },
];

export function conditionLabel(value: ItemCondition): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}
