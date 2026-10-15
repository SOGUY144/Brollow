import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { CATEGORIES } from "@/lib/categories";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 font-semibold text-primary">
            <BrandMark className="size-6" /> <span className="text-foreground">Brollow</span>
          </p>
          <p className="text-sm text-muted-foreground">Borrow instead of buying. A prototype marketplace for renting things from people nearby.</p>
        </div>
        <FooterList title="Categories" links={CATEGORIES.map((c) => ({ href: `/search?category=${c.slug}`, label: c.name }))} />
        <FooterList
          title="Renting"
          links={[
            { href: "/search", label: "Explore items" },
            { href: "/#how-it-works", label: "How it works" },
            { href: "/account/bookings", label: "Your bookings" },
            { href: "/account/favorites", label: "Saved items" },
          ]}
        />
        <FooterList
          title="Lending"
          links={[
            { href: "/list-item", label: "List an item" },
            { href: "/account/listings", label: "Your listings" },
            { href: "/account", label: "Account" },
            { href: "/credits", label: "Photo credits" },
          ]}
        />
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        Prototype. Payments, insurance and identity checks are not part of this version.
      </p>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <ul className="space-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-muted-foreground hover:text-foreground hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
