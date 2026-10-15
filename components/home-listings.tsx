"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useData } from "@/components/data-provider";
import { GRID, ItemCard, ItemCardSkeleton } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/components/use-catalog";
import { seedReviews } from "@/lib/data/seed";
import type { ItemSummary } from "@/lib/types";

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}

export function HomeListings() {
  const catalog = useCatalog();

  if (catalog.status === "error") {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">{catalog.message}</p>
        <Button variant="outline" className="mt-3" onClick={catalog.reload}>Try again</Button>
      </div>
    );
  }

  const items: ItemSummary[] = catalog.status === "ready" ? catalog.data.items.filter((i) => i.status === "active") : [];
  const recent = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10);
  const topRated = [...items].filter((i) => i.rating !== null).sort((a, b) => b.rating! - a.rating! || b.reviewCount - a.reviewCount).slice(0, 5);

  const grid = (list: ItemSummary[]) =>
    catalog.status === "loading" ? (
      <div className={GRID}>{Array.from({ length: 5 }, (_, i) => <ItemCardSkeleton key={i} />)}</div>
    ) : list.length ? (
      <div className={GRID}>{list.map((item) => <ItemCard key={item.id} item={item} />)}</div>
    ) : (
      <p className="text-sm text-muted-foreground">No items listed yet. <Link href="/list-item" className="text-primary underline">List the first one</Link>.</p>
    );

  return (
    <div className="space-y-7">
      <Section title="Recently active items" href="/search">{grid(recent)}</Section>
      <Section title="Highly rated items" href="/search?sort=rating">{grid(topRated)}</Section>
    </div>
  );
}

/** Example reviews, shown only in demo mode and labelled as fictional. */
export function DemoReviews() {
  const { mode } = useData();
  if (mode !== "demo") return null;
  const reviews = seedReviews().filter((r) => r.rating === 5).slice(0, 3);
  return (
    <section aria-labelledby="reviews-title" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="reviews-title" className="text-xl font-semibold tracking-tight">What renters say</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Demo content: fictional reviews</span>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-4">
            <p className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
              {Array.from({ length: r.rating }, (_, i) => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />)}
            </p>
            <p className="mt-2 text-sm">“{r.comment}”</p>
            <p className="mt-2 text-xs text-muted-foreground">{r.authorName}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
