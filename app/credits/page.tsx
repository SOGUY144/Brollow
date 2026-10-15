import type { Metadata } from "next";
import credits from "@/public/images/items/credits.json";

export const metadata: Metadata = { title: "Photo credits" };

type Credit = { title: string; creator: string; license: string; licenseUrl: string; source: string };

export default function CreditsPage() {
  const entries = Object.entries(credits as Record<string, Credit[]>).flatMap(([itemId, list]) =>
    list.map((c, i) => ({ key: `${itemId}-${i}`, itemId, ...c })),
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Photo credits</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Demo listing photos are openly licensed images found through Openverse. They illustrate the kind of item only;
        they are not photos of real listings. Items without a suitable photo use an illustrated placeholder.
      </p>
      <ul className="mt-6 divide-y rounded-xl border bg-card text-sm">
        {entries.map((c) => (
          <li key={c.key} className="p-3">
            <a href={c.source} className="font-medium text-primary hover:underline" rel="noopener noreferrer" target="_blank">{c.title || "Untitled"}</a>
            <span className="text-muted-foreground"> by {c.creator}, </span>
            <a href={c.licenseUrl} className="text-muted-foreground underline" rel="noopener noreferrer" target="_blank">{c.license}</a>
            <span className="text-muted-foreground"> · used for demo item {c.itemId}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
