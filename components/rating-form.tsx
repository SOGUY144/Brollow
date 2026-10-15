"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage, useData } from "@/components/data-provider";
import { Button } from "@/components/ui/button";
import { TAGS, validateRating } from "@/lib/domain/ratings";
import { formatDate } from "@/lib/format";
import type { RatingRole, RatingTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROMPT: Record<RatingRole, string> = {
  owner: "How was the owner?",
  renter: "How was the renter?",
};

export function RatingForm({
  bookingId, role, name, deadline, onDone,
}: {
  bookingId: string;
  role: RatingRole;
  name: string;
  deadline: string;
  onDone: () => void;
}) {
  const { api } = useData();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<RatingTag[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" className="h-9" onClick={() => setOpen(true)}>
        <Star /> Rate {role === "owner" ? "owner" : "renter"}
      </Button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = validateRating(role, score, tags, comment.trim());
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await api.submitRating({ bookingId, score, tags, comment });
      toast.success(`Thanks for rating ${name}`);
      onDone();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your rating."));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3 rounded-xl border bg-background p-4 text-sm" noValidate>
      <fieldset>
        <legend className="font-medium">{PROMPT[role]} <span className="font-normal text-muted-foreground">({name})</span></legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Score">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => { setScore(n); setError(""); }}
              className="rounded-md p-1 hover:bg-muted"
            >
              <Star className={cn("size-6", n <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50")} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 font-medium">What went well? <span className="font-normal text-muted-foreground">(optional)</span></legend>
        <div className="flex flex-wrap gap-1.5">
          {TAGS[role].map(({ tag, label }) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => setTags((t) => (on ? t.filter((x) => x !== tag) : [...t, tag]))}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted aria-pressed:border-primary aria-pressed:bg-brand-soft aria-pressed:text-primary"
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="block space-y-1">
        <span className="font-medium">Comment <span className="font-normal text-muted-foreground">(optional, shown publicly)</span></span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="h-9" disabled={busy}>{busy ? "Saving…" : "Submit rating"}</Button>
        <Button type="button" variant="ghost" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
        <span className="text-xs text-muted-foreground">You can rate until {formatDate(deadline)}. Ratings can&apos;t be edited.</span>
      </div>
    </form>
  );
}
