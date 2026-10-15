"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import { useData } from "@/components/data-provider";
import { ListingForm } from "@/components/listing-form";
import { useLoad } from "@/components/use-catalog";

export function EditListingView() {
  return (
    <AccountShell title="Edit listing">
      <Edit />
    </AccountShell>
  );
}

function Edit() {
  const { id } = useParams<{ id: string }>();
  const { api } = useData();
  // Only the owner's own listings are loaded, so other people's items can't be edited here.
  const listing = useLoad(async () => (await api.listMyListings()).find((i) => i.id === id) ?? null, [api, id]);
  if (listing.status === "loading") return <div className="h-60 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  if (listing.status === "error") return <p role="alert" className="text-sm text-destructive">{listing.message}</p>;
  if (!listing.data) {
    return (
      <p className="text-sm">
        This listing doesn&apos;t exist or isn&apos;t yours. <Link href="/account/listings" className="text-primary underline">Back to your listings</Link>
      </p>
    );
  }
  return <div className="max-w-2xl"><ListingForm existing={listing.data} /></div>;
}
