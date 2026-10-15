"use client";

import { Camera, CheckCircle2, FileText, Lock, MessageCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { BookingRow } from "@/components/booking-row";
import { RatingForm } from "@/components/rating-form";
import { ReputationLine, Stars } from "@/components/reputation";
import { errorMessage, useData } from "@/components/data-provider";
import { BookingChatDrawer } from "@/components/booking-chat-drawer";
import { HandoverModal } from "@/components/handover-modal";
import { PaymentModal } from "@/components/payment-modal";
import { RentalReceiptModal } from "@/components/rental-receipt-modal";
import { Button } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { allowedActions } from "@/lib/domain/bookings";
import { todayInAppTz } from "@/lib/domain/dates";
import { ratingEligibility, reputationOf } from "@/lib/domain/ratings";
import type { BookingWithItem } from "@/lib/data/api";
import { formatMoney } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export default function BookingsPage() {
  return (
    <AccountShell title="Bookings">
      <Bookings />
    </AccountShell>
  );
}

function Bookings() {
  const { api, mode, viewer } = useData();
  const data = useLoad(async () => {
    const [mine, incoming] = await Promise.all([api.listMyBookings(), api.listIncomingRequests()]);
    const all = [...mine, ...incoming];
    // Ratings already given on these bookings, and the other people's reputations.
    const [given, about] = await Promise.all([
      api.listRatings({ bookingIds: all.map((b) => b.id) }).catch(() => []),
      api.listRatings({ rateeIds: [...new Set(all.map((b) => b.counterpart?.id).filter((id): id is string => Boolean(id)))] }).catch(() => []),
    ]);
    return { mine, incoming, given, about, today: todayInAppTz() };
  }, [api]);

  const [busy, setBusy] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<BookingWithItem | null>(null);
  const [inspectingBooking, setInspectingBooking] = useState<BookingWithItem | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<BookingWithItem | null>(null);
  const [chatBooking, setChatBooking] = useState<BookingWithItem | null>(null);

  async function act(id: string, to: BookingStatus, details?: { pickupPhotoUrl?: string; pickupNote?: string }) {
    if (to === "cancelled" && !window.confirm("Cancel this booking?")) return;
    setBusy(id);
    try {
      await api.setBookingStatus(id, to, details);
      if (to === "approved" || to === "confirmed") {
        toast.success("Rental request approved.");
      } else if (to === "declined") {
        toast.info("Rental request declined.");
      } else if (to === "cancelled") {
        toast.info("Booking cancelled.");
      } else if (to === "escrow_held") {
        toast.success("Payment secured in Escrow. Funds are safely held.");
      } else if (to === "picked_up") {
        toast.success("Inspection verified. Escrow payout released to the owner.");
      } else if (to === "returned") {
        toast.success("Equipment marked as returned.");
      } else if (to === "completed") {
        toast.success("Rental completed successfully.");
      }
      data.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (data.status === "loading") return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  if (data.status === "error") {
    return (
      <div role="alert" className="text-sm">
        <p className="text-destructive">{data.message}</p>
        <Button variant="outline" className="mt-3" onClick={data.reload}>Try again</Button>
      </div>
    );
  }

  const { mine, incoming, given, about, today } = data.data;

  // Actions for Renter (viewer is renter)
  const renterActionButtons = (b: (typeof mine)[number]) => {
    const actions = allowedActions(b, viewer!.id, today);
    const isBusy = busy === b.id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {/* Step 4: Pay to Escrow (Opens Checkout Modal) */}
        {(b.status === "approved" || b.status === "confirmed") && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5"
            disabled={isBusy}
            onClick={() => setPayingBooking(b)}
          >
            <Lock className="size-3.5" />
            Pay into Escrow ({formatMoney(b.totalSatang)})
          </Button>
        )}

        {/* Step 5: Inspect and Handover (Opens Inspection Modal) */}
        {b.status === "escrow_held" && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5"
            disabled={isBusy}
            onClick={() => setInspectingBooking(b)}
          >
            <Camera className="size-3.5" />
            Inspect & Confirm Handover
          </Button>
        )}

        {/* Step 6: Return item */}
        {b.status === "picked_up" && actions.includes("returned") && (
          <Button
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
            disabled={isBusy}
            onClick={() => void act(b.id, "returned")}
          >
            <RotateCcw className="size-3.5" />
            Return Equipment
          </Button>
        )}

        {/* Returned status */}
        {b.status === "returned" && (
          <span className="text-xs text-muted-foreground italic">Returned · Awaiting owner check</span>
        )}

        {/* Completed status */}
        {b.status === "completed" && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="size-3.5" /> Rental Completed
          </span>
        )}

        {/* View Receipt */}
        {["escrow_held", "picked_up", "returned", "completed"].includes(b.status) && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-brand-soft flex items-center gap-1.5"
            onClick={() => setReceiptBooking(b)}
          >
            <FileText className="size-3.5" />
            View Receipt
          </Button>
        )}

        {/* Chat with Owner */}
        {b.status !== "cancelled" && b.status !== "declined" && (
          <Button
            size="sm"
            variant="outline"
            className="border-muted-foreground/30 text-foreground hover:bg-muted flex items-center gap-1.5"
            onClick={() => setChatBooking(b)}
          >
            <MessageCircle className="size-3.5 text-primary" />
            Chat with Owner
          </Button>
        )}

        {/* Cancel option */}
        {actions.includes("cancelled") && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={isBusy}
            onClick={() => void act(b.id, "cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  // Actions for Owner (viewer is owner)
  const ownerActionButtons = (b: (typeof incoming)[number]) => {
    const actions = allowedActions(b, viewer!.id, today);
    const isBusy = busy === b.id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {/* Approve / Decline */}
        {b.status === "pending" && (
          <>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={isBusy}
              onClick={() => void act(b.id, "approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => void act(b.id, "declined")}
            >
              Decline
            </Button>
          </>
        )}

        {/* Approved: Waiting for renter to pay */}
        {(b.status === "approved" || b.status === "confirmed") && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
            Awaiting renter payment into Escrow
          </span>
        )}

        {/* Escrow held: Ready for pickup */}
        {b.status === "escrow_held" && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-medium">
            <Lock className="size-3" /> Secured in Escrow · Ready for handover
          </span>
        )}

        {/* Picked up: Active rental */}
        {b.status === "picked_up" && (
          <Button
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
            disabled={isBusy}
            onClick={() => void act(b.id, "returned")}
          >
            <RotateCcw className="size-3.5" />
            Mark Equipment Returned
          </Button>
        )}

        {/* Returned: Complete rental */}
        {b.status === "returned" && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs flex items-center gap-1.5"
            disabled={isBusy}
            onClick={() => void act(b.id, "completed")}
          >
            <CheckCircle2 className="size-3.5" />
            Confirm Return & Complete
          </Button>
        )}

        {/* Completed */}
        {b.status === "completed" && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="size-3.5" /> Rental Completed
          </span>
        )}

        {/* View Receipt */}
        {["escrow_held", "picked_up", "returned", "completed"].includes(b.status) && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-brand-soft flex items-center gap-1.5"
            onClick={() => setReceiptBooking(b)}
          >
            <FileText className="size-3.5" />
            View Receipt
          </Button>
        )}

        {/* Chat with Renter */}
        {b.status !== "cancelled" && b.status !== "declined" && (
          <Button
            size="sm"
            variant="outline"
            className="border-muted-foreground/30 text-foreground hover:bg-muted flex items-center gap-1.5"
            onClick={() => setChatBooking(b)}
          >
            <MessageCircle className="size-3.5 text-primary" />
            Chat with Renter
          </Button>
        )}

        {/* Cancel option */}
        {actions.includes("cancelled") && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={isBusy}
            onClick={() => void act(b.id, "cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  // As a renter you see the owner's reputation as an owner, and vice versa.
  const reputation = (b: BookingWithItem, role: "owner" | "renter") => {
    const id = b.counterpart?.id;
    return id ? <ReputationLine rep={reputationOf(id, about)[role === "owner" ? "asOwner" : "asRenter"]} role={role} /> : null;
  };

  const ratingArea = (b: BookingWithItem) => {
    const mineRating = given.find((r) => r.bookingId === b.id && r.raterId === viewer!.id);
    if (mineRating) {
      return <p className="flex items-center gap-2 text-sm text-muted-foreground">You rated this rental <Stars score={mineRating.score} /></p>;
    }
    const eligibility = ratingEligibility(b, viewer!.id, today, given);
    if (!eligibility.canRate) return null;
    return (
      <RatingForm
        bookingId={b.id}
        role={eligibility.role}
        name={b.counterpart?.displayName ?? "them"}
        deadline={eligibility.deadline}
        onDone={data.reload}
      />
    );
  };

  return (
    <div className="space-y-10">
      {mode === "demo" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Demo mode: requests and decisions are simulated and stored in this browser. No real payment is taken.
        </p>
      )}

      <section aria-labelledby="mine-title" className="space-y-3">
        <h2 id="mine-title" className="text-lg font-semibold">Your Rental Requests</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t requested anything yet. <Link href="/search" className="text-primary underline">Find something to rent</Link>.</p>
        ) : (
          <ul className="space-y-3">
            {mine.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                who="Owner"
                actions={renterActionButtons(b)}
                reputation={reputation(b, "owner")}
                footer={ratingArea(b)}
              />
            ))}
          </ul>
        )}
      </section>

      <section id="incoming" aria-labelledby="incoming-title" className="scroll-mt-24 space-y-3">
        <h2 id="incoming-title" className="text-lg font-semibold">Requests for Your Equipment</h2>
        <p className="text-sm text-muted-foreground">
          Accepting re-checks the dates; a request can&apos;t be accepted if another confirmed booking already covers them. Each renter&apos;s reputation is shown to help you decide.
        </p>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet. <Link href="/list-item" className="text-primary underline">List an item</Link> to start lending.</p>
        ) : (
          <ul className="space-y-3">
            {incoming.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                who="Renter"
                actions={ownerActionButtons(b)}
                reputation={reputation(b, "renter")}
                footer={ratingArea(b)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Escrow Checkout Modal */}
      {payingBooking && (
        <PaymentModal
          booking={payingBooking}
          isOpen={!!payingBooking}
          onClose={() => setPayingBooking(null)}
          onConfirm={async () => {
            await act(payingBooking.id, "escrow_held");
          }}
        />
      )}

      {/* Handover Inspection Modal */}
      {inspectingBooking && (
        <HandoverModal
          booking={inspectingBooking}
          isOpen={!!inspectingBooking}
          onClose={() => setInspectingBooking(null)}
          onConfirm={async (photoUrl, note) => {
            await act(inspectingBooking.id, "picked_up", {
              pickupPhotoUrl: photoUrl,
              pickupNote: note,
            });
          }}
        />
      )}

      {/* Rental Agreement & Receipt Modal */}
      {receiptBooking && (
        <RentalReceiptModal
          booking={receiptBooking}
          isOpen={!!receiptBooking}
          onClose={() => setReceiptBooking(null)}
          viewerId={viewer?.id ?? ""}
          viewerName={viewer?.displayName}
        />
      )}

      {/* Booking Coordination Chat Drawer */}
      {chatBooking && (
        <BookingChatDrawer
          booking={chatBooking}
          currentViewerId={viewer?.id ?? ""}
          isOpen={!!chatBooking}
          onClose={() => setChatBooking(null)}
          api={api}
        />
      )}
    </div>
  );
}
