# Escrow Mockup Payment, English Handover, and User Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a mockup checkout for funding Escrow, translate handover inspection and bookings UI to English without emojis, and create an Exness/MT5-inspired dark wallet card with deposit, withdrawal, and automatic rental payout crediting.

**Architecture:** 
- Database: Add `wallet_balance_satang` to `profiles` and create `wallet_transactions` table in Supabase.
- Domain/API: Update `lib/types.ts`, `lib/data/api.ts`, `lib/data/live.ts`, and `lib/data/demo.ts` with wallet methods (`getWallet`, `depositWallet`, `withdrawWallet`). Auto-credit owner wallet upon inspection confirmation (`picked_up`).
- UI Components: Build `PaymentModal`, clean/translate `HandoverModal` and `BookingRow` to English (0 emojis), build `WalletCard` with deposit and withdrawal modals, and embed in `/account` and `/account/wallet`.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Supabase PostgreSQL, Vitest.

## Global Constraints
- Language: English only for all updated strings (no Thai in the modified components).
- Emojis: Zero unicode emojis (no 💸, 🔒, 📸, ✅, 💳, 🔄, 🎉). Use clean Lucide SVG icons instead.
- Currency: THB (฿) formatted with `formatMoney` or `฿X,XXX.00`.
- Testing: All domain tests in Vitest must continue to pass. `npm run typecheck` must have zero errors.

---

### Task 1: Wallet Types, Database Migration, and API Methods

**Files:**
- Create: `wallet-setup.sql`
- Create: `lib/domain/wallet.test.ts`
- Modify: `lib/types.ts`
- Modify: `lib/data/api.ts`
- Modify: `lib/data/live.ts`
- Modify: `lib/data/demo.ts`

**Interfaces:**
- Produces:
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
  // In Api:
  getWallet(): Promise<Wallet>;
  depositWallet(amountSatang: number): Promise<void>;
  withdrawWallet(amountSatang: number, destination: string): Promise<void>;
  ```

- [ ] **Step 1: Write unit tests for wallet validation** in `lib/domain/wallet.test.ts` (test deposit calculation, withdrawal checks, insufficient balance rejection).
- [ ] **Step 2: Run test to confirm it fails or passes** (`npm test`).
- [ ] **Step 3: Add Wallet types to `lib/types.ts`** and declare API methods in `lib/data/api.ts`.
- [ ] **Step 4: Implement in `lib/data/demo.ts`** (in-memory demo state with auto-payout on `picked_up`).
- [ ] **Step 5: Write `wallet-setup.sql`** with `profiles.wallet_balance_satang`, `wallet_transactions` table, `deposit_wallet`, `withdraw_wallet`, and updated `set_booking_status` to credit owner balance on `picked_up`.
- [ ] **Step 6: Implement in `lib/data/live.ts`** using Supabase client RPC and queries.
- [ ] **Step 7: Apply `wallet-setup.sql` to Supabase** via powershell / REST or SQL execution.

---

### Task 2: Mockup Payment Modal for Escrow Funding

**Files:**
- Create: `components/payment-modal.tsx`
- Modify: `app/account/bookings/page.tsx`

**Interfaces:**
- `PaymentModal` props:
  ```ts
  interface PaymentModalProps {
    booking: BookingWithItem;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
  }
  ```

- [ ] **Step 1: Create `components/payment-modal.tsx`** with:
  - Equipment summary (title, duration, daily price, total satang).
  - Payment method tabs (Mock PromptPay QR, Mock Credit/Debit Card).
  - Escrow Protection guarantee box with Lucide `Lock` icon and clear English copy.
  - Buttons: "Cancel" and "Confirm & Lock in Escrow".
  - Zero emojis, clean styling.
- [ ] **Step 2: Connect `PaymentModal` into `app/account/bookings/page.tsx`** so clicking "Pay into Escrow" triggers the modal.

---

### Task 3: English Translation and Emoji Removal across Handover & Bookings UI

**Files:**
- Modify: `components/handover-modal.tsx`
- Modify: `components/booking-row.tsx`
- Modify: `app/account/bookings/page.tsx`
- Modify: `lib/domain/bookings.ts`

- [ ] **Step 1: Update `components/handover-modal.tsx`**:
  - Replace all Thai strings with professional English.
  - Remove all emoji icons (e.g. 📸, 🔒, 💸, ✅).
  - Update `InspectionProofModal` to English and emoji-free.
- [ ] **Step 2: Update `components/booking-row.tsx`**:
  - All status styles, labels, and escrow callouts in English (e.g., "Secured in Escrow", "Payout released").
  - Replace emojis with clean Lucide icons.
- [ ] **Step 3: Update `app/account/bookings/page.tsx`**:
  - Status labels, action buttons, section headers, and toast messages in English (0 emojis).
  - Buttons: "Pay into Escrow", "Inspect & Confirm Handover", "Return Item", "Confirm Return & Complete", "Approve", "Decline", "Cancel".
- [ ] **Step 4: Verify Vitest tests** (`npm test`).

---

### Task 4: Dark Trading-App Style Wallet Card & Wallet Page

**Files:**
- Create: `components/wallet-card.tsx`
- Create: `app/account/wallet/page.tsx`
- Modify: `components/account-shell.tsx`
- Modify: `app/account/page.tsx`

- [ ] **Step 1: Create `components/wallet-card.tsx`**:
  - Dark container card matching Image 1 styling (`bg-slate-900 border-slate-800 text-white` or dark card styling).
  - User ID display (`#BROL-...`), badges (`Standard Account`, `Verified`).
  - Large bold balance in THB (`formatMoney(wallet.balanceSatang)`).
  - Action buttons: `Deposit` (circular icon with `ArrowDownLeft`) and `Withdraw` (circular icon with `ArrowUpRight`).
  - Deposit Modal: amount input, preset pills (+฿500, +฿1,000, +฿2,000), payment method selector, submit button.
  - Withdraw Modal: amount input (validated against balance), bank selector (Kasikorn, SCB, Bangkok Bank, PromptPay), account number input, submit button.
  - Recent transactions list: shows deposit, withdrawal, and escrow payouts with dates and amounts.
- [ ] **Step 2: Update `components/account-shell.tsx`** to add `Wallet` to `TABS`.
- [ ] **Step 3: Update `app/account/page.tsx`** to render `WalletCard` on Overview.
- [ ] **Step 4: Create `app/account/wallet/page.tsx`** for direct navigation.

---

### Task 5: Verification and End-to-End Walkthrough

- [ ] **Step 1: Run TypeScript check** (`npm run typecheck`).
- [ ] **Step 2: Run all tests** (`npm test`).
- [ ] **Step 3: Verify dev server compilation & fast refresh** on localhost:3000.
