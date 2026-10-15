"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { useData } from "@/components/data-provider";

/** Unobtrusive badge so nobody mistakes demo data for real activity. */
export function ModeIndicator() {
  const { mode } = useData();
  if (mode !== "demo") return null;
  return (
    <Link
      href="/account#demo"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-100"
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      Demo mode
      <span className="sr-only">: data is fictional and stored only in this browser. Learn more.</span>
    </Link>
  );
}
