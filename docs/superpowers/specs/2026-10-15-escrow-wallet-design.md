# Design Document: Escrow Mockup Payment, Handover Inspection (English & No Emojis), and User Wallet System

**Date:** 2026-10-15  
**Project:** Brollow Equipment Rental Marketplace  
**Status:** Approved by User  

---

## 1. Overview & Goals
This feature delivers three interconnected subsystems for Brollow's rental workflow:
1. **Mockup Payment Modal:** A realistic checkout modal for renters to fund Brollow Escrow with payment methods (Mock PromptPay QR / Credit Card) and clear fund security messaging.
2. **English & Emoji-Free UI for Escrow & Handover:** Complete translation to English across all booking statuses, badges, action buttons, and inspection modals, replacing all unicode emojis with clean Lucide SVG icons.
3. **User Wallet & Payout System (Trading App Style):** A high-finish wallet card inspired by modern financial apps (Exness/MT5 style) displaying user balance in THB (฿), integrated Deposit and Withdraw mockup modals, transaction history, and automatic payout crediting when the renter confirms inspection.

---

## 2. Architecture & Data Flow

### 2.1 State Transitions & Automatic Payout
```
[Renter] Request Booking (pending)
    ↓
[Owner] Approve Request (approved)
    ↓
[Renter] Open Payment Modal → Pay into Escrow (escrow_held)
    ↓
[Both Meet]
    ↓
[Renter] Open Handover Inspection Modal → Submit Photo & Inspection Notes
    ↓ (picked_up)
[System] Timestamp & save inspection proof
         Auto-credit rental payout to Owner's Wallet Balance
         Record transaction in Owner's Wallet ('escrow_payout')
    ↓
[Either] Return Item (returned)
    ↓
[Owner] Complete Rental (completed)
```

---

## 3. Database & API Schema

### 3.1 Profiles Table Update
- `wallet_balance_satang`: `bigint not null default 0 check (wallet_balance_satang >= 0)`

### 3.2 Wallet Transactions Table
- `id`: `uuid primary key default gen_random_uuid()`
- `user_id`: `uuid not null references public.profiles(id) on delete cascade`
- `amount_satang`: `bigint not null` (positive for credits/payouts/deposits, negative for withdrawals)
- `type`: `text not null check (type in ('deposit', 'withdrawal', 'escrow_payout', 'rental_payment'))`
- `reference_id`: `uuid` (optional, e.g. booking id)
- `description`: `text not null`
- `created_at`: `timestamptz not null default now()`

### 3.3 Stored Procedures / RPC
- `deposit_wallet(p_amount_satang bigint)`: Increases user's wallet balance, creates a `deposit` transaction row.
- `withdraw_wallet(p_amount_satang bigint, p_destination text)`: Checks balance, deducts balance, creates a `withdrawal` transaction row.
- Updated `set_booking_status`: When `p_status = 'picked_up'`, automatically increments `owner_id`'s `wallet_balance_satang` by `v_booking.total_satang` and inserts an `escrow_payout` transaction.

### 3.4 Data Provider Interface (`lib/data/api.ts`)
```ts
export interface WalletTransaction {
  id: string;
  userId: string;
  amountSatang: number;
  type: "deposit" | "withdrawal" | "escrow_payout" | "rental_payment";
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface Wallet {
  balanceSatang: number;
  transactions: WalletTransaction[];
}

// In Api interface:
getWallet(): Promise<Wallet>;
depositWallet(amountSatang: number): Promise<void>;
withdrawWallet(amountSatang: number, destination: string): Promise<void>;
```

Both `live.ts` (Supabase Postgres) and `demo.ts` (localStorage fallback) implement these methods.

---

## 4. UI Components

### 4.1 Mockup Payment Modal (`components/payment-modal.tsx`)
- Displays item title, daily rate, rental date range, total days, and total amount.
- Payment method tabs/cards:
  - Mock PromptPay QR code with copyable reference.
  - Mock Credit / Debit Card form.
- Safety pledge callout with `<Lock className="size-4 text-emerald-600" />`:
  - "Escrow Protection: Your funds are held securely by Brollow. The owner will not receive the payout until you inspect and accept the equipment in person."
- Actions: "Cancel", "Confirm & Lock in Escrow (฿{total})".

### 4.2 English & Emoji-Free Handover Modal (`components/handover-modal.tsx`)
- Title: "Handover Inspection & Condition Verification"
- Subtitle: "Once you verify the item condition matches the listing, timestamped proof is saved and the rental payout of ฿{amount} will be released directly to the owner's wallet."
- Section 1: "1. Capture or Upload Inspection Photos"
  - Camera / Upload trigger, or "Use Sample Photo" button.
- Section 2: "2. Inspection Notes (Optional)"
  - Placeholder: "e.g., Equipment tested, serial numbers matched, like-new condition."
- Checkbox verification:
  - "I have inspected the physical equipment: It matches the listing description, all accessories are included, and I authorize releasing ฿{amount} to the owner's wallet."
- Buttons: "Cancel", "Confirm Condition & Release Payout" (clean Lucide SVG icons only, no emojis).

### 4.3 English Bookings Page (`app/account/bookings/page.tsx` & `components/booking-row.tsx`)
- All status tags in English: "Pending review", "Approved (Awaiting Escrow)", "Secured in Escrow", "Active (Payout Released)", "Returned (Pending Check)", "Completed", "Declined", "Cancelled".
- All buttons in English without emojis:
  - "Pay into Escrow"
  - "Inspect & Confirm Handover"
  - "Return Item"
  - "Confirm Return & Complete"
  - "Approve", "Decline", "Cancel"

### 4.4 Wallet Card & Page (`components/wallet-card.tsx` & `app/account/page.tsx`, `app/account/wallet/page.tsx`)
- Styling inspired by modern dark financial cards (Image 1):
  - Top header: User display name, Member ID (`#BROL-...`), status badges (`Standard Account`, `Verified`).
  - Balance display: Large bold **฿X,XXX.00 THB**.
  - Circular action buttons:
    - `Deposit` (Icon `<ArrowDownLeft />`) → opens Deposit modal.
    - `Withdraw` (Icon `<ArrowUpRight />`) → opens Withdraw modal.
- Deposit Modal:
  - Quick amount chips (+฿500, +฿1,000, +฿2,000) or custom amount input.
  - Payment mock method selection (PromptPay, Credit Card).
- Withdraw Modal:
  - Amount input (capped at available balance).
  - Destination bank selector (Kasikornbank, SCB, Bangkok Bank, PromptPay).
  - Account number input.
- Recent Transactions list:
  - Displays type icon, description, date, and colored amount (+฿... in green, -฿... in muted/neutral).
- Integrated directly into `/account` Overview and available as dedicated `/account/wallet` tab in `AccountShell`.

---

## 5. Verification Plan
1. **Unit & Domain Tests:** Run vitest (`npm test`) to verify existing 30 tests and add tests for wallet deposit/withdrawal calculation.
2. **TypeScript Compilation:** Run `npm run typecheck` to ensure zero typing errors.
3. **Database Migration:** Apply database changes to Supabase via SQL editor / client script.
4. **End-to-End User Flow Walkthrough:**
   - Sign in as Renter -> Request item.
   - Switch / check Owner -> Approve request.
   - Renter sees "Pay into Escrow" -> Opens `PaymentModal` -> Confirms payment -> Status changes to "Secured in Escrow".
   - Renter clicks "Inspect & Confirm Handover" -> Opens `HandoverModal` (English, no emojis) -> Submits photo & note.
   - Status updates to "Active (Payout Released)".
   - Check Owner's Wallet: Owner's wallet balance immediately has +฿{rental_amount} and transaction history reflects payout!
   - Owner tests "Withdraw": enters amount, selects bank, submits -> balance decreases.
