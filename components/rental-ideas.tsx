"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const IDEAS = [
  { name: "Movie night", text: "Try a projector and speakers. Check connections and the room size with the owner.", terms: ["projector", "speaker"] },
  { name: "Home refresh", text: "A drill or pressure washer can help with a one-off project. Ask about suitable surfaces and included accessories.", terms: ["drill", "washer"] },
  { name: "Make something", text: "Explore cameras and keyboards for your next creative idea.", terms: ["camera", "keyboard"] },
  { name: "Get together", text: "Look for speakers or party equipment. Confirm power requirements and pickup arrangements.", terms: ["speaker", "gazebo"] },
];

export function RentalIdeas() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  return <div className="rental-ideas">
    <button type="button" aria-expanded={open} aria-controls="rental-ideas" onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 rounded-full bg-[#e3edc8] px-4 py-2 text-sm font-medium text-primary"><Sparkles size={16} /> Help me choose</button>
    {open && <section id="rental-ideas" className="mt-3 rounded-2xl border bg-white p-4 text-left shadow-sm" aria-label="Rental ideas">
      <p className="text-sm font-medium">What are you planning?</p>
      <p className="mt-1 text-xs text-muted-foreground">Curated ideas, not an AI chat. Availability depends on listings and your dates.</p>
      <div className="my-3 flex flex-wrap gap-2">{IDEAS.map((idea, i) => <button key={idea.name} type="button" aria-pressed={i === selected} onClick={() => setSelected(i)} className="rounded-full border px-3 py-2 text-xs aria-pressed:bg-primary aria-pressed:text-white">{idea.name}</button>)}</div>
      <div aria-live="polite"><p className="text-sm text-muted-foreground">{IDEAS[selected].text}</p><div className="mt-3 flex flex-wrap gap-3">{IDEAS[selected].terms.map(term => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="text-sm font-medium text-primary underline">Find {term} →</Link>)}</div></div>
    </section>}
  </div>;
}
