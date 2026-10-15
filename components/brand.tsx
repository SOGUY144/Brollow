import Link from "next/link";

/** Original wordmark: two linked rings, "borrow" + "lend". */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="12" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="20" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="3.2" opacity="0.55" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-1.5 rounded-md text-primary" aria-label="Brollow home">
      <BrandMark />
      <span className="text-xl font-semibold tracking-tight text-foreground">Brollow</span>
    </Link>
  );
}
