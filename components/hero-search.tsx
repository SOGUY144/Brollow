"use client";

import { CalendarDays, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EMPTY_FILTERS, filtersToParams } from "@/lib/domain/search";

const field = "h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function HeroSearch({ today }: { today: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((start && !end) || (!start && end)) return setError("Choose both a start and end date, or leave both empty.");
    if (start && start < today) return setError("The start date can't be in the past.");
    if (start && end < start) return setError("The end date can't be before the start date.");
    const params = filtersToParams({ ...EMPTY_FILTERS, q, location, start: start || null, end: end || null });
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={submit} role="search" aria-label="Find items to rent" className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
        <label className="relative">
          <span className="sr-only">What do you want to rent?</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to rent?" className={field} />
        </label>
        <label className="relative">
          <span className="sr-only">Location</span>
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Town or area" className={field} />
        </label>
        <label className="relative">
          <span className="sr-only">From</span>
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="date" value={start} min={today} onChange={(e) => { setStart(e.target.value); setError(""); }} className={field} aria-label="From date" />
        </label>
        <label className="relative">
          <span className="sr-only">Until</span>
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="date" value={end} min={start || today} onChange={(e) => { setEnd(e.target.value); setError(""); }} className={field} aria-label="Until date" />
        </label>
        <Button type="submit" className="h-11 px-5 text-sm">
          <Search /> Search
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 px-1 text-sm text-destructive">{error}</p>}
    </form>
  );
}
