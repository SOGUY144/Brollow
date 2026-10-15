import type { Booking, IsoDate, RatingRole, RatingTag, Reputation, RoleReputation, UserRating } from "../types";
import { addDays } from "./dates";

/**
 * Two-way ratings after a rental:
 * - the renter rates the owner (on time, item as described, fair about deposits/damage)
 * - the owner rates the renter (returned on time, looked after the item)
 * Each side rates once per booking, only for a confirmed booking whose return
 * date has passed, and within RATING_WINDOW_DAYS after it.
 */
export const RATING_WINDOW_DAYS = 30;

export const TAGS: Record<RatingRole, { tag: RatingTag; label: string }[]> = {
  owner: [
    { tag: "on_time", label: "Handed over on time" },
    { tag: "as_described", label: "Item as described" },
    { tag: "fair_charges", label: "Fair about deposits and damage" },
    { tag: "communicative", label: "Easy to communicate with" },
  ],
  renter: [
    { tag: "returned_on_time", label: "Returned on time" },
    { tag: "good_care", label: "Looked after the item" },
    { tag: "communicative", label: "Easy to communicate with" },
  ],
};

export function tagLabel(role: RatingRole, tag: RatingTag): string {
  return TAGS[role].find((t) => t.tag === tag)?.label ?? tag;
}

export type Eligibility =
  | { canRate: true; role: RatingRole; rateeId: string; deadline: IsoDate }
  | { canRate: false; reason: string };

export function ratingEligibility(
  booking: Pick<Booking, "id" | "status" | "renterId" | "ownerId" | "endDate">,
  actorId: string,
  today: IsoDate,
  existing: Pick<UserRating, "bookingId" | "raterId">[],
): Eligibility {
  const isRenter = actorId === booking.renterId;
  const isOwner = actorId === booking.ownerId;
  if (!isRenter && !isOwner) return { canRate: false, reason: "Only the renter and owner can rate this rental." };
  const ratableStatuses: Booking["status"][] = ["confirmed", "completed", "returned", "picked_up"];
  if (!ratableStatuses.includes(booking.status)) return { canRate: false, reason: "Only active or finished rentals can be rated." };
  if (booking.endDate >= today) return { canRate: false, reason: "You can rate after the return date." };
  const deadline = addDays(booking.endDate, RATING_WINDOW_DAYS);
  if (today > deadline) return { canRate: false, reason: "The rating period for this rental has ended." };
  if (existing.some((r) => r.bookingId === booking.id && r.raterId === actorId)) {
    return { canRate: false, reason: "You've already rated this rental." };
  }
  return isRenter
    ? { canRate: true, role: "owner", rateeId: booking.ownerId, deadline }
    : { canRate: true, role: "renter", rateeId: booking.renterId, deadline };
}

/** Returns a user-facing error, or null when the rating is valid. */
export function validateRating(role: RatingRole, score: number, tags: RatingTag[], comment: string): string | null {
  if (!Number.isInteger(score) || score < 1 || score > 5) return "Choose a score from 1 to 5 stars.";
  const allowed = new Set(TAGS[role].map((t) => t.tag));
  if (tags.some((t) => !allowed.has(t))) return "One of the selected tags doesn't apply here.";
  if (new Set(tags).size !== tags.length) return "Each tag can only be selected once.";
  if (comment.length > 500) return "Keep the comment under 500 characters.";
  return null;
}

function summariseRole(ratings: UserRating[]): RoleReputation {
  const tagCounts: Partial<Record<RatingTag, number>> = {};
  for (const r of ratings) for (const t of r.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  const average = ratings.length ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10 : null;
  return { average, count: ratings.length, tagCounts };
}

export function reputationOf(userId: string, ratings: UserRating[]): Reputation {
  const mine = ratings.filter((r) => r.rateeId === userId);
  return {
    asOwner: summariseRole(mine.filter((r) => r.role === "owner")),
    asRenter: summariseRole(mine.filter((r) => r.role === "renter")),
  };
}

/** The tags most often given, for a compact "known for" line. */
export function topTags(rep: RoleReputation, limit = 2): { tag: RatingTag; count: number }[] {
  return (Object.entries(rep.tagCounts) as [RatingTag, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}
