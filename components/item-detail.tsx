"use client";

import { CalendarX2, CheckCircle2, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, useData } from "@/components/data-provider";
import { RentalCalendar } from "@/components/rental-calendar";
import { PickupLocation } from "@/components/pickup-location";
import { FavoriteButton } from "@/components/favorite-button";
import { ItemCard } from "@/components/item-card";
import { ItemImage } from "@/components/item-image";
import { RatingList, ReputationLine } from "@/components/reputation";
import { reputationOf } from "@/lib/domain/ratings";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { categoryName, conditionLabel } from "@/lib/categories";
import { availabilityMessage, checkAvailability } from "@/lib/domain/availability";
import { validateRentalDates } from "@/lib/domain/dates";
import { quoteRental } from "@/lib/domain/pricing";
import { formatDate, formatDateRange, formatMoney, pluralDays } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ItemDetailView({ id, today }: { id: string; today: string }) {
  const { api } = useData();
  const detail = useLoad(async () => {
    const [found, blocked, all] = await Promise.all([api.getItem(id), api.getBlockedRanges([id]), api.listItems()]);
    const related = found
      ? all.filter((i) => i.id !== id && i.status === "active" && i.category === found.item.category).slice(0, 4)
      : [];
    // The owner's public ratings from past renters.
    const ownerRatings = found
      ? await api.listRatings({ rateeIds: [found.item.ownerId] }).catch(() => [])
      : [];
    return { found, blocked, related, ownerRatings };
  }, [api, id]);
  const [photo, setPhoto] = useState(0);
  const title = detail.status === "ready" && detail.data.found ? detail.data.found.item.title : null;
  useEffect(() => {
    // Public listings get a full title from the server. Listings that exist only in
    // this browser (demo mode) get the generic one, so fill in the name here.
    if (title && document.title.startsWith("Item for rent")) document.title = `${title} · Brollow`;
  }, [title]);

  if (detail.status === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (detail.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" role="alert">
        <p className="font-medium">{detail.message}</p>
        <Button variant="outline" className="mt-4" onClick={detail.reload}>Try again</Button>
      </div>
    );
  }
  const { found, blocked, related, ownerRatings } = detail.data;
  if (!found) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">This item isn&apos;t available</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed, or the link is wrong.</p>
        <Link href="/search" className={cn(buttonVariants(), "mt-6 h-10 px-4")}>Browse items</Link>
      </div>
    );
  }

  const { item, reviews } = found;
  const images = item.images.length ? item.images : [undefined];
  const upcoming = blocked.filter((b) => b.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href="/search" className="hover:underline">All items</Link> /{" "}
        <Link href={`/search?category=${item.category}`} className="hover:underline">{categoryName(item.category)}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="detail-content min-w-0 space-y-6">
          <section aria-label="Photos" className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
            <div className="relative min-w-0 sm:col-start-2 sm:row-start-1">
              <ItemImage src={images[photo]} alt={`${item.title}, photo ${photo + 1} of ${images.length}`} category={item.category} className="rounded-2xl [&_img]:object-contain" eager />
              <FavoriteButton itemId={item.id} title={item.title} className="absolute right-3 top-3" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 sm:col-start-1 sm:row-start-1 sm:flex-col">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={photo === i}
                    className="w-16 shrink-0 overflow-hidden rounded-lg ring-offset-2 aria-pressed:ring-2 aria-pressed:ring-primary"
                  >
                    <ItemImage src={src} alt="" category={item.category} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" /> {item.location}</span>
              <span>Condition: {conditionLabel(item.condition)}</span>
              {item.rating !== null && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" /> {item.rating.toFixed(1)} · {item.reviewCount} {item.reviewCount === 1 ? "review" : "reviews"}
                </span>
              )}
            </p>
            {item.owner?.isDemo && <p className="text-xs font-medium text-amber-800">Demo listing · fictional owner and listing information</p>}
            <p className="whitespace-pre-line leading-relaxed">{item.description}</p>
          </section>

          {item.rules.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Rental rules</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {item.rules.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          {item.owner && (
            <section className="flex items-start gap-3 rounded-xl border bg-card p-4" aria-label="About the owner">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-primary" aria-hidden="true">
                {item.owner.displayName.slice(0, 1)}
              </div>
              <div className="text-sm">
                <p className="font-medium">
                  Lent by {item.owner.displayName}
                  {item.owner.isDemo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Demo profile</span>}
                </p>
                <p className="text-muted-foreground">{item.owner.area} · Member since {formatDate(item.owner.memberSince, { month: "long", year: "numeric" })}</p>
                <ReputationLine rep={reputationOf(item.ownerId, ownerRatings).asOwner} role="owner" className="mt-1" />
                {item.owner.bio && <p className="mt-1">{item.owner.bio}</p>}
                {ownerRatings.some((r) => r.role === "owner") && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What renters say about {item.owner.displayName}</p>
                    <RatingList ratings={ownerRatings} role="owner" />
                  </div>
                )}
              </div>
            </section>
          )}

          <PickupLocation item={item} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border bg-card p-4 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">{r.authorName}</span>
                      <span className="flex" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} aria-hidden="true" />
                        ))}
                      </span>
                      {r.isDemo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Demo review</span>}
                    </p>
                    <p className="mt-1">{r.comment}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-2 min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
          <BookingPanel itemId={item.id} ownerId={item.ownerId} dailyPriceSatang={item.dailyPriceSatang} item={item} blocked={blocked} today={today} />
          {upcoming.length > 0 && (
            <div className="mt-3 rounded-xl border bg-card p-4 text-sm">
              <p className="flex items-center gap-1.5 font-medium"><CalendarX2 className="size-4" aria-hidden="true" /> Already booked</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {upcoming.map((b) => <li key={b.startDate}>{formatDateRange(b.startDate, b.endDate)}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">More in {categoryName(item.category)}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-4">
            {related.map((r) => <ItemCard key={r.id} item={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingPanel({
  itemId, ownerId, dailyPriceSatang, item, blocked, today,
}: {
  itemId: string;
  ownerId: string;
  dailyPriceSatang: number;
  item: Parameters<typeof checkAvailability>[0];
  blocked: Parameters<typeof checkAvailability>[3];
  today: string;
}) {
  const { api, mode, viewer, viewerReady } = useData();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const dateError = start || end ? validateRentalDates(start, end, today) : null;
  const availability = start && end && !dateError ? checkAvailability(item, start, end, blocked) : null;
  const quote = start && end && !dateError ? quoteRental(dailyPriceSatang, start, end) : null;
  const isOwner = viewer?.id === ownerId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const problem = validateRentalDates(start, end, today);
    if (problem) return setError(problem);
    if (availability && !availability.available) return setError(availabilityMessage(availability));
    setSubmitting(true);
    setError("");
    try {
      await api.requestBooking({ itemId, startDate: start, endDate: end, message });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "Couldn't send your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent && quote) {
    return (
      <div className="rounded-2xl border bg-card p-5" role="status">
        <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
        <h2 className="mt-2 font-semibold">Request sent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateRange(start, end)} · {pluralDays(quote.days)} · {formatMoney(quote.totalSatang)}.
          The owner now accepts or declines. Nothing is reserved until they accept, and no payment has been taken.
          {mode === "demo" && " (Demo: this request is stored only in your browser.)"}
        </p>
        <Link href="/account/bookings" className={cn(buttonVariants(), "mt-4 h-10 w-full")}>View your requests</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm" noValidate>
      <p>
        <span className="text-2xl font-semibold">{formatMoney(dailyPriceSatang)}</span>
        <span className="text-muted-foreground"> / day</span>
      </p>
      <RentalCalendar item={item} blocked={blocked} today={today} start={start} end={end} onChange={(a, b) => { setStart(a); setEnd(b); setError(""); }} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Pickup</span>
          <input type="date" value={start} min={today} onChange={(e) => { setStart(e.target.value); setError(""); }}
            className="h-10 min-w-0 w-full rounded-lg border border-input bg-background px-2 text-sm" aria-invalid={Boolean(dateError)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Return</span>
          <input type="date" value={end} min={start || today} onChange={(e) => { setEnd(e.target.value); setError(""); }}
            className="h-10 min-w-0 w-full rounded-lg border border-input bg-background px-2 text-sm" aria-invalid={Boolean(dateError)} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Dates are inclusive. Collecting and returning on the same day counts as 1 day.</p>

      {dateError && start && end && <p role="alert" className="text-sm text-destructive">{dateError}</p>}
      {availability && (
        <p className={cn("text-sm font-medium", availability.available ? "text-primary" : "text-destructive")}>{availabilityMessage(availability)}</p>
      )}

      {quote && (
        <dl className="space-y-1.5 border-t pt-3 text-sm" aria-label="Price breakdown">
          <div className="flex justify-between">
            <dt>{formatMoney(quote.dailyPriceSatang)} × {pluralDays(quote.days)}</dt>
            <dd>{formatMoney(quote.totalSatang)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Service fee</dt>
            <dd>None</dd>
          </div>
          <div className="flex justify-between border-t pt-1.5 font-semibold">
            <dt>Total</dt>
            <dd data-testid="rental-total">{formatMoney(quote.totalSatang)}</dd>
          </div>
        </dl>
      )}

      {isOwner ? (
        <p className="rounded-lg bg-muted p-3 text-sm">This is your listing. <Link href={`/account/listings/${itemId}/edit`} className="font-medium text-primary underline">Edit it</Link>.</p>
      ) : viewerReady && !viewer ? (
        <Link href={`/login?next=/items/${itemId}`} className={cn(buttonVariants(), "h-10 w-full")}>Log in to request</Link>
      ) : (
        <>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Message to the owner <span className="font-normal text-muted-foreground">(optional)</span></span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3}
              placeholder="What will you use it for? When could you collect?" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={submitting || !viewerReady || !quote || !!dateError || !availability?.available}>
            {submitting ? "Sending request…" : "Request to rent"}
          </Button>
          <p className="text-xs text-muted-foreground">You won&apos;t be charged. The owner confirms the request; payment isn&apos;t handled in this prototype.</p>
        </>
      )}
    </form>
  );
}
