"use client";

import { CalendarDays, Heart, Package, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { errorMessage, useData } from "@/components/data-provider";
import { Button } from "@/components/ui/button";
import { useLoad } from "@/components/use-catalog";
import { RatingList, ReputationLine, useReputations } from "@/components/reputation";
import { WalletCard } from "@/components/wallet-card";

export default function AccountPage() {
  return (
    <AccountShell title="Your account">
      <Overview />
    </AccountShell>
  );
}

function Overview() {
  const { api, mode, viewer, favorites, refreshViewer } = useData();
  const [resetting, setResetting] = useState(false);
  const stats = useLoad(async () => {
    const [mine, incoming, listings] = await Promise.all([api.listMyBookings(), api.listIncomingRequests(), api.listMyListings()]);
    return {
      requests: mine.filter((b) => b.status !== "cancelled" && b.status !== "completed").length,
      incoming: incoming.filter((b) => b.status === "pending").length,
      listings: listings.length,
    };
  }, [api]);

  async function reset() {
    if (!window.confirm("Reset all demo data? Your demo listings, requests and saved items will be removed.")) return;
    setResetting(true);
    try {
      await api.resetDemo();
      await refreshViewer();
      stats.reload();
      toast.success("Demo data reset");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  async function signOut() {
    try {
      await api.signOut();
      await refreshViewer();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const s = stats.status === "ready" ? stats.data : null;
  const cards = [
    { href: "/account/bookings", icon: CalendarDays, label: "Your rentals", value: s?.requests, hint: "active requests and bookings" },
    { href: "/account/bookings#incoming", icon: CalendarDays, label: "Requests to you", value: s?.incoming, hint: "waiting for your answer" },
    { href: "/account/listings", icon: Package, label: "Your listings", value: s?.listings, hint: "items you lend" },
    { href: "/account/favorites", icon: Heart, label: "Saved items", value: favorites.size, hint: "items you saved" },
  ];

  return (
    <div className="space-y-8">
      {/* Wallet Card (Exness/MT5 style) */}
      <WalletCard showRecentTransactions={true} />

      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div>
          <p className="text-base font-semibold">{viewer!.displayName}</p>
          <p className="text-xs text-muted-foreground">{viewer!.email ?? "Demo account"}</p>
        </div>
        {mode === "live" && <Button variant="outline" size="sm" onClick={signOut}>Log out</Button>}
      </div>

      <YourReputation userId={viewer!.id} />

      {stats.status === "error" && <p role="alert" className="text-sm text-destructive">{stats.message}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="block rounded-xl border bg-card p-4 hover:border-primary/40">
              <c.icon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 text-2xl font-semibold">{c.value ?? "–"}</p>
              <p className="text-sm font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </Link>
          </li>
        ))}
      </ul>

      {mode === "demo" && (
        <section id="demo" className="scroll-mt-24 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
          <h2 className="font-semibold">About demo mode</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase isn&apos;t configured, so there is no real login. You act as the demo user, Alex Morgan.</li>
            <li>Other people, listings and reviews are fictional sample content.</li>
            <li>Your saved items, listings and rental requests are stored only in this browser.</li>
            <li>Requests and owner decisions are simulated. No money moves and no real reservation is made.</li>
          </ul>
          <Button variant="outline" className="mt-4 h-9 bg-white" onClick={reset} disabled={resetting}>
            <RotateCcw /> {resetting ? "Resetting…" : "Reset demo data"}
          </Button>
        </section>
      )}
    </div>
  );
}

function YourReputation({ userId }: { userId: string }) {
  const reps = useReputations([userId]);
  if (reps.status !== "ready") return null;
  const rep = reps.data.reputations.get(userId)!;
  return (
    <section aria-labelledby="rep-title" className="space-y-3 rounded-xl border bg-card p-5">
      <h2 id="rep-title" className="font-semibold">Your reputation</h2>
      <p className="text-sm text-muted-foreground">Renters rate you after borrowing your items, and owners rate you after you return theirs.</p>
      <div className="space-y-1">
        <ReputationLine rep={rep.asOwner} role="owner" />
        <ReputationLine rep={rep.asRenter} role="renter" />
      </div>
      <RatingList ratings={reps.data.ratings} role="owner" limit={2} />
      <RatingList ratings={reps.data.ratings} role="renter" limit={2} />
    </section>
  );
}
