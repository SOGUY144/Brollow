import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/search" className={cn(buttonVariants(), "mt-6 h-10 px-4")}>Explore items</Link>
    </div>
  );
}
