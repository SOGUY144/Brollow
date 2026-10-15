import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import type { CategorySlug, Item, ItemCondition, ItemSummary, Profile, Review } from "../types";
import { summarise } from "./api";
import { SEED_PROFILES, seedItems, seedReviews } from "./seed";

/**
 * Server-side read of public listings, for pages search engines read
 * (rent landing pages, item metadata, the sitemap). In demo mode this is the
 * seed catalogue; demo listings created in a browser are not public.
 * In live mode it reads active listings with the public (RLS-limited) key.
 */
export async function getPublicCatalog(): Promise<ItemSummary[]> {
  "use cache";
  cacheLife("minutes");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const profiles = new Map<string, Profile>(SEED_PROFILES.map((p) => [p.id, p]));
    return seedItems().map((i) => summarise(i, profiles, seedReviews()));
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: rows, error } = await sb.from("items").select("*").eq("status", "active");
  if (error) throw new Error(`Couldn't load public listings: ${error.message}`);
  const items: Item[] = rows.map((r) => ({
    id: r.id, ownerId: r.owner_id, title: r.title, description: r.description, category: r.category as CategorySlug,
    dailyPriceSatang: r.daily_price_satang, location: r.location, condition: r.condition as ItemCondition, rules: r.rules,
    images: r.images, availableFrom: r.available_from, availableUntil: r.available_until, status: r.status,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }));
  const ownerIds = [...new Set(items.map((i) => i.ownerId))];
  const [{ data: people }, { data: rv }] = await Promise.all([
    ownerIds.length ? sb.from("profiles").select("*").in("id", ownerIds) : Promise.resolve({ data: [] }),
    items.length ? sb.from("reviews").select("*").in("item_id", items.map((i) => i.id)) : Promise.resolve({ data: [] }),
  ]);
  const profiles = new Map<string, Profile>((people ?? []).map((p) => [p.id, {
    id: p.id, displayName: p.display_name, area: p.area, bio: p.bio, memberSince: p.member_since, isDemo: p.is_demo,
  }]));
  const reviews: Review[] = (rv ?? []).map((r) => ({
    id: r.id, itemId: r.item_id, authorName: r.author_name, rating: r.rating, comment: r.comment, createdAt: r.created_at, isDemo: r.is_demo,
  }));
  return items.map((i) => summarise(i, profiles, reviews));
}
