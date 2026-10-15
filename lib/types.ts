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
  /** Owner-provided pickup coordinates. Never inferred from an area name. */
  coordinates?: import("./domain/location").Coordinates | null;
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

export type BookingStatus =
  | "pending"
  | "approved"
  | "escrow_held"
  | "picked_up"
  | "returned"
  | "completed"
  | "confirmed"
  | "declined"
  | "cancelled";

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
  pickupPhotoUrl?: string | null;
  pickupNote?: string | null;
  pickedUpAt?: string | null;
  payoutStatus?: "held" | "released" | null;
  returnPhotoUrl?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The role of the person being rated in that rental. */
export type RatingRole = "owner" | "renter";

export type OwnerRatingTag = "on_time" | "as_described" | "fair_charges" | "communicative";
export type RenterRatingTag = "returned_on_time" | "good_care" | "communicative";
export type RatingTag = OwnerRatingTag | RenterRatingTag;

/** One person's rating of the other side of a finished rental. */
export interface UserRating {
  id: string;
  bookingId: string;
  raterId: string;
  raterName: string;
  rateeId: string;
  role: RatingRole;
  score: number;
  tags: RatingTag[];
  comment: string;
  createdAt: string;
  isDemo: boolean;
}

export interface RoleReputation {
  average: number | null;
  count: number;
  /** How many ratings ticked each tag. */
  tagCounts: Partial<Record<RatingTag, number>>;
}

export interface Reputation {
  asOwner: RoleReputation;
  asRenter: RoleReputation;
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
  pickupLatitude?: string;
  pickupLongitude?: string;
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

export type WalletTransactionType = "deposit" | "withdrawal" | "escrow_payout" | "rental_payment";

export interface WalletTransaction {
  id: string;
  userId: string;
  amountSatang: number;
  type: WalletTransactionType;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface Wallet {
  balanceSatang: number;
  transactions: WalletTransaction[];
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: "renter" | "owner";
  text: string;
  createdAt: string;
}

