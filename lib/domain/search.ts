import type { BlockedRange, CategorySlug, ItemSummary } from "../types";
import { categoryName, isActiveCategory, isCategory } from "../categories";
import { checkAvailability } from "./availability";
import { isIsoDate } from "./dates";
import { parseQuery } from "./search-terms";

export type SortKey = "relevance" | "price_asc" | "price_desc" | "rating";

export interface SearchFilters {
  q: string;
  category: CategorySlug | null;
  location: string;
  minPriceSatang: number | null;
  maxPriceSatang: number | null;
  start: string | null;
  end: string | null;
  sort: SortKey;
}

export const EMPTY_FILTERS: SearchFilters = {
  q: "",
  category: null,
  location: "",
  minPriceSatang: null,
  maxPriceSatang: null,
  start: null,
  end: null,
  sort: "relevance",
};

const SORTS: SortKey[] = ["relevance", "price_asc", "price_desc", "rating"];

function bahtParam(value: string | null): number | null {
  if (!value || !/^\d{1,6}$/.test(value)) return null;
  return Number(value) * 100;
}

/** URL query string <-> filters. Unknown or invalid values are dropped. */
export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const category = params.get("category") ?? "";
  const start = params.get("start");
  const end = params.get("end");
  const sort = params.get("sort") as SortKey;
  const datesOk = isIsoDate(start) && isIsoDate(end) && end! >= start!;
  return {
    q: (params.get("q") ?? "").slice(0, 100),
    category: isCategory(category) ? category : null,
    location: (params.get("location") ?? "").slice(0, 80),
    minPriceSatang: bahtParam(params.get("min")),
    maxPriceSatang: bahtParam(params.get("max")),
    start: datesOk ? start : null,
    end: datesOk ? end : null,
    sort: SORTS.includes(sort) ? sort : "relevance",
  };
}

export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.category) p.set("category", filters.category);
  if (filters.location.trim()) p.set("location", filters.location.trim());
  if (filters.minPriceSatang !== null) p.set("min", String(filters.minPriceSatang / 100));
  if (filters.maxPriceSatang !== null) p.set("max", String(filters.maxPriceSatang / 100));
  if (filters.start && filters.end) {
    p.set("start", filters.start);
    p.set("end", filters.end);
  }
  if (filters.sort !== "relevance") p.set("sort", filters.sort);
  return p;
}

function relevance(item: ItemSummary, groups: string[][]): number {
  if (groups.length === 0) return 0;
  const title = item.title.toLowerCase();
  const body = `${item.description} ${categoryName(item.category)}`.toLowerCase();
  let score = 0;
  for (const group of groups) {
    // Each group is one thing the person asked for; any of its words may match.
    if (group.some((w) => title.includes(w))) score += 3;
    else if (group.some((w) => body.includes(w))) score += 1;
    else return -1; // everything asked for must match somewhere
  }
  return score;
}

/** Applies every filter together (AND), then sorts. */
export function searchItems(items: ItemSummary[], filters: SearchFilters, blocked: BlockedRange[]): ItemSummary[] {
  const words = parseQuery(filters.q);
  const location = filters.location.trim().toLowerCase();
  const scored: { item: ItemSummary; score: number }[] = [];

  for (const item of items) {
    if (item.status !== "active") continue;
    if (!isActiveCategory(item.category)) continue;
    if (filters.category && item.category !== filters.category) continue;
    if (location && !item.location.toLowerCase().includes(location)) continue;
    if (filters.minPriceSatang !== null && item.dailyPriceSatang < filters.minPriceSatang) continue;
    if (filters.maxPriceSatang !== null && item.dailyPriceSatang > filters.maxPriceSatang) continue;
    if (filters.start && filters.end && !checkAvailability(item, filters.start, filters.end, blocked).available) continue;
    const score = relevance(item, words);
    if (score < 0) continue;
    scored.push({ item, score });
  }

  const byActivity = (a: ItemSummary, b: ItemSummary) => b.updatedAt.localeCompare(a.updatedAt);
  scored.sort((a, b) => {
    switch (filters.sort) {
      case "price_asc":
        return a.item.dailyPriceSatang - b.item.dailyPriceSatang || byActivity(a.item, b.item);
      case "price_desc":
        return b.item.dailyPriceSatang - a.item.dailyPriceSatang || byActivity(a.item, b.item);
      case "rating":
        return (b.item.rating ?? 0) - (a.item.rating ?? 0) || b.item.reviewCount - a.item.reviewCount;
      default:
        return b.score - a.score || byActivity(a.item, b.item);
    }
  });
  return scored.map((s) => s.item);
}
