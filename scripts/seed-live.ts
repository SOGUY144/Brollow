/**
 * Seeds a Supabase project with the same fictional demo listings used in demo mode.
 * Run locally only:  npm run seed:live
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for example in .env.local).
 * The service-role key bypasses RLS: never expose it to the browser or commit it.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { DEMO_USER_ID, SEED_PROFILES, seedBookings, seedItems, seedReviews } from "../lib/data/seed";
import { todayInAppTz } from "../lib/domain/dates";

// Minimal .env.local loader so the script needs no extra packages.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { count, error: countError } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("is_demo", true);
  if (countError) throw new Error(`Is the migration applied? ${countError.message}`);
  if (count) {
    console.log("Demo profiles already exist; nothing to do.");
    return;
  }

  // 1. Demo owners. The demo-mode identity is skipped: in live mode people register themselves.
  const userIds = new Map<string, string>();
  for (const p of SEED_PROFILES.filter((p) => p.id !== DEMO_USER_ID)) {
    const { data, error } = await sb.auth.admin.createUser({
      email: `demo+${p.id.slice(2)}@example.com`,
      password: randomBytes(24).toString("base64url"), // random, never printed: these accounts are not for logging in
      email_confirm: true,
      user_metadata: { display_name: p.displayName },
    });
    if (error) throw new Error(`createUser ${p.id}: ${error.message}`);
    userIds.set(p.id, data.user.id);
    const { error: profileError } = await sb.from("profiles")
      .update({ display_name: p.displayName, area: p.area, bio: p.bio, member_since: p.memberSince, is_demo: true })
      .eq("id", data.user.id);
    if (profileError) throw new Error(`profile ${p.id}: ${profileError.message}`);
  }

  // 2. Listings owned by those users. Photos are served by the app from /public/images/items.
  const itemIds = new Map<string, string>();
  for (const item of seedItems().filter((i) => userIds.has(i.ownerId))) {
    const { data, error } = await sb.from("items").insert({
      owner_id: userIds.get(item.ownerId), title: item.title, description: item.description, category: item.category,
      daily_price_satang: item.dailyPriceSatang, location: item.location, condition: item.condition, rules: item.rules,
      images: item.images, status: "active",
    }).select("id").single();
    if (error) throw new Error(`item ${item.id}: ${error.message}`);
    itemIds.set(item.id, data.id);
  }

  // 3. Demo reviews, flagged so the UI labels them.
  const reviews = seedReviews().filter((r) => itemIds.has(r.itemId)).map((r) => ({
    item_id: itemIds.get(r.itemId), author_name: r.authorName, rating: r.rating, comment: r.comment, created_at: r.createdAt, is_demo: true,
  }));
  if (reviews.length) {
    const { error } = await sb.from("reviews").insert(reviews);
    if (error) throw new Error(`reviews: ${error.message}`);
  }

  // 4. Confirmed bookings between demo owners, so date filtering has something to exclude.
  const bookings = seedBookings(todayInAppTz())
    .filter((b) => b.status === "confirmed" && itemIds.has(b.itemId) && userIds.has(b.renterId) && userIds.has(b.ownerId))
    .map((b) => ({
      item_id: itemIds.get(b.itemId), renter_id: userIds.get(b.renterId), owner_id: userIds.get(b.ownerId),
      start_date: b.startDate, end_date: b.endDate, days: b.days, daily_price_satang: b.dailyPriceSatang,
      total_satang: b.totalSatang, status: "confirmed", message: b.message,
    }));
  if (bookings.length) {
    const { error } = await sb.from("bookings").insert(bookings);
    if (error) throw new Error(`bookings: ${error.message}`);
  }

  console.log(`Seeded ${userIds.size} demo owners, ${itemIds.size} listings, ${reviews.length} reviews and ${bookings.length} confirmed bookings.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
