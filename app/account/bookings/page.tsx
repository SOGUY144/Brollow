"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { BookingRow } from "@/components/booking-row";
import { RatingForm } from "@/components/rating-form";
import { ReputationLine, Stars } from "@/components/reputation";
import { errorMessage, useData } from "@/components/data-provider";
import { Button } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { allowedActions } from "@/lib/domain/bookings";
import { todayInAppTz } from "@/lib/domain/dates";
import { ratingEligibility, reputationOf } from "@/lib/domain/ratings";
import type { BookingWithItem } from "@/lib/data/api";
import type { BookingStatus } from "@/lib/types";

const ACTION_LABEL: Record<BookingStatus, string> = { confirmed: "Accept", declined: "Decline", cancelled: "Cancel", pending: "" };

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
      api.listRatings({ bookingIds: all.map((b) => b.id) }),
      api.listRatings({ rateeIds: [...new Set(all.map((b) => b.counterpart?.id).filter((id): id is string => Boolean(id)))] }),
    ]);
    return { mine, incoming, given, about, today: todayInAppTz() };
  }, [api]);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, to: BookingStatus) {
    if (to === "cancelled" && !window.confirm("Cancel this booking?")) return;
    setBusy(id);
    try {
      await api.setBookingStatus(id, to);
      toast.success(to === "confirmed" ? "Request accepted" : to === "declined" ? "Request declined" : "Booking cancelled");
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
  const actionButtons = (b: (typeof mine)[number]) =>
    allowedActions(b, viewer!.id, today).map((to) => (
      <Button key={to} variant={to === "confirmed" ? "default" : "outline"} className="h-9" disabled={busy === b.id} onClick={() => void act(b.id, to)}>
        {ACTION_LABEL[to]}
      </Button>
    ));

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
          Demo mode: requests and decisions are simulated and stored in this browser. No payment is taken and no real reservation is made.
        </p>
      )}

      <section aria-labelledby="mine-title" className="space-y-3">
        <h2 id="mine-title" className="text-lg font-semibold">Your rental requests</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t requested anything yet. <Link href="/search" className="text-primary underline">Find something to rent</Link>.</p>
        ) : (
          <ul className="space-y-3">{mine.map((b) => <BookingRow key={b.id} booking={b} who="Owner" actions={actionButtons(b)} reputation={reputation(b, "owner")} footer={ratingArea(b)} />)}</ul>
        )}
      </section>

      <section id="incoming" aria-labelledby="incoming-title" className="scroll-mt-24 space-y-3">
        <h2 id="incoming-title" className="text-lg font-semibold">Requests for your items</h2>
        <p className="text-sm text-muted-foreground">Accepting re-checks the dates; a request can&apos;t be accepted if another confirmed booking already covers them. Each renter&apos;s rating from other owners is shown to help you decide.</p>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet. <Link href="/list-item" className="text-primary underline">List an item</Link> to start lending.</p>
        ) : (
          <ul className="space-y-3">{incoming.map((b) => <BookingRow key={b.id} booking={b} who="Renter" actions={actionButtons(b)} reputation={reputation(b, "renter")} footer={ratingArea(b)} />)}</ul>
        )}
      </section>
    </div>
  );
}
