"use client";

import { Heart } from "lucide-react";
import { useData } from "@/components/data-provider";
import { cn } from "@/lib/utils";

export function FavoriteButton({ itemId, title, className }: { itemId: string; title: string; className?: string }) {
  const { favorites, toggleFavorite } = useData();
  const saved = favorites.has(itemId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved items` : `Save ${title}`}
      onClick={(e) => {
        // Cards are links; saving must not navigate.
        e.preventDefault();
        e.stopPropagation();
        void toggleFavorite(itemId);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", saved && "fill-rose-500 text-rose-500")} aria-hidden="true" />
    </button>
  );
}
