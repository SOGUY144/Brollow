import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemDetailView } from "@/components/item-detail";
import { categoryName } from "@/lib/categories";
import { getPublicCatalog } from "@/lib/data/public-catalog";
import { formatMoney } from "@/lib/format";
import { requestToday } from "@/lib/server-today";
import { siteUrl } from "@/lib/site";
import type { ItemSummary } from "@/lib/types";

async function findPublicItem(id: string): Promise<ItemSummary | undefined> {
  return (await getPublicCatalog()).find((i) => i.id === id);
}

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const item = await findPublicItem(decodeURIComponent((await params).id));
  // Listings that only exist in a demo browser aren't public, so they get generic metadata.
  if (!item) return { title: "Item for rent" };
  const price = formatMoney(item.dailyPriceSatang);
  return {
    title: `Rent ${item.title} in ${item.location} — ${price}/day`,
    description: `${item.description.slice(0, 140)}${item.description.length > 140 ? "…" : ""} ${price} per day. ${categoryName(item.category)} for rent near ${item.location}.`,
    alternates: { canonical: `${siteUrl()}/items/${item.id}` },
    openGraph: { title: `Rent ${item.title} — ${price}/day`, images: item.images[0] ? [item.images[0]] : undefined },
  };
}

/** Product + daily-price offer, so search results can show the price. */
function StructuredData({ item }: { item: ItemSummary }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    category: categoryName(item.category),
    image: item.images.map((src) => (src.startsWith("/") ? `${siteUrl()}${src}` : src)),
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/items/${item.id}`,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: (item.dailyPriceSatang / 100).toFixed(2),
        priceCurrency: "THB",
        unitCode: "DAY",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "DAY" },
      },
      areaServed: item.location,
    },
    ...(item.rating !== null && item.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: item.rating, reviewCount: item.reviewCount } }
      : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, today] = await Promise.all([params, requestToday()]);
  const decoded = decodeURIComponent(id);
  const publicItem = await findPublicItem(decoded);
  return (
    <>
      {publicItem && <StructuredData item={publicItem} />}
      <ItemDetailView id={decoded} today={today} />
    </>
  );
}

export default function ItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="aspect-[4/3] max-w-3xl animate-pulse rounded-2xl bg-muted" /></div>}>
      <Resolved params={params} />
    </Suspense>
  );
}
