# Design Specification: Booking-Centric Messaging Drawer

**Date:** 2026-10-16  
**Status:** Approved  
**Feature:** Booking-Centric Messaging Drawer (Handover & Return Coordination)

---

## 1. Overview & Objective

Facilitate smooth, timely, and organized communication between Renters and Owners throughout the peer-to-peer rental lifecycle (handover coordination, item usage questions, and return logistics). 

The messaging system is anchored directly to individual bookings (`Booking`), ensuring:
- Clear contextual communication (item name, dates, status, counterpart identity).
- Seamless continuation of the initial rental note (`booking.message`) submitted during checkout.
- Zero navigation disruption: users can chat directly via a slide-over drawer on `/account/bookings` without leaving their dashboard.

---

## 2. User Experience & Trigger Points

### Trigger Points:
- Located in each booking card within `/account/bookings`:
  - **My Bookings tab (Renter view):** Button `"Chat with Owner"` with `<MessageCircle className="size-4" />`.
  - **Incoming Requests tab (Owner view):** Button `"Chat with Renter"` with `<MessageCircle className="size-4" />`.
- Available across active, confirmed, in-escrow, picked-up, returned, and completed bookings.

### Drawer Interaction (`BookingChatDrawer`):
1. **Slide-over Sheet / Drawer:**
   - Opens smoothly from the right side of the screen on desktop, or as a full slide-up sheet on mobile devices.
   - Background overlay dims the dashboard slightly, with click-outside or `Esc` key to close.
2. **Drawer Header:**
   - Item thumbnail and item title with link to item detail.
   - Counterpart display name and role badge (`Owner` or `Renter`).
   - Current booking status badge (`Paid · In Escrow`, `Handover Verified`, etc.) and rental dates.
   - Close (`X`) button.
3. **Message Thread (Body):**
   - Automatically displays the renter's initial booking note as the opening conversation entry.
   - Chronological message bubbles:
     - **Outgoing (current user):** Right-aligned, primary brand background (`bg-primary text-white`), rounded corners.
     - **Incoming (counterpart):** Left-aligned, muted background (`bg-muted text-foreground`), rounded corners.
   - Timestamps formatted cleanly (e.g., `14:25` or `Oct 16, 14:25`).
   - Auto-scrolls to the newest message upon opening and whenever a new message is received.
4. **Quick Prompt Chips:**
   - One-click coordination chips positioned right above the input bar:
     - 📍 *"Where is the pickup location?"*
     - ⏰ *"What time works best for you?"*
     - 📦 *"Equipment is packed and ready for pickup."*
     - ✅ *"Arrived at the pickup location."*
   - Clicking a chip populates the input field or immediately sends the quick message.
5. **Input Bar (Footer):**
   - Clean textarea / input with placeholder `"Type a message..."`.
   - `Enter` sends the message; `Shift + Enter` inserts a newline.
   - Send button with `<Send className="size-4" />` icon, disabled when input is empty or sending is in progress.

---

## 3. Data Architecture & Types

### 3.1 Type Definition (`lib/types.ts`)
```ts
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: "renter" | "owner";
  text: string;
  createdAt: string; // ISO 8601 string
}
```

### 3.2 DataApi Extension (`lib/data/api.ts`)
```ts
export interface DataApi {
  // Existing methods ...

  listMessages(bookingId: string): Promise<ChatMessage[]>;
  sendMessage(bookingId: string, text: string): Promise<ChatMessage>;
}
```

### 3.3 Persistence Strategy:
- **Demo Mode (`lib/data/demo.ts`):**
  - In-memory map `Map<string, ChatMessage[]>` initialized with seed messages.
  - If a booking has `booking.message`, that note is automatically converted into the initial message sent by the renter.
  - New messages sent in demo mode append to the booking's thread so the user can immediately test back-and-forth interaction.
- **Live Mode (`lib/data/live.ts`):**
  - Uses Supabase `messages` table if present; falls back cleanly to in-session storage if the remote table migration is pending.

---

## 4. Domain Logic & Validation (`lib/domain/messaging.ts`)

Pure functions tested with Vitest:
- `validateMessageText(text: string): { valid: boolean; error?: string; cleanText: string }`:
  - Disallows empty or whitespace-only messages.
  - Trims leading/trailing whitespace.
  - Enforces max length (1000 characters).
- `formatMessageTimestamp(isoDate: string): string`:
  - Formats timestamp to human-friendly local time (e.g., `"14:30"` or `"Yesterday 14:30"`).
- `groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[]`:
  - Groups conversation bubbles by calendar day for clean date dividers in the chat UI.

---

## 5. Error Handling & Edge Cases

1. **Empty / Whitespace Messages:**
   - Send button remains disabled; pressing Enter on empty string does nothing.
2. **Viewer Missing / Not Logged In:**
   - Drawer prompts the user to log in before sending messages.
3. **Long Messages:**
   - Max 1000 characters with text wrapping (`break-words`) to prevent horizontal overflow.
4. **Offline / Network Delay:**
   - Optimistic message append in the UI while awaiting `sendMessage` resolution, with clear error indicator if the call fails.

---

## 6. Verification & Testing

1. **Unit Tests (`lib/domain/messaging.test.ts`):**
   - Validating empty, whitespace, overly long, and standard valid message strings.
   - Timestamp and date grouping logic.
2. **Type Checking:**
   - `npm run typecheck` passes with zero errors.
3. **Test Suite:**
   - `npm test` passes all tests across the repository.
4. **Manual Verification:**
   - Open `/account/bookings`, click "Chat with Owner" on a booking card, verify initial booking note is visible, send a new message, verify bubble appears on the right with correct timestamp and styling.
