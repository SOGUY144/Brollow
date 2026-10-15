# Chat Notification Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an emerald pulsing notification dot and "New" badge to the Chat button on booking cards when unread messages from a counterpart exist, clearing when the user opens the chat drawer.

**Architecture:** Pure domain function `hasUnreadMessages` in `lib/domain/messaging.ts` tested with Vitest, read status helpers `getBookingLastRead` and `setBookingLastRead`, and UI badge rendering on booking cards with drawer read synchronization.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide icons, Vitest.

---

### Task 1: Domain Logic & Unit Tests

**Files:**
- Modify: `lib/domain/messaging.ts`
- Test: `lib/domain/messaging.test.ts`

- [ ] **Step 1: Write failing unit tests for `hasUnreadMessages` in `lib/domain/messaging.test.ts`**
  - Test returns false when no messages
  - Test returns false when only viewer sent messages
  - Test returns true when counterpart sent message and never read (lastReadIso is null)
  - Test returns false when lastReadIso is after counterpart message
  - Test returns true when counterpart sent message after lastReadIso

- [ ] **Step 2: Run Vitest to verify failure**
  - `npx vitest run lib/domain/messaging.test.ts`

- [ ] **Step 3: Implement `hasUnreadMessages`, `getBookingLastRead`, `setBookingLastRead` in `lib/domain/messaging.ts`**

- [ ] **Step 4: Run Vitest to verify tests pass**
  - `npx vitest run lib/domain/messaging.test.ts`

- [ ] **Step 5: Commit changes**
  - `git commit -m "feat(messaging): add unread detection and read tracking domain logic"`

---

### Task 2: UI Badge Integration & Read Sync

**Files:**
- Modify: `components/booking-chat-drawer.tsx`
- Modify: `app/account/bookings/page.tsx`

- [ ] **Step 1: In `components/booking-chat-drawer.tsx`, call `setBookingLastRead(booking.id)` upon opening or receiving new message while open, and trigger `onRead?: () => void` callback**
- [ ] **Step 2: In `app/account/bookings/page.tsx`, track unread status for each booking and render the emerald pulsing dot + `New` pill on the Chat button**
- [ ] **Step 3: Verify typecheck & unit tests**
  - `npm run typecheck`
  - `npm test`
- [ ] **Step 4: Commit changes**
  - `git commit -m "feat(messaging): add unread notification badge on booking cards"`

---

### Task 3: Verification & Git Push

- [ ] **Step 1: Verify on dev server (localhost:3000/account/bookings)**
- [ ] **Step 2: Push commits to `feat/marketplace`, `Function/bright`, and `main`**
