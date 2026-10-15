"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useData } from "@/components/data-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/listings", label: "Your listings" },
  { href: "/account/favorites", label: "Saved" },
];

/** Account pages need a signed-in user (or the demo identity). */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { viewer, viewerReady } = useData();
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav aria-label="Account" className="-mx-1 mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={pathname === t.href ? "page" : undefined}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted aria-[current=page]:bg-foreground aria-[current=page]:text-background"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      {!viewerReady ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : !viewer ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="font-medium">Log in to see this page.</p>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={cn(buttonVariants(), "mt-4 h-10 px-4")}>Log in</Link>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
