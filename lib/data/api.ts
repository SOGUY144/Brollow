import type { ValidListing } from "../domain/listing";
import type { BlockedRange, Booking, BookingStatus, Item, ItemStatus, ItemSummary, Profile, RatingTag, Review, UserRating, Wallet } from "../types";

export type DataMode = "demo" | "live";

export interface Viewer {
  id: string;
  displayName: string;
  email: string | null;
}

export interface BookingWithItem extends Booking {
  item: Pick<Item, "id" | "title" | "images" | "category" | "location"> | null;
  counterpart: Pick<Profile, "id" | "displayName"> | null;
}

export interface ItemDetail {
  item: ItemSummary;
  reviews: Review[];
}

/** User-facing failure; message is safe to show as-is. */
export class DataError extends Error {}

/**
 * One interface for both modes so pages never branch on demo vs live.
 * Live mode enforces every rule again in the database.
 */
export interface DataApi {
  mode: DataMode;
  getViewer(): Promise<Viewer | null>;
  listItems(): Promise<ItemSummary[]>;
  getItem(id: string): Promise<ItemDetail | null>;
  getBlockedRanges(itemIds?: string[]): Promise<BlockedRange[]>;

  listFavoriteIds(): Promise<string[]>;
  setFavorite(itemId: string, favorite: boolean): Promise<void>;

  requestBooking(input: { itemId: string; startDate: string; endDate: string; message: string }): Promise<Booking>;
  listMyBookings(): Promise<BookingWithItem[]>;
  listIncomingRequests(): Promise<BookingWithItem[]>;
  setBookingStatus(
    bookingId: string,
    to: BookingStatus,
    details?: { pickupPhotoUrl?: string; pickupNote?: string; returnPhotoUrl?: string }
  ): Promise<void>;

  /** Ratings are public: anyone can read a person's reputation. */
  listRatings(filter: { rateeIds?: string[]; bookingIds?: string[] }): Promise<UserRating[]>;
  submitRating(input: { bookingId: string; score: number; tags: RatingTag[]; comment: string }): Promise<UserRating>;

  listMyListings(): Promise<Item[]>;
  createListing(value: ValidListing, photos: File[]): Promise<Item>;
  updateListing(id: string, value: ValidListing, keepImages: string[], newPhotos: File[]): Promise<Item>;
  setListingStatus(id: string, status: ItemStatus): Promise<void>;

  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  resetDemo(): Promise<void>;

  getWallet(): Promise<Wallet>;
  depositWallet(amountSatang: number): Promise<void>;
  withdrawWallet(amountSatang: number, destination: string): Promise<void>;
}

export function summarise(item: Item, owners: Map<string, Profile>, reviews: Review[]): ItemSummary {
  const own = reviews.filter((r) => r.itemId === item.id);
  const rating = own.length ? Math.round((own.reduce((s, r) => s + r.rating, 0) / own.length) * 10) / 10 : null;
  return { ...item, owner: owners.get(item.ownerId) ?? null, rating, reviewCount: own.length };
}
