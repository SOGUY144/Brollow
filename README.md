# Brollow — AI-Powered Peer-to-Peer Equipment Rental Marketplace

> **Borrow instead of buying.** Brollow turns what you need to do into a ready-to-rent equipment kit nearby — complete with a **Voice-First AI Kit Consultant**, **Escrow Payment Protection**, **Pickup & Return Photo Verification**, **Real-Time Booking Chat**, and **Mutual Reputation Ratings**.

🌐 **Live Production Demo:** [https://brollow.vercel.app](https://brollow.vercel.app)

---

## ✨ Key Features

### 1. 🎙️ Voice-First AI Smart Kit Consultant (`OpenAI` + `ElevenLabs`)
Instead of searching item-by-item when you don't know what gear you need, describe your project and budget by **speaking (Thai or English)** or typing (e.g., *"จัดชุดไลฟ์สดนอกสถานที่ งบ 1,500 บาท"* or *"Solo outdoor vlog, budget ฿1,200"*):
- **Speech-to-Text (`ElevenLabs Scribe v1`)**: Speak naturally into the microphone in Thai or English (`/api/elevenlabs/stt`).
- **AI Kit Curation (`OpenAI GPT-4o-mini` + Deterministic Planner Fallback)**: Analyzes project goals, budget constraints (in THB), and real-time catalog availability to assemble a complete multi-item kit with role explanations and savings vs. buying new (`/api/ai-kit` & `lib/domain/ai-kit.ts`).
- **Text-to-Speech (`ElevenLabs v4 Turbo`)**: Listen to the AI consultant explain why each piece of equipment was chosen and summarize total rental costs in natural Thai or English voice (`/api/elevenlabs/tts`).

### 2. 🛡️ Escrow Wallet & Transparent Pricing
- **Escrow Protection Flow**: Renters pay via **PromptPay QR**, **Credit/Debit Card**, or **Brollow Wallet**. Funds are held safely in escrow (`escrow_held`) and only released to the owner's wallet (`escrow_payout`) once equipment pickup is verified.
- **Automated Refunds**: Cancelling a paid booking before pickup automatically refunds 100% of held escrow funds back to the renter's Brollow Wallet.
- **Printable Rental Receipts**: Every booking generates an itemized receipt showing daily rate, duration, 10% platform protection fee, escrow status, and verification timestamps.

### 3. 📸 Handover Verification (Pickup & Return Proof)
- Both pickup and return transitions require structured condition verification (`components/handover-modal.tsx`), allowing owners and renters to attach condition photos and inspection notes to prevent disputes.

### 4. 💬 Real-Time Booking Chat & Unread Badges
- Dedicated per-booking messaging drawer (`components/booking-chat-drawer.tsx`) between renter and owner to coordinate pickup times, accessories, and questions, complete with live unread notification badges.

### 5. ⭐ Two-Way Mutual Ratings & Reputation
- After a rental concludes, both the **Renter** and the **Owner** can rate each other (1–5 stars + role-specific verified tags like *On time*, *As described*, *Returned on time*, *Good care*).

### 6. 📍 Interactive OpenStreetMap Location & Distance Filtering
- Listings support optional public pickup coordinates rendered on OpenStreetMap (`components/pickup-location.tsx`) with straight-line distance calculation and radius filtering (`1 km`, `5 km`, `10 km`).

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4 (App Router, Turbopack, TypeScript 5) |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons, Base UI / shadcn primitives, Sonner |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, PL/pgSQL RPCs, Supabase Auth & Storage) |
| **LLM Planner** | OpenAI API (`gpt-4o-mini` with structured JSON validation + local deterministic fallback) |
| **Voice AI (STT & TTS)** | ElevenLabs API (`scribe_v1` Speech-to-Text & `eleven_v4_turbo` Multilingual/Thai Text-to-Speech) |
| **Testing** | Vitest (`71` unit tests across 7 domain test suites) |
| **Deployment** | Vercel (`https://brollow.vercel.app`) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/SOGUY144/Brollow.git
cd Brollow
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:
- **`NEXT_PUBLIC_SUPABASE_URL`** & **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**: Connects the app to Live Supabase PostgreSQL + Auth. *(If left empty, the app automatically runs in browser-persisted **Demo Mode** as Alex Morgan).*
- **`OPENAI_API_KEY`**: Enables live `gpt-4o-mini` AI Smart Kit curation.
- **`ELEVENLABS_API_KEY`**: Enables live voice recording (`scribe_v1`) and spoken AI advice (`eleven_v4_turbo`).

### 3. Database Setup (Supabase Live Mode)

Run the SQL migrations in `supabase/migrations/` in chronological order in your Supabase SQL Editor (or run `supabase/seed.sql` to populate initial demo listings):

1. `supabase/migrations/20261015000000_marketplace.sql` — Core profiles, items, reviews, favorites, bookings, exclusion constraints, and storage policies
2. `supabase/migrations/20261015010000_pickup_coordinates.sql` — Geospatial pickup coordinates constraint
3. `supabase/migrations/20261015020000_user_ratings.sql` — Two-way mutual ratings table & `submit_rating()` RPC
4. `supabase/migrations/20261015030000_wallet.sql` — Escrow wallet balances, `wallet_transactions`, `deposit_wallet()`, `withdraw_wallet()`, and escrow handover state machine
5. `supabase/migrations/20261016000000_messages.sql` — Per-booking real-time chat messages & RLS policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Scripts & Quality Checks

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build verification |
| `npm test` | Run all 71 Vitest unit tests (`domain`, `ai-kit`, `wallet`, `ratings`, `messaging`, `location`, `search-terms`) |
| `npm run lint` | Run ESLint static analysis |
| `npm run typecheck` | Generate Next.js route types & run TypeScript compiler check (`tsc --noEmit`) |
| `npm run seed:live` | Seed a live Supabase database using `SUPABASE_SERVICE_ROLE_KEY` |

---

## 📂 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── ai-kit/route.ts          # OpenAI GPT-4o-mini Smart Kit endpoint
│   │   └── elevenlabs/
│   │       ├── stt/route.ts         # ElevenLabs Scribe v1 Speech-to-Text endpoint
│   │       └── tts/route.ts         # ElevenLabs v4 Turbo Text-to-Speech endpoint
│   ├── account/                     # Profile, Bookings, Listings, Favorites & Escrow Wallet pages
│   ├── items/[id]/                  # Item detail, availability calendar & booking request page
│   ├── list-item/                   # Create new equipment listing page
│   ├── rent/[topic]/                # Curated rental category landing pages
│   └── search/                      # Search, category, date, price & distance filter view
├── components/                      # UI & interactive feature modals (AI Kit, Payment, Handover, Chat, Receipt)
├── lib/
│   ├── data/                        # Unified DataApi interface with Live (Supabase) & Demo implementations
│   └── domain/                      # Pure domain logic & 7 Vitest test suites
└── supabase/
    ├── migrations/                  # PostgreSQL schema, RLS policies & atomic RPC functions
    └── seed.sql                     # Initial catalog seed script
```

---

## 🔒 Core Domain Invariants

| Rule | Enforcement |
|---|---|
| Integer Satang arithmetic (`1 THB = 100 satang`) to prevent floating-point errors | `lib/domain/pricing.ts`, PostgreSQL `bigint` |
| Calendar dates in `Asia/Bangkok` (`start_date` and `end_date` inclusive, max 30 days) | `lib/domain/dates.ts`, SQL `app_today()` |
| Atomic overlap prevention on confirmed/active bookings | PostgreSQL `btree_gist` exclusion constraint (`bookings_no_overlap`) |
| Server-authoritative booking lifecycle (`pending` → `approved` → `escrow_held` → `picked_up` → `returned` → `completed`) | `lib/domain/bookings.ts`, SQL `set_booking_status()` |
| AI recommendations strictly map to real catalog `itemId`s & verified pricing | `app/api/ai-kit/route.ts`, `lib/domain/ai-kit.ts` |
