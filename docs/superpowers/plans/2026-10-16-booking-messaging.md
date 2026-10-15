# Booking Messaging Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a booking-centric messaging drawer allowing renters and owners to communicate directly from their bookings dashboard to coordinate equipment pickup, usage questions, and returns.

**Architecture:** Extend `lib/types.ts` with `ChatMessage`, define domain logic and validation in `lib/domain/messaging.ts` tested with Vitest, extend `DataApi` in `lib/data/api.ts` with `listMessages` and `sendMessage` (implemented in both `demo.ts` and `live.ts`), create the `BookingChatDrawer` component with quick prompt chips, and wire it into `app/account/bookings/page.tsx`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide icons, Vitest.

## Global Constraints

- Language & Copy: English UI only; zero unicode emojis (use Lucide SVG icons).
- Styling: Clean cream/light aesthetic matching Brollow (`bg-card`, `bg-muted`, `bg-primary text-white`).
- Codebase consistency: Follow existing patterns in `lib/data/` and `app/account/bookings/page.tsx`.
- Quality gates: `npm run typecheck` must pass with 0 errors, `npm test` must pass all tests.

---

### Task 1: Domain Models, Validation & Unit Tests

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/domain/messaging.ts`
- Test: `lib/domain/messaging.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ChatMessage {
    id: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    senderRole: "renter" | "owner";
    text: string;
    createdAt: string;
  }

  export function validateMessageText(text: string): { valid: boolean; error?: string; cleanText: string };
  export function formatMessageTimestamp(isoDate: string): string;
  export function groupMessagesByDate(messages: ChatMessage[]): { dateLabel: string; messages: ChatMessage[] }[];
  ```

- [ ] **Step 1: Write the failing unit tests in `lib/domain/messaging.test.ts`**
  - Test validation for empty/whitespace messages (invalid)
  - Test validation for messages > 1000 characters (invalid)
  - Test validation for standard valid messages (trims whitespace)
  - Test timestamp formatting (formats to clean readable time like `14:30`)
  - Test message grouping by calendar day

- [ ] **Step 2: Run Vitest to verify the tests fail**
  - Run: `npx vitest run lib/domain/messaging.test.ts`
  - Expected: Test fails due to missing file / exports.

- [ ] **Step 3: Add `ChatMessage` interface to `lib/types.ts` and implement `lib/domain/messaging.ts`**
  - Add `ChatMessage` in `lib/types.ts`
  - Implement `validateMessageText`, `formatMessageTimestamp`, `groupMessagesByDate` in `lib/domain/messaging.ts`

- [ ] **Step 4: Run Vitest to verify all tests pass**
  - Run: `npx vitest run lib/domain/messaging.test.ts`
  - Expected: 100% passing tests.

- [ ] **Step 5: Commit changes**
  - `git add lib/types.ts lib/domain/messaging.ts lib/domain/messaging.test.ts`
  - `git commit -m "feat(messaging): add domain models, validation, and unit tests"`

---

### Task 2: Data API Extension & Demo/Live Persistence

**Files:**
- Modify: `lib/data/api.ts`
- Modify: `lib/data/demo.ts`
- Modify: `lib/data/live.ts`

**Interfaces:**
- Consumes: `ChatMessage` from `lib/types.ts`
- Produces:
  ```ts
  DataApi.listMessages(bookingId: string): Promise<ChatMessage[]>;
  DataApi.sendMessage(bookingId: string, text: string): Promise<ChatMessage>;
  ```

- [ ] **Step 1: Update `DataApi` interface in `lib/data/api.ts`**
  - Add `listMessages(bookingId: string): Promise<ChatMessage[]>;`
  - Add `sendMessage(bookingId: string, text: string): Promise<ChatMessage>;`

- [ ] **Step 2: Implement `listMessages` and `sendMessage` in `lib/data/demo.ts`**
  - Maintain an in-memory/stateful map of messages keyed by `bookingId`
  - If a booking has a `booking.message` and no messages exist yet, automatically synthesize the initial message from the renter (`senderRole: "renter"`)
  - Implement `sendMessage`: validates message using `validateMessageText`, creates new `ChatMessage` with current viewer ID/name and role based on whether viewer is renter or owner, appends and returns it.

- [ ] **Step 3: Implement `listMessages` and `sendMessage` in `lib/data/live.ts`**
  - Query Supabase `messages` table if configured; if table not present or error occurs, fallback cleanly to in-session store so user is not blocked.

- [ ] **Step 4: Verify typecheck passes**
  - Run: `npm run typecheck`
  - Expected: Zero errors.

- [ ] **Step 5: Commit changes**
  - `git add lib/data/api.ts lib/data/demo.ts lib/data/live.ts`
  - `git commit -m "feat(messaging): implement listMessages and sendMessage in DataApi"`

---

### Task 3: `BookingChatDrawer` Component

**Files:**
- Create: `components/booking-chat-drawer.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface BookingChatDrawerProps {
    booking: BookingWithItem;
    currentViewerId: string;
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- Produces: Responsive slide-over drawer with item context header, message history with date separators, quick prompt chips, and message input.

- [ ] **Step 1: Create `components/booking-chat-drawer.tsx`**
  - Drawer container with slide-in animation, backdrop, and `Esc`/outside-click dismiss.
  - Header: Item thumbnail, item title, counterpart name & role (`Owner` or `Renter`), booking status badge, close button (`X`).
  - Scrollable message body:
    - Initial booking note displayed as opening message.
    - Message bubbles: Right-aligned (green `bg-primary text-white`) for viewer, left-aligned (`bg-muted`) for counterpart.
    - Timestamp displayed under each bubble.
    - Auto-scroll to bottom using `useRef` on load and when new message is sent.
  - Quick prompt chips:
    - `"Where is the pickup location?"`
    - `"What time works best for you?"`
    - `"Equipment is packed and ready for pickup."`
    - `"Arrived at the pickup location."`
  - Input footer:
    - Text input / textarea with auto-focus.
    - Submit on Enter (Shift+Enter for newline).
    - Send button with `Send` icon and loading state.

- [ ] **Step 2: Verify typecheck**
  - Run: `npm run typecheck`
  - Expected: Zero errors.

- [ ] **Step 3: Commit changes**
  - `git add components/booking-chat-drawer.tsx`
  - `git commit -m "feat(messaging): create BookingChatDrawer component"`

---

### Task 4: Integrate Chat Drawer into Bookings Dashboard

**Files:**
- Modify: `app/account/bookings/page.tsx`

**Interfaces:**
- Consumes: `BookingChatDrawer` from `@/components/booking-chat-drawer`
- Produces: Interactive "Chat" button on booking cards that opens the drawer.

- [ ] **Step 1: Add state and button in `app/account/bookings/page.tsx`**
  - Add state `activeChatBooking: BookingWithItem | null`
  - In `My Bookings` section: Add button `<MessageCircle className="size-4" /> Chat with Owner`
  - In `Incoming Requests` section: Add button `<MessageCircle className="size-4" /> Chat with Renter`
  - Render `<BookingChatDrawer />` at bottom of page when `activeChatBooking` is selected.

- [ ] **Step 2: Verify typecheck and run all tests**
  - Run: `npm run typecheck`
  - Run: `npm test`
  - Expected: All pass with 0 errors.

- [ ] **Step 3: Commit changes**
  - `git add app/account/bookings/page.tsx`
  - `git commit -m "feat(messaging): wire BookingChatDrawer into bookings page"`

---

### Task 5: End-to-End Verification & Sync

- [ ] **Step 1: Verify functionality in browser**
  - Open `/account/bookings` on running dev server
  - Click "Chat with Owner" on a booking
  - Verify initial booking note is visible
  - Click a quick prompt chip (e.g. "Where is the pickup location?")
  - Verify message sends and displays in green bubble on right
  - Verify timestamp is visible
  - Test typing a custom message and pressing Enter
  - Close drawer via X button and re-open to verify messages persist
- [ ] **Step 2: Run final verification commands**
  - Run `npm run typecheck`
  - Run `npm test`
- [ ] **Step 3: Push to GitHub remotes**
  - `git push origin feat/marketplace`
  - `git push origin feat/marketplace:Function/bright`
