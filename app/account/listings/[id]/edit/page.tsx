import { Suspense } from "react";
import { EditListingView } from "@/components/edit-listing";

export default function EditListingPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-60 max-w-5xl animate-pulse rounded-xl bg-muted" />}>
      <EditListingView />
    </Suspense>
  );
}
