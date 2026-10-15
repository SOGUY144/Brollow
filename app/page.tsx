import { CalendarCheck, Handshake, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { HeroSearch } from "@/components/hero-search";
import { DemoReviews, HomeListings } from "@/components/home-listings";
import { CATEGORIES } from "@/lib/categories";
import { requestToday } from "@/lib/server-today";

async function DatedHeroSearch() {
  return <HeroSearch today={await requestToday()} />;
}

const STEPS = [
  { icon: Search, title: "Find it nearby", text: "Search by item, area and dates. Only items free on your dates are shown when you pick dates." },
  { icon: CalendarCheck, title: "Send a request", text: "See the daily rate and total before you send. The owner accepts or declines; nothing is reserved until they accept." },
  { icon: Handshake, title: "Collect and return", text: "Arrange pickup with the owner, use it, and bring it back as agreed." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Borrow instead of buying</h1>
          <p className="text-lg text-muted-foreground">Find what you need, near you, whenever you need it.</p>
        </div>
        <Suspense fallback={<div className="h-[68px] rounded-2xl border bg-card" aria-hidden="true" />}>
          <DatedHeroSearch />
        </Suspense>
      </section>

      <section id="categories" aria-labelledby="categories-title" className="scroll-mt-24 space-y-4">
        <h2 id="categories-title" className="text-xl font-semibold tracking-tight">Popular categories</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/search?category=${c.slug}`}
                className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:bg-brand-soft/40"
              >
                <CategoryIcon category={c.slug} className="size-6 text-primary" strokeWidth={1.75} />
                <span className="text-sm font-medium leading-tight">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HomeListings />

      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 space-y-4">
        <h2 id="how-title" className="text-xl font-semibold tracking-tight">How renting works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border bg-card p-5">
              <step.icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-medium">{i + 1}. {step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">
          This prototype doesn&apos;t take payments or provide insurance. Agree payment and any deposit directly with the owner.
        </p>
      </section>

      <DemoReviews />
    </div>
  );
}
