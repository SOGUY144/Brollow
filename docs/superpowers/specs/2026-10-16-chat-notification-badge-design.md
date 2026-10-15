# Design Specification: Chat Unread Notification Badge

**Date:** 2026-10-16  
**Status:** Approved  
**Feature:** Chat Unread Notification Badge (Emerald Pulse & New Indicator)

---

## 1. Overview & Objective

Provide instant visual feedback to users on `/account/bookings` when a counterpart (renter or owner) has sent a message that has not yet been viewed.

---

## 2. Requirements & Behavior

1. **Unread Indicator:**
   - When a booking has at least one message where `senderId !== currentViewerId` created after the user's `lastReadTimestamp` for that booking, display an emerald green pulsing notification dot on the Chat button, accompanied by a subtle `"New"` badge.
2. **Mark as Read:**
   - As soon as the user opens the `BookingChatDrawer` for that booking, update the `lastReadTimestamp` to `new Date().toISOString()`.
   - The notification badge clears immediately.
3. **Storage Strategy:**
   - Stored in browser `localStorage` under `brollow_read_${bookingId}`.
   - Compatible with both Demo and Live modes without requiring database schema changes or migrations.
4. **Initial Booking Note:**
   - If a booking has only the initial note submitted during checkout and the user has never opened the drawer, mark as unread if the viewer is the recipient (owner).

---

## 3. Architecture & Domain Functions

### 3.1 Domain Logic (`lib/domain/messaging.ts`)
```ts
export function hasUnreadMessages(
  messages: ChatMessage[],
  currentViewerId: string,
  lastReadIso: string | null
): boolean;
```
- Returns `true` if any message has `senderId !== currentViewerId` and `(!lastReadIso || new Date(m.createdAt) > new Date(lastReadIso))`.
- Returns `false` otherwise.

### 3.2 Read Tracker Utilities (`lib/domain/messaging.ts`)
```ts
export function getBookingLastRead(bookingId: string): string | null;
export function setBookingLastRead(bookingId: string, isoString?: string): void;
```

---

## 4. UI Design

On the `"Chat with Owner"` or `"Chat with Renter"` button:
```tsx
<Button ...>
  <div className="relative">
    <MessageCircle className="size-3.5 text-primary" />
    {hasUnread && (
      <span className="absolute -top-1 -right-1 flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
      </span>
    )}
  </div>
  <span>Chat with {counterpartRole}</span>
  {hasUnread && (
    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5 leading-none">
      New
    </span>
  )}
</Button>
```

---

## 5. Verification & Testing

1. Unit tests in `lib/domain/messaging.test.ts` for `hasUnreadMessages`.
2. `npm run typecheck` passes with zero errors.
3. `npm test` passes all tests.
