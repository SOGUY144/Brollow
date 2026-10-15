"use client";

import { ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage, useData } from "@/components/data-provider";
import { ItemImage } from "@/components/item-image";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";
import { MAX_PHOTOS, photoError, validateListing, type ListingErrors } from "@/lib/domain/listing";
import type { Item, ListingInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const input = "w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive";

function toInput(item?: Item): ListingInput {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    category: item?.category ?? "",
    dailyPrice: item ? (item.dailyPriceSatang / 100).toFixed(item.dailyPriceSatang % 100 ? 2 : 0) : "",
    location: item?.location ?? "",
    condition: item?.condition ?? "good",
    rules: item?.rules.join("\n") ?? "",
    availableFrom: item?.availableFrom ?? "",
    availableUntil: item?.availableUntil ?? "",
  };
}

export function ListingForm({ existing }: { existing?: Item }) {
  const { api, mode } = useData();
  const router = useRouter();
  const [values, setValues] = useState<ListingInput>(() => toInput(existing));
  const [keptImages, setKeptImages] = useState<string[]>(existing?.images ?? []);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<ListingErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "failed">("idle");
  const [failure, setFailure] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Release preview URLs when they're no longer shown.
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted: { file: File; url: string }[] = [];
    for (const file of Array.from(list)) {
      const problem = photoError(file);
      if (problem) {
        setErrors((e) => ({ ...e, photos: `${file.name}: ${problem}` }));
        continue;
      }
      if (keptImages.length + files.length + accepted.length >= MAX_PHOTOS) {
        setErrors((e) => ({ ...e, photos: `You can add up to ${MAX_PHOTOS} photos.` }));
        break;
      }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    if (accepted.length) {
      setFiles((f) => [...f, ...accepted]);
      setErrors((e) => ({ ...e, photos: undefined }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "saving") return;
    const result = validateListing(values, keptImages.length + files.length);
    if (!result.ok) {
      setErrors(result.errors);
      // Move focus to the first problem so keyboard and screen-reader users find it.
      const first = Object.keys(result.errors)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setStatus("saving");
    setFailure("");
    try {
      const saved = existing
        ? await api.updateListing(existing.id, result.value, keptImages, files.map((f) => f.file))
        : await api.createListing(result.value, files.map((f) => f.file));
      toast.success(existing ? "Listing updated" : "Your listing is live");
      router.push(`/items/${saved.id}`);
    } catch (err) {
      setStatus("failed");
      setFailure(errorMessage(err, "We couldn't save your listing. Please try again."));
    }
  }

  const fieldError = (key: keyof ListingErrors) =>
    errors[key] ? <p id={`error-${key}`} className="text-sm text-destructive">{errors[key]}</p> : null;
  const describedBy = (key: keyof ListingErrors) => (errors[key] ? `error-${key}` : undefined);

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {mode === "demo" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Demo mode: your listing and photos are stored only in this browser (photos are downscaled to save space).
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input id="field-title" value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={80}
          placeholder="e.g. Pop-up gazebo, 3 x 3 m" className={cn(input, "h-11")} aria-invalid={Boolean(errors.title)} aria-describedby={describedBy("title")} />
        {fieldError("title")}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Category</span>
          <select id="field-category" value={values.category} onChange={(e) => set("category", e.target.value as ListingInput["category"])}
            className={cn(input, "h-11")} aria-invalid={Boolean(errors.category)} aria-describedby={describedBy("category")}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          {fieldError("category")}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Condition</span>
          <select value={values.condition} onChange={(e) => set("condition", e.target.value as ListingInput["condition"])} className={cn(input, "h-11")}>
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Description</span>
        <textarea id="field-description" value={values.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={2000}
          placeholder="What's included, what it's good for, and anything a renter should know."
          className={cn(input, "py-2")} aria-invalid={Boolean(errors.description)} aria-describedby={describedBy("description")} />
        {fieldError("description")}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Daily price (฿)</span>
          <input id="field-dailyPrice" inputMode="decimal" value={values.dailyPrice} onChange={(e) => set("dailyPrice", e.target.value)}
            placeholder="450" className={cn(input, "h-11")} aria-invalid={Boolean(errors.dailyPrice)} aria-describedby={describedBy("dailyPrice")} />
          {fieldError("dailyPrice")}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Location</span>
          <input id="field-location" value={values.location} onChange={(e) => set("location", e.target.value)} maxLength={80}
            placeholder="e.g. Hackney, London" className={cn(input, "h-11")} aria-invalid={Boolean(errors.location)} aria-describedby={describedBy("location")} />
          {fieldError("location")}
        </label>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Availability <span className="font-normal text-muted-foreground">(optional; leave empty for any time)</span></legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Available from</span>
            <input id="field-availableFrom" type="date" value={values.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} className={cn(input, "h-11")} aria-invalid={Boolean(errors.availableFrom)} />
            {fieldError("availableFrom")}
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Available until</span>
            <input id="field-availableUntil" type="date" value={values.availableUntil} onChange={(e) => set("availableUntil", e.target.value)} className={cn(input, "h-11")} aria-invalid={Boolean(errors.availableUntil)} />
            {fieldError("availableUntil")}
          </label>
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Rental rules <span className="font-normal text-muted-foreground">(optional, one per line)</span></span>
        <textarea value={values.rules} onChange={(e) => set("rules", e.target.value)} rows={3} placeholder={"Return clean and dry\nNo use in the rain"} className={cn(input, "py-2")} />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Photos <span className="font-normal text-muted-foreground">(1–{MAX_PHOTOS}, JPG/PNG/WebP up to 5 MB each)</span></legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {keptImages.map((src) => (
            <Preview key={src} onRemove={() => setKeptImages((k) => k.filter((s) => s !== src))}>
              <ItemImage src={src} alt="Current photo" category={values.category || "electronics"} className="rounded-lg" />
            </Preview>
          ))}
          {files.map((f) => (
            <Preview key={f.url} onRemove={() => setFiles((list) => list.filter((x) => x.url !== f.url))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`New photo ${f.file.name}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
            </Preview>
          ))}
          {keptImages.length + files.length < MAX_PHOTOS && (
            <button id="field-photos" type="button" onClick={() => fileInput.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
              aria-describedby={describedBy("photos")}>
              <ImagePlus className="size-5" aria-hidden="true" /> Add photos
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} data-testid="photo-input" />
        {fieldError("photos")}
      </fieldset>

      {status === "failed" && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{failure}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-11 px-6" disabled={status === "saving"}>
          {status === "saving" ? (existing ? "Saving…" : "Publishing…") : existing ? "Save changes" : "Publish listing"}
        </Button>
        <Link href={existing ? "/account/listings" : "/"} className="inline-flex h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Preview({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove photo"
        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm hover:bg-background">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
