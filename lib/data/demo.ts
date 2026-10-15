"use client";

import { checkAvailability } from "../domain/availability";
import { transitionError } from "../domain/bookings";
import { rangesOverlap, todayInAppTz, validateRentalDates } from "../domain/dates";
import type { ValidListing } from "../domain/listing";
import { quoteRental } from "../domain/pricing";
import { ratingEligibility, validateRating } from "../domain/ratings";
import type { BlockedRange, Booking, BookingStatus, Item, ItemStatus, Profile, UserRating } from "../types";
import { DataError, summarise, type BookingWithItem, type DataApi, type Viewer } from "./api";
import { compressImage } from "./images";
import { DEMO_USER_ID, SEED_PROFILES, seedBookings, seedItems, seedRatings, seedReviews } from "./seed";

/**
 * Demo mode: no real authentication. Everything the demo user changes is
 * kept in this browser's localStorage and can be reset.
 */
const KEY = "brollow-demo-v3"; // v3: adds two-way ratings and finished seed rentals

interface DemoState {
  createdItems: Item[];
  itemEdits: Record<string, Partial<Item>>;
  bookings: Booking[];
  favorites: string[];
  ratings: UserRating[];
}

function freshState(): DemoState {
  return { createdItems: [], itemEdits: {}, bookings: seedBookings(todayInAppTz()), favorites: ["cam-03", "spo-02"], ratings: seedRatings() };
}

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...freshState(), ...(JSON.parse(raw) as DemoState) };
  } catch {
    // Storage unavailable or corrupt: fall back to a fresh in-memory state.
  }
  const state = freshState();
  save(state);
  return state;
}

function save(state: DemoState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    throw new DataError("Your browser storage is full. Remove a demo listing or reset the demo data.");
  }
}

const profiles = new Map<string, Profile>(SEED_PROFILES.map((p) => [p.id, p]));
const reviews = seedReviews();

function allItems(state: DemoState): Item[] {
  return [...seedItems(), ...state.createdItems].map((item) => ({ ...item, ...state.itemEdits[item.id] }));
}

function blocked(state: DemoState, excludeId?: string): BlockedRange[] {
  return state.bookings
    .filter((b) => b.status === "confirmed" && b.id !== excludeId)
    .map(({ itemId, startDate, endDate }) => ({ itemId, startDate, endDate }));
}

function withItem(state: DemoState, booking: Booking, counterpartId: string): BookingWithItem {
  const item = allItems(state).find((i) => i.id === booking.itemId) ?? null;
  const other = profiles.get(counterpartId);
  return {
    ...booking,
    item: item && { id: item.id, title: item.title, images: item.images, category: item.category, location: item.location },
    counterpart: other ? { id: other.id, displayName: other.displayName } : null,
  };
}

const DEMO_VIEWER: Viewer = { id: DEMO_USER_ID, displayName: profiles.get(DEMO_USER_ID)!.displayName, email: null };

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createDemoApi(): DataApi {
  return {
    mode: "demo",

    async getViewer() {
      return DEMO_VIEWER;
    },

    async listItems() {
      const state = load();
      return allItems(state).map((i) => summarise(i, profiles, reviews));
    },

    async getItem(id) {
      const state = load();
      const item = allItems(state).find((i) => i.id === id);
      if (!item) return null;
      return { item: summarise(item, profiles, reviews), reviews: reviews.filter((r) => r.itemId === id) };
    },

    async getBlockedRanges(itemIds) {
      const ranges = blocked(load());
      return itemIds ? ranges.filter((r) => itemIds.includes(r.itemId)) : ranges;
    },

    async listFavoriteIds() {
      return load().favorites;
    },

    async setFavorite(itemId, favorite) {
      const state = load();
      const set = new Set(state.favorites);
      if (favorite) set.add(itemId);
      else set.delete(itemId);
      state.favorites = [...set];
      save(state);
    },

    async requestBooking({ itemId, startDate, endDate, message }) {
      const state = load();
      const today = todayInAppTz();
      const dateError = validateRentalDates(startDate, endDate, today);
      if (dateError) throw new DataError(dateError);
      const item = allItems(state).find((i) => i.id === itemId);
      if (!item) throw new DataError("This item is no longer listed.");
      if (item.ownerId === DEMO_USER_ID) throw new DataError("You can't rent your own item.");
      const availability = checkAvailability(item, startDate, endDate, blocked(state));
      if (!availability.available) throw new DataError("The item isn't available for those dates.");
      const duplicate = state.bookings.some(
        (b) => b.itemId === itemId && b.renterId === DEMO_USER_ID && (b.status === "pending" || b.status === "confirmed") &&
          rangesOverlap(b.startDate, b.endDate, startDate, endDate),
      );
      if (duplicate) throw new DataError("You already have a request for this item on overlapping dates.");
      // Price is recalculated from the stored item, never taken from the page.
      const quote = quoteRental(item.dailyPriceSatang, startDate, endDate);
      const now = new Date().toISOString();
      const booking: Booking = {
        id: newId("bk"),
        itemId,
        renterId: DEMO_USER_ID,
        ownerId: item.ownerId,
        startDate,
        endDate,
        ...quote,
        status: "pending",
        message: message.trim().slice(0, 500),
        createdAt: now,
        updatedAt: now,
      };
      state.bookings.push(booking);
      save(state);
      return booking;
    },

    async listMyBookings() {
      const state = load();
      return state.bookings
        .filter((b) => b.renterId === DEMO_USER_ID)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((b) => withItem(state, b, b.ownerId));
    },

    async listIncomingRequests() {
      const state = load();
      return state.bookings
        .filter((b) => b.ownerId === DEMO_USER_ID)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((b) => withItem(state, b, b.renterId));
    },

    async setBookingStatus(bookingId, to: BookingStatus) {
      const state = load();
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new DataError("Booking not found.");
      const error = transitionError(booking, to, DEMO_USER_ID, todayInAppTz());
      if (error) throw new DataError(error);
      if (to === "confirmed") {
        const clash = blocked(state, booking.id).some(
          (r) => r.itemId === booking.itemId && rangesOverlap(r.startDate, r.endDate, booking.startDate, booking.endDate),
        );
        if (clash) throw new DataError("Another confirmed booking already covers these dates. Decline this request instead.");
      }
      booking.status = to;
      booking.updatedAt = new Date().toISOString();
      save(state);
    },

    async listMyListings() {
      return allItems(load()).filter((i) => i.ownerId === DEMO_USER_ID).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async createListing(value: ValidListing, photos: File[]) {
      const images = await Promise.all(photos.map((f) => compressImage(f)));
      const state = load();
      const now = new Date().toISOString();
      const item: Item = { id: newId("item"), ownerId: DEMO_USER_ID, ...value, images, status: "active", createdAt: now, updatedAt: now };
      state.createdItems.push(item);
      save(state);
      return item;
    },

    async updateListing(id, value, keepImages, newPhotos) {
      const state = load();
      const existing = allItems(state).find((i) => i.id === id);
      if (!existing || existing.ownerId !== DEMO_USER_ID) throw new DataError("You can only edit your own listings.");
      const added = await Promise.all(newPhotos.map((f) => compressImage(f)));
      const updated: Partial<Item> = {
        ...value,
        images: [...keepImages.filter((src) => existing.images.includes(src)), ...added],
        updatedAt: new Date().toISOString(),
      };
      const created = state.createdItems.find((i) => i.id === id);
      if (created) Object.assign(created, updated);
      else state.itemEdits[id] = { ...state.itemEdits[id], ...updated };
      save(state);
      return { ...existing, ...updated };
    },

    async setListingStatus(id, status: ItemStatus) {
      const state = load();
      const existing = allItems(state).find((i) => i.id === id);
      if (!existing || existing.ownerId !== DEMO_USER_ID) throw new DataError("You can only change your own listings.");
      const created = state.createdItems.find((i) => i.id === id);
      if (created) created.status = status;
      else state.itemEdits[id] = { ...state.itemEdits[id], status };
      save(state);
    },

    async signIn() {
      throw new DataError("Sign-in needs Supabase to be configured. You're using the demo account.");
    },
    async signUp() {
      throw new DataError("Registration needs Supabase to be configured. You're using the demo account.");
    },
    async signOut() {
      throw new DataError("The demo account can't sign out. Reset the demo data instead.");
    },

    async listRatings({ rateeIds, bookingIds }) {
      return load().ratings.filter(
        (r) => (!rateeIds || rateeIds.includes(r.rateeId)) && (!bookingIds || bookingIds.includes(r.bookingId)),
      );
    },

    async submitRating({ bookingId, score, tags, comment }) {
      const state = load();
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new DataError("Booking not found.");
      const eligibility = ratingEligibility(booking, DEMO_USER_ID, todayInAppTz(), state.ratings);
      if (!eligibility.canRate) throw new DataError(eligibility.reason);
      const problem = validateRating(eligibility.role, score, tags, comment.trim());
      if (problem) throw new DataError(problem);
      const rating: UserRating = {
        id: newId("rt"),
        bookingId,
        raterId: DEMO_USER_ID,
        raterName: DEMO_VIEWER.displayName,
        rateeId: eligibility.rateeId,
        role: eligibility.role,
        score,
        tags,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        isDemo: true,
      };
      state.ratings.push(rating);
      save(state);
      return rating;
    },

    async resetDemo() {
      save(freshState());
    },
  };
}
