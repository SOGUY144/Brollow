export type CategorySlug =
  | "cameras-photography"
  | "electronics"
  | "camping-outdoors"
  | "tools-diy"
  | "music-equipment"
  | "sports-equipment"
  | "party-equipment";

export type ItemCondition = "like_new" | "good" | "fair";
export type ItemStatus = "active" | "paused";

/** ISO date string without time, interpreted in APP_TIMEZONE. */
export type IsoDate = string;

export interface Profile {
  id: string;
  displayName: string;
  area: string;
  bio: string;
  memberSince: IsoDate;
  /** True for fictional seed users; always shown as demo content. */
  isDemo: boolean;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: CategorySlug;
  /** Daily price in satang (1 baht = 100 satang). */
  dailyPriceSatang: number;
  location: string;
  condition: ItemCondition;
  rules: string[];
  images: string[];
  availableFrom: IsoDate | null;
  availableUntil: IsoDate | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  itemId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: IsoDate;
  isDemo: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export interface Booking {
  id: string;
  itemId: string;
  renterId: string;
  ownerId: string;
  startDate: IsoDate;
  endDate: IsoDate;
  days: number;
  dailyPriceSatang: number;
  totalSatang: number;
  status: BookingStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
}

/** A confirmed reservation range; carries no renter details. */
export interface BlockedRange {
  itemId: string;
  startDate: IsoDate;
  endDate: IsoDate;
}

export interface ItemSummary extends Item {
  owner: Profile | null;
  rating: number | null;
  reviewCount: number;
}

export interface ListingInput {
  title: string;
  description: string;
  category: CategorySlug | "";
  dailyPrice: string;
  location: string;
  condition: ItemCondition;
  rules: string;
  availableFrom: IsoDate | "";
  availableUntil: IsoDate | "";
}
