import type { MetadataRoute } from "next";
import { getPublicCatalog } from "@/lib/data/public-catalog";
import { RENT_TOPICS } from "@/lib/rent-topics";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const items = await getPublicCatalog();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, changeFrequency: "daily", priority: 0.8 },
    ...RENT_TOPICS.map((t) => ({ url: `${base}/rent/${t.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...items.map((i) => ({ url: `${base}/items/${i.id}`, lastModified: i.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
