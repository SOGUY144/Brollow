# Brollow

**Borrow instead of buying.** A peer-to-peer rental marketplace prototype: find items nearby, check availability for your dates, send a rental request, and list your own things.

Prices are in **Thai baht (฿, THB)**. The interface is in English.

## Quick start (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase settings the app runs in **demo mode**:

- You act as a seeded demo user, **Alex Morgan**. There is no real login.
- Owners, listings and reviews are fictional and labelled as demo content.
- Your saved items, listings and rental requests are stored only in this browser (localStorage).
- Requests and owner decisions are simulated. No money moves and nothing is really reserved.
- Reset everything from **Account → About demo mode → Reset demo data**.

## Live mode (Supabase)

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/20261015000000_marketplace.sql` (SQL editor, or `supabase db push` with the Supabase CLI). It creates tables, Row Level Security policies, booking functions and the `item-images` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key)
   - `SUPABASE_SERVICE_ROLE_KEY`, used only by the seed script; never expose it to the browser
4. Optional demo content: `npm run seed:live` (creates fictional owners with unusable random passwords, their listings, reviews and a few confirmed bookings).
5. `npm run dev`, then register an account.

When the Supabase variables are present the app uses them. A backend failure shows an error; it never falls back to demo data.

> **Not verified:** live mode has not been run against a real Supabase project yet. The SQL and the live data layer type-check, but the migration, RLS policies and booking functions need testing on a real database before use.

## Rules the app enforces

| Rule | Where |
|---|---|
| Dates are calendar dates in `Europe/London`*; start and end are inclusive; a same-day rental is 1 day | `lib/domain/dates.ts`, SQL `app_today()` |
| No past start dates, no end before start, max 30 days | `validateRentalDates`, `request_booking()` |
| Money in integer satang (1 baht = 100 satang); total = daily rate × days, no fees | `lib/domain/pricing.ts`, `request_booking()` |
| Daily price ฿20 – ฿20,000 | `lib/domain/listing.ts`, `items` check constraint |
| You can't rent your own item | demo store, `request_booking()` |
| Requests start as **pending** and don't block dates; only **confirmed** bookings do | `lib/domain/availability.ts`, `item_blocked_ranges()` |
| pending → confirmed / declined (owner); pending → cancelled (renter); confirmed → cancelled (either, before start) | `lib/domain/bookings.ts`, `set_booking_status()` |
| Confirmation re-checks availability; overlapping confirmed bookings are blocked atomically by a Postgres exclusion constraint | `bookings_no_overlap` |
| Price is recalculated on the server from the listing | `request_booking()` |

\* The timezone is one constant (`APP_TIMEZONE`) plus `app_today()` in SQL. Change both to `Asia/Bangkok` if you target Thailand.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (dates, pricing, overlaps, search filters, booking rules, listing validation) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route types + TypeScript |
| `npm run images:fetch` | Re-download demo photos from Openverse (reviewed images only; rejected IDs in `scripts/rejected-images.json`) |
| `npm run seed:live` | Seed a Supabase project with demo content |

## Project layout

- `app/` routes: `/`, `/search`, `/items/[id]`, `/login`, `/register`, `/list-item`, `/account`, `/account/listings`, `/account/bookings`, `/account/favorites`, `/credits`
- `components/` UI; `components/data-provider.tsx` picks demo or live mode
- `lib/domain/` pure rules (tested in `domain.test.ts`)
- `lib/data/` the shared `DataApi` interface with `demo.ts` and `live.ts` implementations, plus seed data
- `supabase/migrations/` schema, RLS, functions, storage policies

## Photos

Demo photos are openly licensed images from [Openverse](https://openverse.org), listed with creator and licence on `/credits` and in `public/images/items/credits.json`. They illustrate the kind of item, not real listings. One item without a suitable photo uses an illustrated placeholder.

## Known limitations

- Area search works without location permission. Optional owner-provided pickup coordinates enable OpenStreetMap and approximate straight-line distances. Radius filters (1/5/10 km) exclude listings without coordinates. Seed listings have no invented coordinates.
- Apply `supabase/migrations/20261015010000_pickup_coordinates.sql` before using the updated listing form with live Supabase. Existing records remain area-only until the owner adds a public pickup point.
- Location permission is requested only by the current-location button; user coordinates are held in memory and not written to URLs or storage. Map tiles need an internet connection.
- No payments, deposits, insurance, messaging or identity checks.
- Search loads all active listings into the browser, which suits a prototype, not a large catalogue.
- Reviews can't be written from the app yet (seed data only).
