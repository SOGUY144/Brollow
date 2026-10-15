"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GRID, ItemCard, ItemCardSkeleton } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCatalog } from "@/components/use-catalog";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { checkAvailability } from "@/lib/domain/availability";
import { EMPTY_FILTERS, filtersFromParams, filtersToParams, searchItems, type SearchFilters, type SortKey } from "@/lib/domain/search";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { CategorySlug } from "@/lib/types";

const input = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Best match",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Highest rated",
};

export function SearchView({ today }: { today: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const catalog = useCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Every applied change becomes a history entry, so back/forward and refresh restore it.
  const apply = (next: SearchFilters) => {
    const qs = filtersToParams(next).toString();
    router.push(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const results = catalog.status === "ready" ? searchItems(catalog.data.items, filters, catalog.data.blocked) : [];

  const chips: { label: string; clear: Partial<SearchFilters> }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, clear: { q: "" } });
  if (filters.category) chips.push({ label: categoryName(filters.category), clear: { category: null } });
  if (filters.location) chips.push({ label: `Near “${filters.location}”`, clear: { location: "" } });
  if (filters.minPriceSatang !== null) chips.push({ label: `From ${formatMoney(filters.minPriceSatang)}/day`, clear: { minPriceSatang: null } });
  if (filters.maxPriceSatang !== null) chips.push({ label: `Up to ${formatMoney(filters.maxPriceSatang)}/day`, clear: { maxPriceSatang: null } });
  if (filters.start && filters.end) chips.push({ label: formatDateRange(filters.start, filters.end), clear: { start: null, end: null } });

  const heading = filters.q ? `Results for “${filters.q}”` : filters.category ? categoryName(filters.category) : "All items";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {catalog.status === "ready" ? `${results.length} ${results.length === 1 ? "item" : "items"}` : catalog.status === "loading" ? "Loading items…" : ""}
            {filters.location && catalog.status === "ready" && " · location matches the listing's area text, not distance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger render={<Button variant="outline" className="h-10 lg:hidden" />}>
              <SlidersHorizontal /> Filters{chips.length ? ` (${chips.length})` : ""}
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] overflow-y-auto sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FilterForm key={params.toString()} filters={filters} today={today} onApply={(f) => { apply(f); setDrawerOpen(false); }} />
              </div>
            </SheetContent>
          </Sheet>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => apply({ ...filters, sort: e.target.value as SortKey })}
              className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
              aria-label="Sort results"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.label}>
              <button
                type="button"
                onClick={() => apply({ ...filters, ...chip.clear })}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm hover:bg-muted"
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label} <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => apply({ ...EMPTY_FILTERS, sort: filters.sort })} className="px-2 text-sm font-medium text-primary hover:underline">
              Clear all
            </button>
          </li>
        </ul>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <FilterForm key={params.toString()} filters={filters} today={today} onApply={apply} />
        </aside>
        <section aria-label="Results">
          {catalog.status === "loading" && (
            <div className={GRID.replace("xl:grid-cols-5", "xl:grid-cols-4")}>{Array.from({ length: 8 }, (_, i) => <ItemCardSkeleton key={i} />)}</div>
          )}
          {catalog.status === "error" && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
              <p className="font-medium">{catalog.message}</p>
              <Button variant="outline" className="mt-3" onClick={catalog.reload}>Try again</Button>
            </div>
          )}
          {catalog.status === "ready" && results.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-medium">No items match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer filters, other dates or a broader area.</p>
              <Button variant="outline" className="mt-4" onClick={() => apply(EMPTY_FILTERS)}>Clear all filters</Button>
            </div>
          )}
          {catalog.status === "ready" && results.length > 0 && (
            <div className={GRID.replace("xl:grid-cols-5", "xl:grid-cols-4")}>
              {results.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  availability={filters.start && filters.end ? checkAvailability(item, filters.start, filters.end, catalog.data.blocked) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterForm({ filters, today, onApply }: { filters: SearchFilters; today: string; onApply: (f: SearchFilters) => void }) {
  const [q, setQ] = useState(filters.q);
  const [location, setLocation] = useState(filters.location);
  const [min, setMin] = useState(filters.minPriceSatang === null ? "" : String(filters.minPriceSatang / 100));
  const [max, setMax] = useState(filters.maxPriceSatang === null ? "" : String(filters.maxPriceSatang / 100));
  const [start, setStart] = useState(filters.start ?? "");
  const [end, setEnd] = useState(filters.end ?? "");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const baht = (v: string) => {
      const s = v.trim().replace(/,/g, "");
      return s === "" ? null : /^\d{1,6}$/.test(s) ? Number(s) * 100 : NaN;
    };
    const minP = baht(min);
    const maxP = baht(max);
    if (Number.isNaN(minP) || Number.isNaN(maxP)) return setError("Prices must be whole baht.");
    if (minP !== null && maxP !== null && minP > maxP) return setError("Minimum price is higher than maximum.");
    if ((start && !end) || (!start && end)) return setError("Choose both dates, or leave both empty.");
    if (start && start < today) return setError("The start date can't be in the past.");
    if (start && end < start) return setError("The end date can't be before the start date.");
    onApply({ ...filters, q, location, minPriceSatang: minP, maxPriceSatang: maxP, start: start || null, end: end || null });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Keyword</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. tent" className={input} />
      </label>
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">Category</legend>
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip active={!filters.category} onClick={() => onApply({ ...filters, category: null })}>All</CategoryChip>
          {CATEGORIES.map((c) => (
            <CategoryChip key={c.slug} active={filters.category === c.slug} onClick={() => onApply({ ...filters, category: c.slug as CategorySlug })}>
              {c.name}
            </CategoryChip>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Location</span>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Leeds or Hackney" className={input} />
        <span className="block text-xs text-muted-foreground">Matches the area named in the listing.</span>
      </label>
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">Price per day (฿)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" aria-label="Minimum price per day in baht" className={input} />
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" aria-label="Maximum price per day in baht" className={input} />
        </div>
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">Available on</legend>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={start} min={today} onChange={(e) => setStart(e.target.value)} aria-label="Available from" className={input} />
          <input type="date" value={end} min={start || today} onChange={(e) => setEnd(e.target.value)} aria-label="Available until" className={input} />
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-10 w-full">Apply filters</Button>
    </form>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted aria-pressed:border-primary aria-pressed:bg-brand-soft aria-pressed:text-primary"
    >
      {children}
    </button>
  );
}
