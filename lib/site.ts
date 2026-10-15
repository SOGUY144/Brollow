/** Public base URL used for canonical links, the sitemap and structured data. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
