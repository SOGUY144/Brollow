import type { Booking, BookingStatus, IsoDate } from "../types";

/**
 * Booking policy:
 * - pending -> confirmed | declined   (owner only)
 * - pending -> cancelled              (renter, any time before it is decided)
 * - confirmed -> cancelled            (renter or owner, before the start date)
 * Confirmation must re-check availability; that check lives in the data layer
 * (and in the database exclusion constraint in live mode).
 */
export function transitionError(
  booking: Pick<Booking, "status" | "renterId" | "ownerId" | "startDate">,
  to: BookingStatus,
  actorId: string,
  today: IsoDate,
): string | null {
  const isOwner = actorId === booking.ownerId;
  const isRenter = actorId === booking.renterId;
  if (!isOwner && !isRenter) return "You can't change this booking.";

  switch (`${booking.status}->${to}`) {
    case "pending->confirmed":
    case "pending->declined":
      return isOwner ? null : "Only the owner can accept or decline a request.";
    case "pending->cancelled":
      return isRenter ? null : "Owners decline requests rather than cancelling them.";
    case "confirmed->cancelled":
      return booking.startDate > today ? null : "Bookings can only be cancelled before the start date.";
    default:
      return `A ${booking.status} booking can't become ${to}.`;
  }
}

export function allowedActions(
  booking: Pick<Booking, "status" | "renterId" | "ownerId" | "startDate">,
  actorId: string,
  today: IsoDate,
): BookingStatus[] {
  return (["confirmed", "declined", "cancelled"] as const).filter(
    (to) => transitionError(booking, to, actorId, today) === null,
  );
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};
