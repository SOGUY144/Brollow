"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { categoryName } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 4:3 product photo with a designed fallback when there is no photo or it
 * fails to load. Uses <img> because demo uploads are data URLs and live
 * uploads come from Supabase Storage.
 */
export function ItemImage({
  src,
  alt,
  category,
  className,
  eager = false,
}: {
  src: string | undefined;
  alt: string;
  category: CategorySlug;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden bg-muted", className)}>
      {showFallback ? (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-brand-soft text-primary" role="img" aria-label={`${alt} (no photo available)`}>
          <CategoryIcon category={category} className="size-10" strokeWidth={1.5} />
          <span className="text-xs font-medium text-primary/80">{categoryName(category)}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
