"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { errorMessage, useData } from "@/components/data-provider";
import { ItemImage } from "@/components/item-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { categoryName } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MyListingsPage() {
  return (
    <AccountShell title="Your listings">
      <Listings />
    </AccountShell>
  );
}

function Listings() {
  const { api } = useData();
  const listings = useLoad(() => api.listMyListings(), [api]);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, paused: boolean) {
    setBusy(id);
    try {
      await api.setListingStatus(id, paused ? "active" : "paused");
      toast.success(paused ? "Listing is visible again" : "Listing paused and hidden from search");
      listings.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (listings.status === "loading") return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  if (listings.status === "error") return <p role="alert" className="text-sm text-destructive">{listings.message}</p>;

  return (
    <div className="space-y-4">
      <Link href="/list-item" className={cn(buttonVariants(), "h-10 px-4")}>List a new item</Link>
      {listings.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t listed anything yet.</p>
      ) : (
        <ul className="space-y-3">
          {listings.data.map((item) => {
            const paused = item.status === "paused";
            return (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <div className="w-full shrink-0 sm:w-28">
                  <Link href={`/items/${item.id}`} className="block overflow-hidden rounded-lg group">
                    <ItemImage src={item.images[0]} alt={item.title} category={item.category} className="rounded-lg transition-transform duration-200 group-hover:scale-105" />
                  </Link>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/items/${item.id}`} className="font-medium hover:text-primary hover:underline transition-colors">{item.title}</Link>
                    {paused && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Paused</span>}
                  </p>
                  <p className="text-muted-foreground">{categoryName(item.category)} · {formatMoney(item.dailyPriceSatang)}/day · {item.location}</p>
                </div>
                <div className="flex flex-wrap shrink-0 gap-2">
                  <Link href={`/items/${item.id}`} className={cn(buttonVariants({ variant: "outline" }), "h-9")}>View Listing</Link>
                  <Link href={`/account/listings/${item.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "h-9")}>Edit</Link>
                  <Button variant="outline" className="h-9" disabled={busy === item.id} onClick={() => void toggle(item.id, paused)}>
                    {paused ? "Unpause" : "Pause"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
