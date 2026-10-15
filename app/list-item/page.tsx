"use client";

import Link from "next/link";
import { useData } from "@/components/data-provider";
import { ListingForm } from "@/components/listing-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ListItemPage() {
  const { viewer, viewerReady } = useData();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">List an item</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Earn from things you don&apos;t use every day. You decide the price and who rents.</p>
      {!viewerReady ? (
        <div className="h-60 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : viewer ? (
        <ListingForm />
      ) : (
        <div className="rounded-xl border bg-card p-6">
          <p className="font-medium">Log in to list an item.</p>
          <Link href="/login?next=/list-item" className={cn(buttonVariants(), "mt-4 h-10 px-4")}>Log in</Link>
        </div>
      )}
    </div>
  );
}
