"use client";

import { Heart, Menu, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { useData } from "@/components/data-provider";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/search", label: "Explore" },
  { href: "/#categories", label: "Categories" },
  { href: "/#how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const { viewer, viewerReady, mode } = useData();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const accountLabel = !viewerReady ? "Account" : viewer ? viewer.displayName.split(" ")[0] : "Log in";
  const accountHref = viewer ? "/account" : "/login";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Brand />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "md:hidden")} aria-label="Search items">
            <Search />
          </Link>
          <Link href="/list-item" className={cn(buttonVariants({ size: "lg" }), "hidden px-3 sm:inline-flex")}>
            <Plus /> List an item
          </Link>
          <Link href="/account/favorites" className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "hidden sm:inline-flex")} aria-label="Saved items">
            <Heart />
          </Link>
          <Link href={accountHref} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "hidden px-3 md:inline-flex")}>
            <User /> {accountLabel}
            {mode === "demo" && <span className="sr-only"> (demo account)</span>}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "md:hidden")} aria-label="Open menu">
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 pb-6" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
                {[...NAV, { href: "/list-item", label: "List an item" }, { href: accountHref, label: viewer ? "Account" : "Log in" }, { href: "/account/bookings", label: "Bookings" }, { href: "/account/favorites", label: "Saved items" }].map((link) => (
                  <Link key={link.href + link.label} href={link.href} className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted">
                    {link.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
                {CATEGORIES.map((c) => (
                  <Link key={c.slug} href={`/search?category=${c.slug}`} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                    {c.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
