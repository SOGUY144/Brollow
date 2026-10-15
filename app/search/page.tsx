import type { Metadata } from "next";
import { Suspense } from "react";
import { GRID, ItemCardSkeleton } from "@/components/item-card";
import { SearchView } from "@/components/search-view";
import { requestToday } from "@/lib/server-today";

export const metadata: Metadata = { title: "Search" };

async function DatedSearch() {
  return <SearchView today={await requestToday()} />;
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className={GRID}>{Array.from({ length: 10 }, (_, i) => <ItemCardSkeleton key={i} />)}</div>
        </div>
      }
    >
      <DatedSearch />
    </Suspense>
  );
}
