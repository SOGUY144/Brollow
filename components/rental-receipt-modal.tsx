"use client";

import { CheckCircle2, FileText, Lock, Printer, ShieldCheck, X } from "lucide-react";
import type { BookingWithItem } from "@/lib/data/api";
import { formatDate, formatDateRange, formatMoney, pluralDays } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface RentalReceiptModalProps {
  booking: BookingWithItem;
  isOpen: boolean;
  onClose: () => void;
  viewerId: string;
}

export function RentalReceiptModal({ booking, isOpen, onClose, viewerId }: RentalReceiptModalProps) {
  if (!isOpen) return null;

  const isRenter = viewerId === booking.renterId;
  const isOwner = viewerId === booking.ownerId;
  const otherName = booking.counterpart?.displayName ?? (isRenter ? "Owner" : "Renter");
  const renterName = isRenter ? "You" : otherName;
  const ownerName = isOwner ? "You" : otherName;
  const refCode = `#BROL-BK-${booking.id.slice(0, 8).toUpperCase()}`;

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print Styles: isolates receipt card and hides background/buttons when printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #rental-receipt-document,
          #rental-receipt-document * {
            visibility: visible;
          }
          #rental-receipt-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl my-8 rounded-2xl border bg-card p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
          {/* Action Header (No-Print) */}
          <div className="no-print flex items-center justify-between pb-4 mb-4 border-b">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <FileText className="size-4" />
              <span>Rental Receipt & Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="gap-1.5 font-medium border-primary/30 text-primary hover:bg-brand-soft"
              >
                <Printer className="size-3.5" />
                Print / Save PDF
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Area */}
          <div id="rental-receipt-document" className="space-y-6 text-foreground bg-card">
            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
              <div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-foreground">Brollow</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Peer-to-Peer Rental Network · Bangkok, Thailand</p>
              </div>
              <div className="sm:text-right">
                <span className="inline-block rounded-md bg-muted px-2.5 py-1 text-xs font-mono font-semibold text-foreground">
                  {refCode}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Issued: {formatDate(booking.createdAt)}</p>
              </div>
            </div>

            {/* Document Title & Escrow Status */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Rental Agreement & Payment Receipt</h3>
                  <p className="text-xs text-muted-foreground">Proof of transaction, equipment rental, and escrow protection</p>
                </div>
                <div>
                  {booking.status === "escrow_held" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                      <Lock className="size-3" /> Paid · Secured in Escrow
                    </span>
                  )}
                  {booking.status === "picked_up" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="size-3.5" /> Handover Verified · Active
                    </span>
                  )}
                  {booking.status === "returned" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700">
                      <CheckCircle2 className="size-3.5" /> Equipment Returned
                    </span>
                  )}
                  {booking.status === "completed" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="size-3.5" /> Completed & Settled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Parties Involved */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border p-4 bg-card text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Renter (Client)</p>
                <p className="mt-1 font-medium text-foreground text-sm">{renterName}</p>
                <p className="text-muted-foreground">ID: #{booking.renterId.slice(0, 8)}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Owner (Lender)</p>
                <p className="mt-1 font-medium text-foreground text-sm">{ownerName}</p>
                <p className="text-muted-foreground">Location: {booking.item?.location ?? "Bangkok"}</p>
              </div>
            </div>

            {/* Equipment & Rental Schedule */}
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rental Equipment & Schedule
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{booking.item?.title ?? "Equipment"}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Category: {booking.item?.category ?? "General Equipment"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-foreground">{formatMoney(booking.dailyPriceSatang)}</p>
                    <p className="text-xs text-muted-foreground">per day</p>
                  </div>
                </div>

                <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Rental Duration: </span>
                    <span className="font-medium text-foreground">{formatDateRange(booking.startDate, booking.endDate)}</span>
                  </div>
                  <div className="font-semibold text-primary">
                    {pluralDays(booking.days)} total
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Summary
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">
                    Rental Fee ({formatMoney(booking.dailyPriceSatang)} × {pluralDays(booking.days)}):
                  </span>
                  <span className="font-medium text-foreground">{formatMoney(booking.totalSatang)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Brollow Escrow Protection Fee:</span>
                  <span className="font-medium text-emerald-700">฿0 (Included)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Security Guarantee:</span>
                  <span className="font-medium text-foreground">Verified</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center text-sm font-bold">
                  <span>Total Amount (THB):</span>
                  <span className="text-base text-primary font-bold">{formatMoney(booking.totalSatang)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Payment Method: Escrow Deposit via Mock PromptPay / Card / Wallet
                </p>
              </div>
            </div>

            {/* Handover Inspection Proof (if photo and notes exist) */}
            {booking.pickupPhotoUrl && (
              <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Verified Handover Inspection Proof</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={booking.pickupPhotoUrl}
                    alt="Handover inspection proof"
                    className="size-24 object-cover rounded-lg border bg-muted shadow-xs shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Inspection Note: </strong>
                      {booking.pickupNote || "Inspected and verified: item matches description and condition."}
                    </p>
                    {booking.pickedUpAt && (
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Handover Timestamp: </strong>
                        {formatDate(booking.pickedUpAt)}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200 mt-1">
                      <CheckCircle2 className="size-3" /> Condition Verified by Renter
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Trust Statement */}
            <div className="border-t pt-4 text-center space-y-1 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Brollow Peer-to-Peer Rental Network Guarantee</p>
              <p>This electronic document serves as confirmation of payment, rental agreement, and handover inspection.</p>
              <p className="font-mono text-[10px]">Document Ref: {booking.id}</p>
            </div>
          </div>

          {/* Bottom Actions (No-Print) */}
          <div className="no-print mt-6 pt-4 border-t flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 font-medium">
              <Printer className="size-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
