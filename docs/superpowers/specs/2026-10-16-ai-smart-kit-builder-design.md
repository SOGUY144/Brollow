# Design Specification: Brollow AI Smart Kit Builder & "Ask AI" Search

**Date:** 2026-10-16  
**Status:** Approved by User  
**Target Branches:** `feat/marketplace`, `Function/bright`, `main`  
**Related Documents:** `docs/superpowers/plans/2026-10-16-ai-smart-kit-builder.md`

---

## 1. Executive Summary & Goals

The **Brollow AI Smart Kit Builder** transforms the rental discovery experience from manual, fragmented item searching into task-oriented bundling. Instead of requiring users to know exact equipment specs and search each item individually (e.g. finding a camera, then searching for a compatible wireless mic, then a tripod), users can state their high-level goal in natural language (Thai or English):

> *"Shooting a 2-person podcast interview, budget ฿1,200/day"*  
> *"จัดงานสัมมนา 30 คน ฉายสไลด์ งบ 1,500 บาท"*  
> *"ถ่าย Vlog กลางแจ้งคนเดียว งบ 800"*

The AI engine analyzes the project requirements, extracts budget constraints, and bundles 2–4 complementary items available from Brollow's verified inventory (30 items in database), presenting a complete **"Smart Kit"** with transparent pricing, budget alignment, and synergy explanations.

---

## 2. User Experience & Entry Points

### 2.1 Hero Search Integration (`components/hero-search.tsx`)
- Inside the main homepage search box (`What do you want to rent?`), an **`✨ Ask AI`** capsule button is embedded on the right side of the input field.
- **Visual Design:**
  - Background: Soft lime/matcha `#e3edc8` (matching `.wi-search-ai` from Welcome Intro).
  - Text & Icon: Deep forest green `#124e3b`, font-weight `600`, text size `14px`.
  - Icon: Lucide `Sparkles` (`size={14}`).
  - Hover & Focus: Subtle scale/brightness transition.
- Clicking the button (or pressing Enter with natural language prompt) opens the **Brollow AI Smart Kit Assistant Modal**.

### 2.2 AI Assistant Modal Component (`components/ai-kit-modal.tsx`)
- **Overlay & Container:** Responsive centered modal dialog with backdrop blur and accessible close controls (`Esc` key, click outside, `X` button).
- **Header:**
  - Sparkles icon in emerald gradient badge.
  - Title: `Brollow AI · Smart Kit Builder`.
  - Subtitle: *"Describe your event or project. AI will curate and bundle the right equipment within your budget."*
- **Natural Language Input:**
  - Multi-line textarea or large input with clear action button (`Generate Kit`).
  - Placeholder: *"e.g. Shooting a 2-person indoor interview, budget ฿1,200 / day"*
- **Quick Inspiration Chips (One-Click Demos):**
  1. 🎬 **Solo Outdoor Vlog** (Budget: ฿800)
  2. 🎙️ **2-Person Podcast Recording** (Budget: ฿1,200)
  3. 📽️ **Workshop Seminar & Slides** (Budget: ฿1,500)
  4. 📸 **Graduation Portrait Photoshoot** (Budget: ฿900)
  5. 🏕️ **Weekend Camping & Movie Night** (Budget: ฿1,000)
- **Kit Output Presentation:**
  - **Kit Header:** Name of the generated kit (e.g., *"Pro Creator Studio Kit"*), total daily rental fee (`฿XX / day`), and budget badge (`Within your ฿1,200 budget` or `Cost-optimized recommendation`).
  - **Synergy Rationale:** 2–3 concise bullet points explaining why these specific items were chosen together.
  - **Bundled Item Cards:**
    - Item thumbnail image.
    - Title and category badge.
    - Individual daily rental rate (`฿XX / day`).
    - Quick link to view item details.
  - **Action Controls:**
    - `View Items`: Opens catalog or navigates to search filter for the bundled items.
    - `Try Another Prompt`: Clears and resets input for another query.

---

## 3. Domain Logic & Matching Architecture (`lib/domain/ai-kit.ts`)

### 3.1 Data Structures
```ts
export interface SmartKitResult {
  kitName: string;
  description: string;
  targetBudgetSatang: number | null;
  totalDailyPriceSatang: number;
  withinBudget: boolean;
  items: ItemSummary[];
  reasons: string[];
}
```

### 3.2 Matching Algorithm
1. **Budget Extraction:**
   - Detects Thai/English budget indicators via regex:
     - `งบ\s*([0-9,]+)` (e.g. `งบ 1,200`, `งบ1000`)
     - `budget\s*[:=]?\s*฿?\s*([0-9,]+)` (e.g. `budget 800`, `budget: 1500`)
     - `([0-9,]+)\s*(?:baht|บาท)`
   - Converts extracted amount into satang (`amount * 100`).
2. **Intent Classification & Tag Synergies:**
   - **Vlog / Content Creation:** Camera/Action Cam + Wireless Mic + Tripod/Gimbal.
   - **Podcast / Interview:** Microphone + Headphones + Boom Arm/Audio Interface.
   - **Seminar / Presentation:** Projector + Projector Screen + Portable Speaker.
   - **Photography / Portrait:** Mirrorless/DSLR Camera + Prime Lens + Reflector/Flash.
   - **Camping / Outdoor Event:** Tent/Camping gear + Portable Power/Outdoor Light + Speaker.
3. **Budget Optimization:**
   - Filters candidate items by synergy scores.
   - If a target budget is specified, selects the combination of items that delivers complete functional utility while remaining $\le$ the budget.
4. **Rationale Generation:**
   - Automatically provides clear, human-readable explanations in English explaining why the bundle covers audio, visual, and operational needs.

---

## 4. Testing & Verification

1. **Unit Tests (`lib/domain/ai-kit.test.ts`):**
   - Thai & English budget extraction from diverse text phrases.
   - Correct equipment pairing for vlog, podcast, seminar, and portrait tasks.
   - Handling of edge cases: empty catalog, zero budget, unrecognized queries (graceful fallback).
   - Correct calculation of `totalDailyPriceSatang` and `withinBudget` flags.
2. **Integration & Build Verification:**
   - `npm run typecheck` (0 errors).
   - `npm test` (all tests pass).
   - Zero console warnings or hydration errors in Next.js 15.

---

## 5. Constraints & Compliance
- **English UI Only:** All interface labels, descriptions, and rationales displayed in English. Natural language input supports both Thai and English.
- **Zero Unicode Emojis in code:** Use Lucide icons (`Sparkles`, `CheckCircle2`, `Camera`, `Mic`, `Presentation`, `Film`).
- **No external paid API dependencies:** The deterministic semantic matcher runs client/server-side instantly with 0ms latency and 100% offline reliability for Hackathon judging.
