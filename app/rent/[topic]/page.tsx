import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ItemCard } from "@/components/item-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublicCatalog } from "@/lib/data/public-catalog";
import { EMPTY_FILTERS, filtersToParams, searchItems } from "@/lib/domain/search";
import { formatMoney } from "@/lib/format";
import { findTopic, RENT_TOPICS, type RentTopic } from "@/lib/rent-topics";
import { siteUrl } from "@/lib/site";
import type { ItemSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return RENT_TOPICS.map((t) => ({ topic: t.slug }));
}

function matchingItems(topic: RentTopic, catalog: ItemSummary[]): ItemSummary[] {
  return searchItems(catalog, { ...EMPTY_FILTERS, q: topic.query ?? "", category: topic.category ?? null, sort: "price_asc" }, []);
}

function searchHref(topic: RentTopic): string {
  return `/search?${filtersToParams({ ...EMPTY_FILTERS, q: topic.query ?? "", category: topic.category ?? null })}`;
}

export async function generateMetadata({ params }: PageProps<"/rent/[topic]">): Promise<Metadata> {
  const topic = findTopic((await params).topic);
  if (!topic) return {};
  const items = matchingItems(topic, await getPublicCatalog());
  const from = items.length ? ` from ${formatMoney(Math.min(...items.map((i) => i.dailyPriceSatang)))}/day` : "";
  return {
    title: `Rent ${topic.name.toLowerCase()} near you${from} | เช่า${topic.thai}`,
    description: `Rent ${topic.name.toLowerCase()} from people nearby instead of buying. เช่า${topic.thai}รายวัน ${items.length} listings, daily prices in baht, no booking fees.`,
    alternates: { canonical: `${siteUrl()}/rent/${topic.slug}` },
  };
}

export default function RentTopicPage({ params }: PageProps<"/rent/[topic]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-7xl animate-pulse px-4 py-8 sm:px-6" aria-hidden="true" />}>
      <TopicContent params={params} />
    </Suspense>
  );
}

async function TopicContent({ params }: { params: Promise<{ topic: string }> }) {
  const topic = findTopic((await params).topic);
  if (!topic) notFound();
  const items = matchingItems(topic, await getPublicCatalog());
  const cheapest = items.length ? Math.min(...items.map((i) => i.dailyPriceSatang)) : null;

  // Lets search engines show this page as a list of rentable products.
  const structured = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Rent ${topic.name}`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl()}/items/${item.id}`,
      name: item.title,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium text-primary">เช่า{topic.thai}</p>
        <h1 className="text-3xl font-semibold tracking-tight">Rent {topic.name.toLowerCase()} near you</h1>
        <p className="text-muted-foreground">
          {items.length
            ? <>Borrow {topic.name.toLowerCase()} from people nearby{cheapest !== null && <> from <strong className="text-foreground">{formatMoney(cheapest)} a day</strong></>}. Pick your dates, see the total up front, and send a request. The owner confirms, and there are no booking fees.</>
            : <>No {topic.name.toLowerCase()} are listed right now. Check back soon, or list your own.</>}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={searchHref(topic)} className={cn(buttonVariants(), "h-10 px-4")}>Check dates and availability</Link>
          <Link href="/list-item" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>Lend your {topic.name.toLowerCase()}</Link>
        </div>
      </header>

      {items.length > 0 && (
        <section aria-label={`${topic.name} for rent`}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      <section className="max-w-3xl space-y-3 text-sm">
        <h2 className="text-lg font-semibold">Renting {topic.name.toLowerCase()} on Brollow</h2>
        <dl className="space-y-3">
          <div>
            <dt className="font-medium">Is it cheaper to rent or buy?</dt>
            <dd className="text-muted-foreground">If you need it for a few days a year, renting usually costs far less than buying, and you skip storage and upkeep.</dd>
          </div>
          <div>
            <dt className="font-medium">How is the price worked out?</dt>
            <dd className="text-muted-foreground">Daily rate × number of days, counting both the pickup and return day. A same-day rental is one day.</dd>
          </div>
          <div>
            <dt className="font-medium">Can I trust the owner?</dt>
            <dd className="text-muted-foreground">Renters rate owners after every rental, including whether they were fair about deposits and damage. You can see each owner&apos;s rating before you book.</dd>
          </div>
        </dl>
      </section>

      <nav aria-label="Other things to rent" className="space-y-2">
        <h2 className="text-lg font-semibold">Other things to rent</h2>
        <ul className="flex flex-wrap gap-2">
          {RENT_TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
            <li key={t.slug}>
              <Link href={`/rent/${t.slug}`} className="inline-block rounded-full border bg-card px-3 py-1 text-sm hover:bg-muted">
                Rent {t.name.toLowerCase()} · เช่า{t.thai}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
