import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Account pages are private and have nothing for search engines.
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/login", "/register"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
