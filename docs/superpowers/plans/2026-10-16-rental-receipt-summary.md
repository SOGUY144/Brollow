# Rental Receipt & Summary Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a printable and verifiable Rental Agreement & Payment Receipt modal for renters and owners on their bookings page.

**Architecture:** A lightweight React component styled with Tailwind CSS and dedicated `@media print` rules that supports native `window.print()` / "Save as PDF", integrated seamlessly into the existing booking row component and bookings page.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide icons.

## Global Constraints
- Preserve English-only UI copy with zero unicode emojis.
- Match Brollow's existing light/cream aesthetic (`bg-card`, `text-foreground`, `border`, `text-primary`).
- Ensure `@media print` prints cleanly without header/footer or modal backdrops.
- Keep all existing tests passing (51/51 vitest tests) and zero TypeScript errors.

---

### Task 1: Create `RentalReceiptModal` Component

**Files:**
- Create: `components/rental-receipt-modal.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface RentalReceiptModalProps {
    booking: BookingWithItem;
    isOpen: boolean;
    onClose: () => void;
    viewerId: string;
  }
  export function RentalReceiptModal(props: RentalReceiptModalProps): React.JSX.Element | null;
  ```

- [ ] **Step 1: Write component structure with receipt branding, participant details, and pricing**
  - Brand header: Brollow logo, `RENTAL AGREEMENT & PAYMENT RECEIPT`, Ref number `#BROL-BK-[first 8 chars]`, Issue date.
  - Escrow status badge: `Escrow Held`, `Handover Verified`, or `Rental Completed`.
  - Item card: item image thumbnail, title, category, location, rental dates, duration in days.
  - Parties block: Renter name and Owner name.
  - Financial breakdown: Daily rate × Days = Total amount (`฿XX THB`).
  - Handover inspection section: if `booking.pickupPhotoUrl`, show thumbnail, inspection date, and `booking.pickupNote`.

- [ ] **Step 2: Add Print/PDF action and `@media print` styling**
  - Add Print button invoking `window.print()`.
  - Add close button and backdrop dismissal.
  - Include print styling to hide backdrop, buttons, and page chrome when printing.

---

### Task 2: Integrate Receipt Button into `BookingRow` & `Bookings` Page

**Files:**
- Modify: `components/booking-row.tsx`
- Modify: `app/account/bookings/page.tsx`

**Interfaces:**
- Consumes: `RentalReceiptModal` from `components/rental-receipt-modal.tsx`
- Eligible statuses: `["escrow_held", "picked_up", "returned", "completed"]`

- [ ] **Step 1: Add "View Receipt" trigger button in `BookingRow` or `Bookings` page**
  - Display `"View Receipt"` with a Lucide `FileText` / `Receipt` icon for paid bookings.
  - Ensure button appears for both Renter view and Owner view.

- [ ] **Step 2: Connect receipt modal state in `app/account/bookings/page.tsx`**
  - Maintain `receiptBooking` state.
  - Render `RentalReceiptModal` when `receiptBooking` is non-null.

---

### Task 3: Verification, Typecheck, and Git Sync

**Files:**
- All modified and new files.

- [ ] **Step 1: Run TypeScript check**
  - Run `npm run typecheck` and verify 0 errors.

- [ ] **Step 2: Run unit test suite**
  - Run `npm test` and verify 51/51 tests pass.

- [ ] **Step 3: Commit and Push**
  - Commit changes with semantic commit message.
  - Push to `origin/feat/marketplace` and `origin/Function/bright`.
