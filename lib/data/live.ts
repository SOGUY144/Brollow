"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { photoError } from "../domain/listing";
import type { BlockedRange, Booking, CategorySlug, Item, ItemCondition, Profile, Review } from "../types";
import { DataError, summarise, type BookingWithItem, type DataApi } from "./api";

/* Row shapes as stored in Postgres (see supabase/migrations). */
interface ItemRow {
  id: string; owner_id: string; title: string; description: string; category: string;
  daily_price_satang: number; location: string; condition: string; rules: string[]; images: string[];
  available_from: string | null; available_until: string | null; status: "active" | "paused";
  created_at: string; updated_at: string;
}
interface ProfileRow { id: string; display_name: string; area: string; bio: string; member_since: string; is_demo: boolean }
interface ReviewRow { id: string; item_id: string; author_name: string; rating: number; comment: string; created_at: string; is_demo: boolean }
interface BookingRow {
  id: string; item_id: string; renter_id: string; owner_id: string; start_date: string; end_date: string;
  days: number; daily_price_satang: number; total_satang: number; status: Booking["status"]; message: string;
  created_at: string; updated_at: string;
}

const toItem = (r: ItemRow): Item => ({
  id: r.id, ownerId: r.owner_id, title: r.title, description: r.description, category: r.category as CategorySlug,
  dailyPriceSatang: r.daily_price_satang, location: r.location, condition: r.condition as ItemCondition, rules: r.rules,
  images: r.images, availableFrom: r.available_from, availableUntil: r.available_until, status: r.status,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const toProfile = (r: ProfileRow): Profile => ({
  id: r.id, displayName: r.display_name, area: r.area, bio: r.bio, memberSince: r.member_since, isDemo: r.is_demo,
});
const toReview = (r: ReviewRow): Review => ({
  id: r.id, itemId: r.item_id, authorName: r.author_name, rating: r.rating, comment: r.comment, createdAt: r.created_at, isDemo: r.is_demo,
});
const toBooking = (r: BookingRow): Booking => ({
  id: r.id, itemId: r.item_id, renterId: r.renter_id, ownerId: r.owner_id, startDate: r.start_date, endDate: r.end_date,
  days: r.days, dailyPriceSatang: r.daily_price_satang, totalSatang: r.total_satang, status: r.status, message: r.message,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

/** Never falls back to demo data: any backend failure surfaces as an error. */
function fail(error: { message: string; code?: string } | null, fallback: string): never {
  // Messages raised by our own SQL functions (P0001) are written for users.
  if (error?.code === "P0001") throw new DataError(error.message);
  console.error(fallback, error);
  throw new DataError(fallback);
}

export function liveConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function createLiveApi(url: string, key: string): DataApi {
  const sb: SupabaseClient = createBrowserClient(url, key);

  async function uid(): Promise<string> {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new DataError("Please log in first.");
    return data.user.id;
  }

  async function profilesById(ids: string[]): Promise<Map<string, Profile>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await sb.from("profiles").select("*").in("id", [...new Set(ids)]);
    if (error) fail(error, "Couldn't load owner profiles.");
    return new Map((data as ProfileRow[]).map((p) => [p.id, toProfile(p)]));
  }

  async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const problem = photoError(file);
      if (problem) throw new DataError(problem);
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("item-images").upload(path, file, { contentType: file.type });
      if (error) fail(null, `Couldn't upload ${file.name}.`);
      urls.push(sb.storage.from("item-images").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function bookingsWithItems(rows: BookingRow[], counterpart: (b: BookingRow) => string): Promise<BookingWithItem[]> {
    const itemIds = [...new Set(rows.map((r) => r.item_id))];
    const items = new Map<string, Item>();
    if (itemIds.length) {
      const { data, error } = await sb.from("items").select("*").in("id", itemIds);
      if (error) fail(error, "Couldn't load booked items.");
      (data as ItemRow[]).forEach((r) => items.set(r.id, toItem(r)));
    }
    const people = await profilesById(rows.map(counterpart));
    return rows.map((r) => {
      const item = items.get(r.item_id);
      const other = people.get(counterpart(r));
      return {
        ...toBooking(r),
        item: item ? { id: item.id, title: item.title, images: item.images, category: item.category, location: item.location } : null,
        counterpart: other ? { id: other.id, displayName: other.displayName } : null,
      };
    });
  }

  const listingRow = (value: Parameters<DataApi["createListing"]>[0]) => ({
    title: value.title, description: value.description, category: value.category,
    daily_price_satang: value.dailyPriceSatang, location: value.location, condition: value.condition,
    rules: value.rules, available_from: value.availableFrom, available_until: value.availableUntil,
  });

  return {
    mode: "live",

    async getViewer() {
      const { data } = await sb.auth.getUser();
      if (!data.user) return null;
      const { data: profile } = await sb.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle();
      return { id: data.user.id, displayName: profile?.display_name ?? data.user.email ?? "You", email: data.user.email ?? null };
    },

    async listItems() {
      const { data, error } = await sb.from("items").select("*").eq("status", "active");
      if (error) fail(error, "Couldn't load listings.");
      const items = (data as ItemRow[]).map(toItem);
      const { data: rv, error: rvError } = await sb.from("reviews").select("*").in("item_id", items.map((i) => i.id));
      if (rvError) fail(rvError, "Couldn't load reviews.");
      const owners = await profilesById(items.map((i) => i.ownerId));
      const reviews = (rv as ReviewRow[]).map(toReview);
      return items.map((i) => summarise(i, owners, reviews));
    },

    async getItem(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data, error } = await sb.from("items").select("*").eq("id", id).maybeSingle();
      if (error) fail(error, "Couldn't load this item.");
      if (!data) return null;
      const item = toItem(data as ItemRow);
      const { data: rv, error: rvError } = await sb.from("reviews").select("*").eq("item_id", id).order("created_at", { ascending: false });
      if (rvError) fail(rvError, "Couldn't load reviews.");
      const reviews = (rv as ReviewRow[]).map(toReview);
      return { item: summarise(item, await profilesById([item.ownerId]), reviews), reviews };
    },

    async getBlockedRanges(itemIds) {
      const { data, error } = await sb.rpc("item_blocked_ranges", { p_item_ids: itemIds ?? null });
      if (error) fail(error, "Couldn't check availability.");
      return (data as { item_id: string; start_date: string; end_date: string }[]).map(
        (r): BlockedRange => ({ itemId: r.item_id, startDate: r.start_date, endDate: r.end_date }),
      );
    },

    async listFavoriteIds() {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await sb.from("favorites").select("item_id");
      if (error) fail(error, "Couldn't load your saved items.");
      return (data as { item_id: string }[]).map((r) => r.item_id);
    },

    async setFavorite(itemId, favorite) {
      const userId = await uid();
      const { error } = favorite
        ? await sb.from("favorites").upsert({ user_id: userId, item_id: itemId })
        : await sb.from("favorites").delete().eq("user_id", userId).eq("item_id", itemId);
      if (error) fail(error, "Couldn't update your saved items.");
    },

    async requestBooking({ itemId, startDate, endDate, message }) {
      await uid();
      const { data, error } = await sb.rpc("request_booking", { p_item_id: itemId, p_start: startDate, p_end: endDate, p_message: message });
      if (error) fail(error, "Couldn't send your request.");
      return toBooking(data as BookingRow);
    },

    async listMyBookings() {
      const userId = await uid();
      const { data, error } = await sb.from("bookings").select("*").eq("renter_id", userId).order("created_at", { ascending: false });
      if (error) fail(error, "Couldn't load your rentals.");
      return bookingsWithItems(data as BookingRow[], (b) => b.owner_id);
    },

    async listIncomingRequests() {
      const userId = await uid();
      const { data, error } = await sb.from("bookings").select("*").eq("owner_id", userId).order("start_date");
      if (error) fail(error, "Couldn't load incoming requests.");
      return bookingsWithItems(data as BookingRow[], (b) => b.renter_id);
    },

    async setBookingStatus(bookingId, to) {
      const { error } = await sb.rpc("set_booking_status", { p_booking_id: bookingId, p_status: to });
      if (error) fail(error, "Couldn't update the booking.");
    },

    async listMyListings() {
      const userId = await uid();
      const { data, error } = await sb.from("items").select("*").eq("owner_id", userId).order("updated_at", { ascending: false });
      if (error) fail(error, "Couldn't load your listings.");
      return (data as ItemRow[]).map(toItem);
    },

    async createListing(value, photos) {
      const userId = await uid();
      const images = await uploadPhotos(userId, photos);
      const { data, error } = await sb.from("items").insert({ ...listingRow(value), owner_id: userId, images }).select().single();
      if (error) fail(error, "Couldn't publish your listing.");
      return toItem(data as ItemRow);
    },

    async updateListing(id, value, keepImages, newPhotos) {
      const userId = await uid();
      const added = await uploadPhotos(userId, newPhotos);
      // RLS limits this update to the owner's own rows.
      const { data, error } = await sb.from("items")
        .update({ ...listingRow(value), images: [...keepImages, ...added] })
        .eq("id", id).eq("owner_id", userId).select().maybeSingle();
      if (error) fail(error, "Couldn't save your listing.");
      if (!data) throw new DataError("You can only edit your own listings.");
      return toItem(data as ItemRow);
    },

    async setListingStatus(id, status) {
      const userId = await uid();
      const { error, count } = await sb.from("items").update({ status }, { count: "exact" }).eq("id", id).eq("owner_id", userId);
      if (error) fail(error, "Couldn't update your listing.");
      if (!count) throw new DataError("You can only change your own listings.");
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new DataError(error.message);
    },

    async signUp(email, password, displayName) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
      if (error) throw new DataError(error.message);
      return { needsConfirmation: !data.session };
    },

    async signOut() {
      const { error } = await sb.auth.signOut();
      if (error) throw new DataError(error.message);
    },

    async resetDemo() {
      throw new DataError("Reset is only available in demo mode.");
    },
  };
}
