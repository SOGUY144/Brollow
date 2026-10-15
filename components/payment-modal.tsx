"use client";

import { CreditCard, Lock, QrCode, ShieldCheck, Wallet as WalletIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ItemImage } from "@/components/item-image";
import { Button } from "@/components/ui/button";
import type { BookingWithItem } from "@/lib/data/api";
import { formatDateRange, formatMoney, pluralDays } from "@/lib/format";

interface PaymentModalProps {
  booking: BookingWithItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

type PaymentMethod = "promptpay" | "card" | "wallet";

export function PaymentModal({ booking, isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [busy, setBusy] = useState(false);
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  if (!isOpen) return null;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm();
      toast.success("Payment secured in Escrow. Funds are safely held.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl max-h-[92vh] overflow-y-auto">
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
          <h2 className="text-xl font-bold tracking-tight">Escrow Checkout</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposit rental funds into Brollow Escrow. The owner is not paid until you inspect and accept the equipment.
        </p>

        {/* Item & Pricing Summary */}
        <div className="mt-4 flex gap-3 rounded-xl border bg-muted/30 p-3.5">
          <div className="w-16 h-16 shrink-0 overflow-hidden rounded-lg">
            <ItemImage
              src={booking.item?.images[0]}
              alt={booking.item?.title ?? "Equipment"}
              category={booking.item?.category ?? "electronics"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 text-xs space-y-1">
            <p className="font-semibold text-sm text-foreground truncate">{booking.item?.title}</p>
            <p className="text-muted-foreground">
              {formatDateRange(booking.startDate, booking.endDate)} ({pluralDays(booking.days)})
            </p>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-muted-foreground">{formatMoney(booking.dailyPriceSatang)} / day</span>
              <span className="text-sm font-bold text-foreground">{formatMoney(booking.totalSatang)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Payment Method (Mockup)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod("promptpay")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                method === "promptpay"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <QrCode className="size-5" />
              <span>PromptPay</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                method === "card"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <CreditCard className="size-5" />
              <span>Credit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("wallet")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                method === "wallet"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <WalletIcon className="size-5" />
              <span>Wallet</span>
            </button>
          </div>

          {/* PromptPay View */}
          {method === "promptpay" && (
            <div className="rounded-xl border bg-muted/20 p-4 text-center space-y-2">
              <div className="mx-auto flex size-28 items-center justify-center rounded-lg border bg-white shadow-xs">
                {/* Clean QR code simulation */}
                <div className="grid grid-cols-5 gap-1 p-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-3 rounded-xs ${
                        i % 2 === 0 || i % 7 === 0 ? "bg-slate-900" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-medium text-foreground">Scan with any mobile banking app</p>
              <p className="text-[11px] text-muted-foreground">
                Amount: <strong className="text-foreground">{formatMoney(booking.totalSatang)}</strong> · Ref: BROL-{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Card View */}
          {method === "card" && (
            <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  placeholder="4242 •••• •••• 4242"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">Expires</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">CVC</label>
                  <input
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wallet View */}
          {method === "wallet" && (
            <div className="rounded-xl border bg-muted/20 p-4 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Source:</span>
                <span className="font-semibold text-foreground">Brollow Wallet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deduction:</span>
                <span className="font-semibold text-foreground">{formatMoney(booking.totalSatang)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Funds will be reserved from your balance and secured in Escrow.
              </p>
            </div>
          )}
        </div>

        {/* Protection Note */}
        <div className="mt-4 rounded-xl border border-primary/25 bg-brand-soft/50 p-3.5 text-xs text-foreground flex items-start gap-2.5 shadow-2xs">
          <Lock className="size-4 shrink-0 text-primary mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-primary">Escrow Protection:</strong> Your payment of {formatMoney(booking.totalSatang)} is safely held by Brollow. The owner receives payout only after you physically inspect the item at handover.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
            onClick={handlePay}
            disabled={busy}
          >
            <Lock className="size-4" />
            {busy ? "Processing…" : `Confirm & Hold ${formatMoney(booking.totalSatang)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
