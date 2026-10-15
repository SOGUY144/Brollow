"use client";

import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { useData } from "@/components/data-provider";
import { ItemCard } from "@/components/item-card";
import { useCatalog } from "@/components/use-catalog";

export default function FavoritesPage() {
  return (
    <AccountShell title="Saved items">
      <Favorites />
    </AccountShell>
  );
}

function Favorites() {
  const { favorites } = useData();
  const catalog = useCatalog();
  if (catalog.status === "loading") return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  if (catalog.status === "error") return <p role="alert" className="text-sm text-destructive">{catalog.message}</p>;
  const saved = catalog.data.items.filter((i) => favorites.has(i.id));
  if (saved.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing saved yet. Tap the heart on any item to keep it here. <Link href="/search" className="text-primary underline">Explore items</Link>.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
      {saved.map((item) => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}
