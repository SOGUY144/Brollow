"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { checkAvailability } from "@/lib/domain/availability";
import { validateRentalDates } from "@/lib/domain/dates";
import type { BlockedRange, Item } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RentalCalendar({ item, blocked, today, start, end, onChange }: {
  item: Pick<Item, "id" | "availableFrom" | "availableUntil" | "status">;
  blocked: BlockedRange[]; today: string; start: string; end: string;
  onChange: (start: string, end: string) => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  function move(offset: number) {
    setMonth(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + offset, 1)).toISOString().slice(0, 7));
  }
  const choosingEnd = !!start && !end;
  return <div className="rounded-xl border p-3" aria-label="Rental calendar">
    <div className="mb-2 flex items-center justify-between">
      <button type="button" aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => move(-1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-25"><ChevronLeft className="size-4" /></button>
      <p className="text-sm font-semibold" aria-live="polite">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
      <button type="button" aria-label="Next month" onClick={() => move(1)} className="rounded-lg p-2 hover:bg-muted"><ChevronRight className="size-4" /></button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span className="py-1 text-muted-foreground" key={d}>{d}</span>)}
      {Array.from({ length: first.getUTCDay() }, (_, i) => <span key={`blank-${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const date = `${month}-${String(i + 1).padStart(2, "0")}`;
        const rangeStart = choosingEnd && date >= start ? start : date;
        const unavailable = date < today || !!validateRentalDates(rangeStart, date, today) || !checkAvailability(item, rangeStart, date, blocked).available;
        const selected = date === start || date === end;
        return <button type="button" key={date} aria-label={`${date}${unavailable ? ", unavailable" : ""}`} aria-pressed={selected} disabled={unavailable}
          onClick={() => choosingEnd && date >= start ? onChange(start, date) : onChange(date, "")}
          className={cn("min-h-8 rounded-md hover:bg-brand-soft disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:line-through", start && end && date > start && date < end && "bg-brand-soft", selected && "bg-primary text-primary-foreground hover:bg-primary")}>{i + 1}</button>;
      })}
    </div>
    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
      <span aria-live="polite">{choosingEnd ? "Choose return date" : "Choose pickup date"} · up to 30 days</span>
      {start && <button type="button" onClick={() => onChange("", "")} className="font-medium text-primary underline">Reset</button>}
    </div>
  </div>;
}
