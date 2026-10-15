"use client";

import Link from "next/link";
import { ItemImage } from "@/components/item-image";
import { STATUS_LABEL } from "@/lib/domain/bookings";
import type { BookingWithItem } from "@/lib/data/api";
import { formatDateRange, formatMoney, pluralDays } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-brand-soft text-primary",
  declined: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
} as const;

export function BookingRow({
  booking, who, actions, reputation, footer,
}: {
  booking: BookingWithItem;
  who: string;
  actions?: React.ReactNode;
  /** The other person's reputation, shown under their name. */
  reputation?: React.ReactNode;
  /** Full-width area below the row, e.g. the rating form. */
  footer?: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border bg-card p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="w-full shrink-0 sm:w-28">
        <ItemImage src={booking.item?.images[0]} alt={booking.item?.title ?? "Removed item"} category={booking.item?.category ?? "electronics"} className="rounded-lg" />
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {booking.item ? (
            <Link href={`/items/${booking.item.id}`} className="font-medium hover:underline">{booking.item.title}</Link>
          ) : (
            <span className="font-medium">Item no longer listed</span>
          )}
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[booking.status])}>{STATUS_LABEL[booking.status]}</span>
        </div>
        <p className="text-muted-foreground">
          {formatDateRange(booking.startDate, booking.endDate)} · {pluralDays(booking.days)} · {formatMoney(booking.dailyPriceSatang)}/day ·{" "}
          <span className="font-medium text-foreground">{formatMoney(booking.totalSatang)}</span>
        </p>
        <p className="text-muted-foreground">{who}: {booking.counterpart?.displayName ?? "Unknown"}</p>
        {reputation}
        {booking.message && <p className="italic text-muted-foreground">“{booking.message}”</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
    {footer && <div className="mt-3 border-t pt-3">{footer}</div>}
    </li>
  );
}
