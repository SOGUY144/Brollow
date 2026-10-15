# Design Specification: Rental Receipt & Summary Modal

**Date:** 2026-10-16  
**Status:** Approved  
**Feature:** Rental Receipt & Summary Modal (Proof of Payment & Handover)

---

## 1. Overview & Objective

Provide both renters and owners with a clean, verifiable, and printable **Rental Agreement & Payment Receipt** modal accessible directly from their bookings dashboard (`/account/bookings`).

The receipt serves as official proof of:
- Secured payment into escrow
- Rental period, item specifications, and pricing calculation
- Handover condition proof (photo thumbnail and verification note from inspection)
- Counterpart identities and transaction timestamps

---

## 2. User Experience & Trigger Conditions

### Trigger Points:
- Located in `components/booking-row.tsx` under action buttons or booking summary.
- Available for both **Renter** and **Owner** when the booking is in any of the following post-payment statuses:
  - `escrow_held` (Payment secured, awaiting handover)
  - `picked_up` (Handover verified, rental ongoing)
  - `returned` (Equipment returned, awaiting completion)
  - `completed` (Rental finished)
- Button text: `"View Receipt"` with a clean `Receipt` / `FileText` icon.

### Modal Interaction:
- Clicking `"View Receipt"` opens `RentalReceiptModal` over the current page.
- Top right has a close button (`X`) and a prominent `"Print / Save PDF"` button with a printer icon (`Printer`).
- Clicking `"Print / Save PDF"` invokes `window.print()`.
- Responsive design: fits nicely on mobile screens and expands to a clean A4-ratio card on desktop.
- `@media print` CSS rules ensure that when printing, headers, navbars, modal overlays, and close buttons are hidden, leaving only the pristine receipt page ready for printer or saving as PDF.

---

## 3. Receipt Layout & Content

1. **Document Header:**
   - Brand logo / Title: **Brollow** · Peer-to-Peer Rental Network
   - Document Type: `RENTAL AGREEMENT & PAYMENT RECEIPT`
   - Receipt Number: `#BROL-BK-[First 8 chars of booking.id]`
   - Issued Date: Formatted current or payment date

2. **Escrow Status Stamp:**
   - Badge reflecting current status:
     - `ESCROW HELD`: "Payment Verified & Safely Held in Escrow"
     - `PICKED UP / ACTIVE`: "Handover Confirmed · Escrow Released"
     - `COMPLETED`: "Rental Successfully Completed"

3. **Rental Participants:**
   - **Renter:** Display name, User ID reference
   - **Owner:** Display name, Equipment location

4. **Equipment & Rental Period:**
   - Item Title, Category badge, Daily rate (`฿XX / day`)
   - Rental Dates: `[Start Date] – [End Date]` (`[X] days total`)

5. **Financial Breakdown:**
   - Daily Price Satang × Duration Days = **Total Satang (฿ THB)**
   - Payment Method: "Escrow Deposit via PromptPay / Card / Wallet"
   - Security Deposit / Guarantee Statement: "Protected by Brollow Community Trust"

6. **Handover Inspection Proof (if `picked_up`, `returned`, or `completed`):**
   - Timestamp of pickup (`pickedUpAt`)
   - Thumbnail of pickup inspection photo (`pickupPhotoUrl`)
   - Inspection notes (`pickupNote`: "Inspected and verified: item matches description and condition.")

7. **Footer Notes:**
   - Legal notice: "Generated electronically by Brollow. Retain for records."

---

## 4. Technical Architecture & Files

- **`components/rental-receipt-modal.tsx` (New):**
  - Standalone modal component taking `{ booking: BookingWithItem; isOpen: boolean; onClose: () => void; viewerId: string }`.
  - Implements Tailwind CSS print styles: `@media print { .no-print { display: none !important; } .print-area { ... } }`.
- **`components/booking-row.tsx` (Update):**
  - Add `"View Receipt"` button for eligible statuses (`escrow_held`, `picked_up`, `returned`, `completed`).
  - Wire state to open `RentalReceiptModal`.
- **`app/account/bookings/page.tsx` (Update):**
  - Pass receipt trigger or host the modal instance seamlessly.

---

## 5. Testing & Verification

1. **Unit & Type Testing:**
   - Ensure zero TypeScript compiler errors (`npm run typecheck`).
   - Run vitest test suite (`npm test`).
2. **Interactive UI Verification:**
   - Verify modal opens for `escrow_held`, `picked_up`, and `completed` bookings.
   - Verify modal is hidden for `pending` or `approved` bookings.
   - Verify all numbers, dates, and names render accurately.
   - Test `window.print()` rendering formatting.
