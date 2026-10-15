"use client";

import { ShieldCheck, Star } from "lucide-react";
import { useData } from "@/components/data-provider";
import { useLoad } from "@/components/use-catalog";
import { reputationOf, tagLabel, topTags } from "@/lib/domain/ratings";
import type { RatingRole, Reputation, RoleReputation, UserRating } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Loads public ratings for some people and works out their reputations. */
export function useReputations(userIds: string[]) {
  const { api } = useData();
  const key = [...new Set(userIds)].sort().join(",");
  return useLoad(async () => {
    const ids = key ? key.split(",") : [];
    const ratings = ids.length ? await api.listRatings({ rateeIds: ids }).catch(() => []) : [];
    const map = new Map<string, Reputation>(ids.map((id) => [id, reputationOf(id, ratings)]));
    return { ratings, reputations: map };
  }, [api, key]);
}

const ROLE_WORD: Record<RatingRole, string> = { owner: "as an owner", renter: "as a renter" };

/** Compact line such as "★ 4.8 as an owner · 12 ratings · Fair about deposits ×9". */
export function ReputationLine({ rep, role, className }: { rep: RoleReputation | undefined; role: RatingRole; className?: string }) {
  if (!rep || rep.count === 0) {
    return <p className={cn("text-xs text-muted-foreground", className)}>No ratings yet {ROLE_WORD[role]}</p>;
  }
  const tags = topTags(rep);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-0.5 font-medium text-foreground" aria-label={`Rated ${rep.average} out of 5 ${ROLE_WORD[role]}`}>
        <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> {rep.average?.toFixed(1)}
      </span>
      <span>{ROLE_WORD[role]} · {rep.count} {rep.count === 1 ? "rating" : "ratings"}</span>
      {tags.map(({ tag, count }) => (
        <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-brand-soft px-2 py-0.5 text-primary">
          <ShieldCheck className="size-3" aria-hidden="true" /> {tagLabel(role, tag)} ×{count}
        </span>
      ))}
    </p>
  );
}

export function Stars({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${score} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-3.5", i < score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} aria-hidden="true" />
      ))}
    </span>
  );
}

/** The latest written ratings about someone in one role. */
export function RatingList({ ratings, role, limit = 3 }: { ratings: UserRating[]; role: RatingRole; limit?: number }) {
  const list = ratings.filter((r) => r.role === role).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  if (list.length === 0) return null;
  return (
    <ul className="space-y-2">
      {list.map((r) => (
        <li key={r.id} className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{r.raterName}</span>
            <Stars score={r.score} />
            {r.isDemo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Demo rating</span>}
          </p>
          {r.tags.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{r.tags.map((t) => tagLabel(role, t)).join(" · ")}</p>}
          {r.comment && <p className="mt-1">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
