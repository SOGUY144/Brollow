import { Suspense } from "react";
import { ItemDetailView } from "@/components/item-detail";
import { requestToday } from "@/lib/server-today";

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, today] = await Promise.all([params, requestToday()]);
  return <ItemDetailView id={decodeURIComponent(id)} today={today} />;
}

export default function ItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="aspect-[4/3] max-w-3xl animate-pulse rounded-2xl bg-muted" /></div>}>
      <Resolved params={params} />
    </Suspense>
  );
}
