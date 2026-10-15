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
    case "pending->approved":
    case "pending->confirmed":
    case "pending->declined":
      return isOwner ? null : "Only the owner can accept or decline a request.";
    case "pending->cancelled":
      return isRenter ? null : "Owners decline requests rather than cancelling them.";
    case "approved->escrow_held":
    case "confirmed->escrow_held":
      return isRenter ? null : "Only the renter can pay and lock funds into escrow.";
    case "escrow_held->picked_up":
      return isRenter ? null : "Only the renter can confirm item inspection and pickup.";
    case "picked_up->returned":
      return isRenter || isOwner ? null : "Only participants can report return.";
    case "returned->completed":
      return isOwner ? null : "Only the owner can complete the rental after inspection.";
    case "approved->cancelled":
    case "confirmed->cancelled":
    case "escrow_held->cancelled":
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
  const actions = (
    [
      "approved",
      "confirmed",
      "declined",
      "cancelled",
      "escrow_held",
      "picked_up",
      "returned",
      "completed",
    ] as const
  ).filter((to) => transitionError(booking, to, actorId, today) === null);

  if (actions.includes("approved") && actions.includes("confirmed")) {
    return actions.filter((a) => a !== "confirmed");
  }
  return actions as unknown as BookingStatus[];
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending review",
  approved: "Approved (Pay to hold)",
  escrow_held: "Secured in Escrow",
  picked_up: "Active (Paid to owner)",
  returned: "Returned (Inspect)",
  completed: "Completed",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};
