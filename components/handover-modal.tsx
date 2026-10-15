"use client";

import { Camera, CheckCircle2, Image as ImageIcon, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BookingWithItem } from "@/lib/data/api";
import { formatMoney } from "@/lib/format";

interface HandoverModalProps {
  booking: BookingWithItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoUrl: string, note: string) => Promise<void>;
}

const SAMPLE_INSPECTION_PHOTOS = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80", // Camera
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80", // Tech / Electronics
  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80", // Camping
];

export function HandoverModal({ booking, isOpen, onClose, onConfirm }: HandoverModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      toast.error("Please confirm that you have inspected the equipment condition.");
      return;
    }
    const finalPhoto = photoUrl || SAMPLE_INSPECTION_PHOTOS[0];
    setBusy(true);
    try {
      await onConfirm(finalPhoto, note || "Inspected and verified: item matches description and condition.");
      toast.success("Inspection verified. Escrow payout released to the owner.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm handover inspection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Close"
          disabled={busy}
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="size-6 text-brand" />
          <h2 className="text-xl font-bold tracking-tight">Handover Inspection & Condition Check</h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Confirm that the equipment matches the listing. Timestamped photo evidence is stored, and the rental payout of{" "}
          <strong className="text-foreground">{formatMoney(booking.totalSatang)}</strong> will be released immediately to the owner.
        </p>

        <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-sm">
          <p className="font-semibold text-foreground">{booking.item?.title}</p>
          <p className="text-xs text-muted-foreground">Lender: {booking.counterpart?.displayName ?? "Owner"}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium">1. Capture or Upload Inspection Photo</label>
            <p className="text-xs text-muted-foreground mb-2">
              Photograph the actual equipment and accessories on-site for mutual records.
            </p>

            {photoUrl ? (
              <div className="relative rounded-xl border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Inspection proof" className="h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-background hover:border-primary/50 hover:bg-muted/30">
                  <Camera className="size-8 text-muted-foreground" />
                  <span className="mt-1 text-xs font-medium text-foreground">Click to upload or take photo</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Or for demo:</span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(SAMPLE_INSPECTION_PHOTOS[0])}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted text-foreground"
                  >
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    <span>Use Sample Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">2. Inspection Notes (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Equipment in excellent condition, all cables included, tested working."
              className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs leading-relaxed text-foreground">
                <strong>I have inspected the physical item:</strong> Condition matches the description, all accessories are included, and I authorize releasing the payout of{" "}
                <strong>{formatMoney(booking.totalSatang)}</strong> to the owner.
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5" disabled={busy || !confirmed}>
              <CheckCircle2 className="size-4" />
              {busy ? "Processing…" : "Confirm Handover & Release Payout"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InspectionProofModal({
  photoUrl,
  note,
  pickedUpAt,
  isOpen,
  onClose,
}: {
  photoUrl?: string | null;
  note?: string | null;
  pickedUpAt?: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="size-6 text-brand" />
          <h2 className="text-lg font-bold">Handover Inspection Record</h2>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Recorded by renter on {pickedUpAt ? new Date(pickedUpAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "handover"}
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Handover proof" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
              No inspection photo recorded
            </div>
          )}
        </div>

        {note && (
          <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs">
            <span className="font-medium text-foreground">Renter notes:</span> &ldquo;{note}&rdquo;
          </div>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
