"use client";

import { CalendarDays, MapPin, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiKitModal } from "@/components/ai-kit-modal";
import { LocateButton } from "@/components/location-context";
import { useCatalog } from "@/components/use-catalog";
import { validateRentalDates } from "@/lib/domain/dates";
import { Button } from "@/components/ui/button";
import { EMPTY_FILTERS, filtersToParams } from "@/lib/domain/search";

const field = "h-11 min-w-0 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function HeroSearch({ today }: { today: string }) {
  const router = useRouter();
  const catalog = useCatalog();
  const areas = catalog.status === "ready" ? [...new Set(catalog.data.items.map(i => i.location))].sort() : [];
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((start && !end) || (!start && end)) return setError("Choose both a start and end date, or leave both empty.");
    if (start && start < today) return setError("The start date can't be in the past.");
    if (start && end < start) return setError("The end date can't be before the start date.");
    const dateProblem = start && end ? validateRentalDates(start, end, today) : null;
    if (dateProblem) return setError(dateProblem);
    const params = filtersToParams({ ...EMPTY_FILTERS, q, location, start: start || null, end: end || null });
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <>
      <form onSubmit={submit} role="search" aria-label="Find items to rent" className="rounded-2xl border bg-card p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
          <label className="relative col-span-2 min-w-0 md:col-span-1">
            <span className="mb-1 block text-xs font-medium">What do you want to rent?</span>
            <Search className="pointer-events-none absolute left-3 bottom-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What do you want to rent?"
              className={`${field} pr-24`}
            />
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#e3edc8] text-[#124e3b] font-semibold text-xs border border-[#d4dec0] hover:bg-[#d9e5be] active:scale-98 transition shadow-xs cursor-pointer"
              title="Ask AI to bundle equipment"
            >
              <Sparkles className="size-3.5 text-[#124e3b]" />
              <span>Ask AI</span>
            </button>
          </label>
          <label className="relative col-span-2 min-w-0 md:col-span-1">
            <span className="mb-1 block text-xs font-medium">Pickup area</span>
            <MapPin className="pointer-events-none absolute left-3 bottom-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input list="pickup-areas" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Town or area" className={field} />
          </label>
          <label className="relative min-w-0">
            <span className="mb-1 block text-xs font-medium">Pickup date</span>
            <CalendarDays className="pointer-events-none absolute left-3 bottom-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input type="date" value={start} min={today} onChange={(e) => { setStart(e.target.value); setError(""); }} className={field} aria-label="From date" />
          </label>
          <label className="relative min-w-0">
            <span className="mb-1 block text-xs font-medium">Return date</span>
            <CalendarDays className="pointer-events-none absolute left-3 bottom-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input type="date" value={end} min={start || today} onChange={(e) => { setEnd(e.target.value); setError(""); }} className={field} aria-label="Until date" />
          </label>
          <Button type="submit" className="col-span-2 h-11 self-end px-5 md:col-span-1 text-sm">
            <Search /> Search
          </Button>
        </div>
        <datalist id="pickup-areas">{areas.map(area => <option key={area} value={area} />)}</datalist>
        <LocateButton />
        {error && <p role="alert" className="mt-2 px-1 text-sm text-destructive">{error}</p>}
      </form>

      <AiKitModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialPrompt={q}
        catalog={catalog.status === "ready" ? catalog.data.items : []}
      />
    </>
  );
}
