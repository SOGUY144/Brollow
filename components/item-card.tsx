"use client";

import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { ItemImage } from "@/components/item-image";
import { availabilityMessage, type AvailabilityResult } from "@/lib/domain/availability";
import { formatMoney } from "@/lib/format";
import type { ItemSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ItemCard({ item, availability }: { item: ItemSummary; availability?: AvailabilityResult }) {
  return (
    <article className="group relative">
      <Link href={`/items/${item.id}`} className="block rounded-xl focus-visible:outline-offset-4">
        <ItemImage src={item.images[0]} alt={item.title} category={item.category} className="rounded-xl transition group-hover:opacity-95" />
        <div className="mt-2 space-y-0.5">
          <h3 className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{item.location}</span>
          </p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-sm">
              <span className="font-semibold">{formatMoney(item.dailyPriceSatang)}</span>
              <span className="text-muted-foreground"> / day</span>
            </p>
            {item.rating !== null ? (
              <p className="flex items-center gap-0.5 text-xs text-muted-foreground" aria-label={`Rated ${item.rating} out of 5 from ${item.reviewCount} reviews`}>
                <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                {item.rating.toFixed(1)} ({item.reviewCount})
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No reviews yet</p>
            )}
          </div>
          {item.owner && (
            <p className="text-xs text-muted-foreground">
              Lent by {item.owner.displayName}
            </p>
          )}
          {availability && (
            <p className={cn("text-xs font-medium", availability.available ? "text-primary" : "text-destructive")}>
              {availabilityMessage(availability)}
            </p>
          )}
        </div>
      </Link>
      <FavoriteButton itemId={item.id} title={item.title} className="absolute right-2 top-2" />
    </article>
  );
}

export function ItemCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}

export const GRID = "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
