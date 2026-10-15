# AI Smart Kit Builder & "Ask AI" Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Ask AI" search pill button on the hero search bar and an interactive AI Smart Kit Builder modal that recommends tailored equipment bundles within user budgets.

**Architecture:** A pure domain matching module (`lib/domain/ai-kit.ts`) tested with Vitest, an accessible modal dialog (`components/ai-kit-modal.tsx`) with instant inspiration prompts, and seamless integration into the homepage hero search (`components/hero-search.tsx`).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide icons, Vitest.

## Global Constraints
- English UI only; user natural language prompt accepts Thai and English.
- Zero Unicode emojis in code; use Lucide SVG icons exclusively (`Sparkles`, `Film`, `Mic`, `Presentation`, `Camera`, `CheckCircle2`, `X`).
- Fast, deterministic client-side execution using existing 30 items with 0ms latency for reliable offline Hackathon judging.

---

### Task 1: Domain Logic & Unit Tests

**Files:**
- Create: `lib/domain/ai-kit.ts`
- Test: `lib/domain/ai-kit.test.ts`

**Interfaces:**
- Produces:
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

  export function extractBudgetSatang(prompt: string): number | null;
  export function generateSmartKit(prompt: string, catalog: ItemSummary[]): SmartKitResult;
  ```

- [ ] **Step 1: Write unit tests in `lib/domain/ai-kit.test.ts`**
  - Test budget extraction for `budget 1200`, `งบ 1,000`, `งบ800`, `1500 baht`.
  - Test kit generation for vlog prompt (pairs camera + mic/audio + accessories).
  - Test kit generation for podcast prompt (pairs mic + headphones + interface).
  - Test kit generation for seminar/presentation prompt (pairs projector + speaker).
  - Test empty catalog and unknown prompt handling.

- [ ] **Step 2: Run Vitest to verify tests fail initially**
  - Run: `npm test`

- [ ] **Step 3: Implement `lib/domain/ai-kit.ts`**
  - Implement `extractBudgetSatang` with regex matching.
  - Implement `generateSmartKit` with keyword classification, item scoring, complementary deduplication, and rationale generation.

- [ ] **Step 4: Run Vitest to verify all tests pass**
  - Run: `npm test`

- [ ] **Step 5: Commit Task 1**
  - `git add lib/domain/ai-kit.ts lib/domain/ai-kit.test.ts`
  - `git commit -m "feat(ai): add AI Smart Kit matching domain logic and unit tests"`

---

### Task 2: AI Smart Kit Modal Component

**Files:**
- Create: `components/ai-kit-modal.tsx`

**Interfaces:**
- Consumes:
  - `ItemSummary` from `lib/types`
  - `generateSmartKit`, `SmartKitResult` from `lib/domain/ai-kit`
  - `formatMoney` from `lib/format`
- Produces:
  ```tsx
  export function AiKitModal({
    isOpen,
    onClose,
    initialPrompt,
    catalog,
  }: {
    isOpen: boolean;
    onClose: () => void;
    initialPrompt?: string;
    catalog: ItemSummary[];
  }): React.ReactElement | null;
  ```

- [ ] **Step 1: Build `AiKitModal` component**
  - Responsive modal with backdrop blur and accessible close triggers (`Esc`, outside click, `X` button).
  - Header: Emerald gradient badge, Sparkles icon, `Brollow AI · Smart Kit Builder`.
  - Quick Inspiration Chips:
    - 🎬 Solo Outdoor Vlog (฿800)
    - 🎙️ 2-Person Podcast Recording (฿1,200)
    - 📽️ Workshop Seminar & Slides (฿1,500)
    - 📸 Graduation Portrait Photoshoot (฿900)
    - 🏕️ Weekend Camping & Movie Night (฿1,000)
  - Input field with submit action and loading feedback.
  - Smart Kit Results card:
    - Kit Name and budget status badge (`Within budget` / `Cost-optimized`).
    - Total daily rate in formatted ฿ THB.
    - Synergy explanation bullet points.
    - Grid of bundled items with thumbnail, title, category, and daily price.
    - Navigation link to item detail / booking.

- [ ] **Step 2: Commit Task 2**
  - `git add components/ai-kit-modal.tsx`
  - `git commit -m "feat(ai): create interactive AI smart kit modal component"`

---

### Task 3: Hero Search Integration & Remote Sync

**Files:**
- Modify: `components/hero-search.tsx`

- [ ] **Step 1: Add "Ask AI" capsule button to `HeroSearch`**
  - Inside the "What do you want to rent?" input container, add the pill button on the right:
    - Background: `#e3edc8` (soft lime)
    - Text: `#124e3b` (deep forest green)
    - Icon: Lucide `Sparkles`
    - Text: `Ask AI`
  - Clicking triggers `setAiModalOpen(true)` with the current input `q`.
  - Mount `<AiKitModal />` with catalog items from `useCatalog()`.

- [ ] **Step 2: Run verification**
  - `npm run typecheck` (0 errors)
  - `npm test` (all tests pass)

- [ ] **Step 3: Commit and Push**
  - `git add components/hero-search.tsx`
  - `git commit -m "feat(search): integrate Ask AI pill button and smart kit modal in hero search"`
  - `git push origin feat/marketplace:feat/marketplace feat/marketplace:Function/bright feat/marketplace:main`
