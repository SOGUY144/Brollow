import { CalendarCheck, Handshake, Search } from "lucide-react";
import Link from "next/link";
import { WelcomeIntro } from "@/components/welcome-intro";
import { TypingHeading } from "@/components/typing-heading";
import { Suspense } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { HeroSearch } from "@/components/hero-search";
import { HomeListings } from "@/components/home-listings";
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
    <div className="mx-auto max-w-7xl space-y-7 px-4 pb-8 pt-5 sm:px-6">
      <section className="sharing-hero" aria-labelledby="hero-title">
        <div className="sharing-art" role="img" aria-label="Illustration of two neighbours sharing a camera, with tools, a projector and music equipment" />
        <div className="sharing-copy">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-primary">Less sitting around. More possibilities.</p>
          <TypingHeading />
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="#rental-search" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white">Find something to rent →</Link>
            <Link href="/list-item" className="rounded-full bg-[#e3edc8] px-6 py-3 text-sm font-medium text-primary">Start earning →</Link>
          </div>
          <WelcomeIntro />
        </div>
        <div id="rental-search" className="sharing-search scroll-mt-24">
          <Suspense fallback={<div className="h-32 rounded-2xl border bg-card" aria-hidden="true" />}>
            <DatedHeroSearch />
          </Suspense>
        </div>
      </section>

      <section id="categories" aria-labelledby="categories-title" className="scroll-mt-24 space-y-4">
        <h2 id="categories-title" className="text-xl font-semibold tracking-tight">What will you put to use?</h2>
        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/search?category=${c.slug}`}
                className="flex h-full flex-col items-center gap-3 rounded-2xl bg-[#eeeede] p-4 text-center transition hover:bg-brand-soft"
              >
                <CategoryIcon category={c.slug} className="size-6 text-primary" strokeWidth={1.75} />
                <span className="text-sm font-medium leading-tight">{c.name}</span>

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


    </div>
  );
}
