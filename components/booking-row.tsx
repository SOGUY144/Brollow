"use client";

import { CheckCircle2, Eye, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ItemImage } from "@/components/item-image";
import { InspectionProofModal } from "@/components/handover-modal";
import { STATUS_LABEL } from "@/lib/domain/bookings";
import type { BookingWithItem } from "@/lib/data/api";
import { formatDateRange, formatMoney, pluralDays } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-blue-100 text-blue-900 border-blue-200",
  escrow_held: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
  picked_up: "bg-emerald-100 text-emerald-900 border-emerald-300",
  returned: "bg-purple-100 text-purple-900 border-purple-200",
  completed: "bg-emerald-100 text-emerald-900 border-emerald-200",
  confirmed: "bg-blue-100 text-blue-900 border-blue-200",
  declined: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function BookingRow({
  booking,
  who,
  actions,
  reputation,
  footer,
}: {
  booking: BookingWithItem;
  who: string;
  actions?: React.ReactNode;
  /** The other person's reputation, shown under their name. */
  reputation?: React.ReactNode;
  /** Full-width area below the row, e.g. the rating form. */
  footer?: React.ReactNode;
}) {
  const [showProof, setShowProof] = useState(false);

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full shrink-0 sm:w-28">
          <ItemImage
            src={booking.item?.images[0]}
            alt={booking.item?.title ?? "Removed item"}
            category={booking.item?.category ?? "electronics"}
            className="rounded-lg"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {booking.item ? (
              <Link href={`/items/${booking.item.id}`} className="font-medium hover:underline">
                {booking.item.title}
              </Link>
            ) : (
              <span className="font-medium">Item no longer listed</span>
            )}
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1",
                STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending
              )}
            >
              {booking.status === "escrow_held" && <Lock className="size-3" />}
              {booking.status === "picked_up" && <ShieldCheck className="size-3 text-emerald-600" />}
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>

            {booking.payoutStatus === "released" && (
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Payout Released to Owner Wallet
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {formatDateRange(booking.startDate, booking.endDate)} · {pluralDays(booking.days)} ·{" "}
            {formatMoney(booking.dailyPriceSatang)}/day ·{" "}
            <span className="font-medium text-foreground">{formatMoney(booking.totalSatang)}</span>
          </p>
          <p className="text-muted-foreground">
            {who}: {booking.counterpart?.displayName ?? "Unknown"}
          </p>
          {reputation}
          {booking.message && <p className="italic text-muted-foreground">“{booking.message}”</p>}
        </div>
        {actions && <div className="flex flex-wrap shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {booking.status === "escrow_held" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-2.5 text-xs text-foreground flex items-center gap-2">
          <Lock className="size-4 shrink-0 text-amber-700" />
          <span className="leading-relaxed">
            <strong className="font-semibold text-amber-900">Brollow Escrow Protection:</strong> Rental funds ({formatMoney(booking.totalSatang)}) are held securely in escrow. Funds will be released to the owner upon handover inspection confirmation.
          </span>
        </div>
      )}

      {booking.pickupPhotoUrl && (
        <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="size-4" /> Handover inspection verified
          </span>
          <button
            type="button"
            onClick={() => setShowProof(true)}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline cursor-pointer"
          >
            <Eye className="size-3.5" /> View Inspection Proof
          </button>
        </div>
      )}

      {footer && <div className="mt-3 border-t pt-3">{footer}</div>}

      <InspectionProofModal
        isOpen={showProof}
        onClose={() => setShowProof(false)}
        photoUrl={booking.pickupPhotoUrl}
        note={booking.pickupNote}
        pickedUpAt={booking.pickedUpAt}
      />
    </li>
  );
}
