import credits from "../../public/images/items/credits.json";
import { addDays } from "../domain/dates";
import type { Booking, CategorySlug, IsoDate, Item, ItemCondition, Profile, RatingTag, Review, UserRating } from "../types";

/**
 * Fictional demo content. Every profile and review here is marked isDemo and
 * shown with a "Demo content" label; none of these are real users.
 */
export const DEMO_USER_ID = "u-demo";

export const SEED_PROFILES: Profile[] = [
  { id: DEMO_USER_ID, displayName: "Alex Morgan", area: "Hackney, London", bio: "Demo account used to try Brollow without signing in.", memberSince: "2025-03-02", isDemo: true },
  { id: "u-priya", displayName: "Priya S.", area: "Islington, London", bio: "Photographer and weekend DIYer.", memberSince: "2024-11-18", isDemo: true },
  { id: "u-tom", displayName: "Tom H.", area: "Didsbury, Manchester", bio: "Family camper with a garage full of kit.", memberSince: "2024-08-09", isDemo: true },
  { id: "u-hannah", displayName: "Hannah K.", area: "Clifton, Bristol", bio: "Cyclist and video maker.", memberSince: "2025-01-27", isDemo: true },
  { id: "u-sam", displayName: "Sam O.", area: "Headingley, Leeds", bio: "Guitar teacher who lends spare gear.", memberSince: "2024-06-14", isDemo: true },
  { id: "u-fiona", displayName: "Fiona M.", area: "Leith, Edinburgh", bio: "Hill walker and golfer.", memberSince: "2025-02-11", isDemo: true },
  { id: "u-marcus", displayName: "Marcus B.", area: "Kemptown, Brighton", bio: "Sea swimmer, paddler and part-time DJ.", memberSince: "2024-09-30", isDemo: true },
  { id: "u-leah", displayName: "Leah W.", area: "Jewellery Quarter, Birmingham", bio: "Runs small community events.", memberSince: "2025-04-05", isDemo: true },
  { id: "u-callum", displayName: "Callum R.", area: "Finnieston, Glasgow", bio: "Gamer and festival goer.", memberSince: "2024-12-03", isDemo: true },
];

type SeedItem = [
  id: string,
  ownerId: string,
  title: string,
  category: CategorySlug,
  baht: number,
  location: string,
  condition: ItemCondition,
  description: string,
  rules: string[],
];

const ITEMS: SeedItem[] = [
  ["cam-01", "u-priya", "Canon EOS 80D with 18-135mm lens", "cameras-photography", 800, "Islington, London", "good",
    "A reliable APS-C DSLR with a versatile 18-135mm zoom. Comes with two batteries, a charger, a 64 GB SD card and a padded shoulder bag. Great for events, travel and portraits.",
    ["Return with batteries charged", "Please bring your own SD card if you want to keep the files", "No use in rain without a cover"]],
  ["cam-02", "u-hannah", "Sony A7 III full-frame body with two batteries", "cameras-photography", 1200, "Clifton, Bristol", "like_new",
    "Full-frame mirrorless body for stills and 4K video. Includes two batteries, a dual charger and a cage-free strap. Lens not included.",
    ["ID check at pickup", "Return with sensor cap on", "No beach or sand use"]],
  ["cam-03", "u-sam", "70-200mm f/2.8 telephoto lens for Canon EF", "cameras-photography", 650, "Headingley, Leeds", "good",
    "Fast telephoto zoom with image stabilisation, ideal for sport, wildlife and stage photography. Supplied with hood, caps and soft case.",
    ["Keep the lens hood on during use", "Return in the soft case"]],
  ["cam-04", "u-demo", "LED video light kit with two stands", "cameras-photography", 450, "Hackney, London", "good",
    "Two bi-colour LED panels with dimmers, light stands and a carry bag. Works on mains power or NP-F batteries (two included).",
    ["Collect and return in the carry bag", "Mains use indoors only"]],
  ["cam-05", "u-marcus", "GoPro action camera with mounts", "cameras-photography", 350, "Kemptown, Brighton", "good",
    "Waterproof action camera with a chest mount, helmet mount, handlebar mount and floating grip. Two batteries included.",
    ["Rinse with fresh water after sea use", "Return all mounts"]],
  ["ele-01", "u-tom", "Full HD projector, 3,500 lumens", "electronics", 500, "Didsbury, Manchester", "good",
    "Bright 1080p projector for presentations and garden film nights. Includes HDMI cable, power lead and remote. A USB-C to HDMI adapter is available on request.",
    ["Let the lamp cool before packing", "Indoor or dry outdoor use only"]],
  ["ele-02", "u-fiona", "Compact camera drone with three batteries", "electronics", 1000, "Leith, Edinburgh", "like_new",
    "Lightweight sub-250 g drone that records 4K video. Comes with the remote, three batteries, a charging hub and spare propellers.",
    ["You must follow the UK drone code", "Not for use near airports or crowds", "Return with propellers attached"]],
  ["ele-03", "u-leah", "Portable power station 500Wh", "electronics", 500, "Jewellery Quarter, Birmingham", "like_new",
    "Quiet battery power for camping, market stalls and outdoor shoots. Two UK sockets, USB-C and car outlet. Delivered fully charged.",
    ["Return with at least 50% charge", "Keep dry"]],
  ["ele-04", "u-callum", "Games console with two controllers", "electronics", 300, "Finnieston, Glasgow", "good",
    "Handheld and TV games console with dock, two controllers and a party game pre-installed. Perfect for a weekend with friends.",
    ["No account changes", "Return the dock and all cables"]],
  ["camp-01", "u-tom", "Four-person family tent", "camping-outdoors", 350, "Didsbury, Manchester", "good",
    "Tunnel tent with two bedrooms and a porch. Pitches in about 20 minutes. Pegs, mallet and footprint included.",
    ["Return dry, or tell me so I can air it", "Please count the pegs"]],
  ["camp-02", "u-fiona", "Three-season sleeping bag (comfort 0°C)", "camping-outdoors", 150, "Leith, Edinburgh", "good",
    "Synthetic mummy bag with a compression sack. Washed after every rental.",
    ["No food inside the bag"]],
  ["camp-03", "u-callum", "Two-burner camping stove", "camping-outdoors", 180, "Finnieston, Glasgow", "good",
    "Folding stove with wind shields and a grill plate. Uses standard butane cartridges (one included).",
    ["Outdoor use only", "Clean the grill plate before returning"]],
  ["camp-04", "u-marcus", "Sit-on-top kayak with paddle", "camping-outdoors", 900, "Kemptown, Brighton", "good",
    "Stable single kayak for calm sea and rivers. Comes with paddle and one buoyancy aid. You will need a roof rack or a large estate car.",
    ["Buoyancy aid must be worn", "Rinse with fresh water"]],
  ["tool-01", "u-demo", "Cordless combi drill with two batteries", "tools-diy", 200, "Hackney, London", "good",
    "18V drill driver with hammer setting, two batteries, fast charger and a 34-piece bit set in a case.",
    ["Return bits in the case", "Wear eye protection"]],
  ["tool-02", "u-priya", "Electric pressure washer, 140 bar", "tools-diy", 450, "Islington, London", "good",
    "Pressure washer with patio cleaner attachment, 8 m hose and detergent bottle. Ideal for patios, cars and garden furniture.",
    ["Empty the water before returning", "Do not use hot water"]],
  ["tool-03", "u-leah", "Carpet and upholstery cleaner", "tools-diy", 550, "Jewellery Quarter, Birmingham", "good",
    "Upright carpet washer with a hand tool for sofas and car seats. Bring your own cleaning solution or buy one from me.",
    ["Empty and rinse both tanks", "No use on wool rugs"]],
  ["tool-04", "u-sam", "Aluminium extension ladder, 3.9 m", "tools-diy", 250, "Headingley, Leeds", "fair",
    "Two-section extension ladder with stabiliser bar. Some cosmetic scuffs, fully working and inspected.",
    ["Collection only, needs a roof rack or van"]],
  ["tool-05", "u-hannah", "Circular saw 185 mm with guide rail", "tools-diy", 300, "Clifton, Bristol", "good",
    "Corded circular saw with a fresh 24-tooth blade and a 1.4 m guide rail for straight cuts in sheet material.",
    ["Report any blade damage", "Over 18s only"]],
  ["mus-01", "u-sam", "Electric guitar with 20W practice amp", "music-equipment", 400, "Headingley, Leeds", "good",
    "Solid-body electric guitar, freshly set up, with a 20W amp, lead, strap and gig bag. Good for rehearsals and beginners.",
    ["Keep away from heaters", "Return in the gig bag"]],
  ["mus-02", "u-tom", "88-key digital piano with stand", "music-equipment", 550, "Didsbury, Manchester", "like_new",
    "Weighted-key digital piano with sustain pedal, X-stand and headphone output. Fits in a hatchback with the seats down.",
    ["Two people needed to carry", "No drinks on the piano"]],
  ["mus-03", "u-marcus", "Pair of 1000W PA speakers with stands", "music-equipment", 1500, "Kemptown, Brighton", "good",
    "Two powered speakers with Bluetooth, a small mixer, two stands and cables. Suits parties and talks for up to around 150 people.",
    ["Keep volume below clipping", "Indoor or covered use only"]],
  ["mus-04", "u-demo", "DJ controller with headphones", "music-equipment", 600, "Hackney, London", "like_new",
    "Two-channel DJ controller that works with free DJ software, plus closed-back headphones and a USB cable.",
    ["No drinks near the controller"]],
  ["spo-01", "u-hannah", "Road bike, 56 cm aluminium frame", "sports-equipment", 700, "Clifton, Bristol", "good",
    "Light road bike with 2x11 gears and disc brakes. Includes lock, lights and a saddle bag with a spare tube.",
    ["Helmet not included", "Lock the bike whenever it is left"]],
  ["spo-02", "u-marcus", "Inflatable stand-up paddle board", "sports-equipment", 650, "Kemptown, Brighton", "good",
    "All-round board with pump, adjustable paddle, leash and backpack. Inflates in about ten minutes.",
    ["Always wear the leash", "Rinse and dry before packing"]],
  ["spo-03", "u-fiona", "Golf club set with stand bag", "sports-equipment", 500, "Leith, Edinburgh", "good",
    "Right-handed set: driver, 5-wood, irons 5-PW, putter and a light stand bag. Balls and tees not included.",
    ["Clean clubs before returning"]],
  ["spo-04", "u-priya", "Two tennis rackets and a tube of balls", "sports-equipment", 150, "Islington, London", "good",
    "Two adult rackets with covers and a new tube of balls. Handy for a summer of park courts.",
    ["Balls are yours to keep"]],
  ["par-01", "u-leah", "Pop-up gazebo, 3 x 3 m", "party-equipment", 400, "Jewellery Quarter, Birmingham", "good",
    "Quick-erect gazebo with two side walls, weights and pegs. Takes two people about five minutes to put up.",
    ["Do not use in strong wind", "Return dry"]],
  ["par-02", "u-callum", "Smoke machine with wireless remote", "party-equipment", 350, "Finnieston, Glasgow", "good",
    "400W smoke machine with remote and one litre of fluid. Great for parties and small stage shows.",
    ["Check your venue allows smoke machines", "Indoor ventilated spaces only"]],
  ["par-03", "u-tom", "Popcorn machine", "party-equipment", 450, "Didsbury, Manchester", "like_new",
    "Cinema-style popcorn maker with kettle, scoop and 50 paper bags. Makes a batch every three minutes.",
    ["Clean the kettle before returning"]],
  ["par-04", "u-priya", "Festoon party lights, 20 m", "party-equipment", 200, "Islington, London", "good",
    "Warm white outdoor festoon string with 20 LED bulbs and a timer plug. Rated for outdoor use.",
    ["Return coiled on the reel"]],
];

export const SEED_CREATED_AT = "2026-09-01T09:00:00.000Z";

export function seedItems(): Item[] {
  return ITEMS.map(([id, ownerId, title, category, baht, location, condition, description, rules], index) => {
    // Spread activity timestamps so "recently active" ordering is stable.
    const updatedAt = new Date(Date.parse(SEED_CREATED_AT) + index * 3_600_000 * 7).toISOString();
    return {
      id,
      ownerId,
      title,
      description,
      category,
      dailyPriceSatang: baht * 100,
      location,
      condition,
      rules,
      // Only photos that passed review are listed in credits.json; items without one use the category fallback.
      images: ((credits as Record<string, unknown[]>)[id] ?? []).map((_, n) => `/images/items/${id}-${n + 1}.jpg`),
      availableFrom: null,
      availableUntil: null,
      status: "active",
      createdAt: SEED_CREATED_AT,
      updatedAt,
    };
  });
}

const REVIEW_TEXT: [string, number, string][] = [
  ["Jordan P.", 5, "Exactly as described and the handover took two minutes."],
  ["Mia T.", 5, "Clean, well looked after and easy to arrange."],
  ["Ollie D.", 4, "Worked well. Pickup time moved once but the owner kept me updated."],
  ["Grace L.", 5, "Saved me buying one for a single weekend."],
  ["Ben A.", 4, "Good kit, a couple of cosmetic marks that were mentioned in the listing."],
  ["Zara N.", 5, "Helpful tips on how to use it. Would rent again."],
];

export function seedReviews(): Review[] {
  const reviews: Review[] = [];
  ITEMS.forEach(([id], index) => {
    const count = index % 4; // 0 to 3 reviews per item, some items have none
    for (let n = 0; n < count; n++) {
      const [authorName, rating, comment] = REVIEW_TEXT[(index + n) % REVIEW_TEXT.length];
      reviews.push({
        id: `rev-${id}-${n}`,
        itemId: id,
        authorName,
        rating,
        comment,
        createdAt: `2026-0${7 + (n % 3)}-1${n}`,
        isDemo: true,
      });
    }
  });
  return reviews;
}

/** Seed bookings are relative to today so demo availability stays meaningful. */
export function seedBookings(today: IsoDate): Booking[] {
  const items = new Map(seedItems().map((i) => [i.id, i]));
  const make = (id: string, itemId: string, renterId: string, startOffset: number, endOffset: number, status: Booking["status"], message: string): Booking => {
    const item = items.get(itemId)!;
    const startDate = addDays(today, startOffset);
    const endDate = addDays(today, endOffset);
    const days = endOffset - startOffset + 1;
    return {
      id,
      itemId,
      renterId,
      ownerId: item.ownerId,
      startDate,
      endDate,
      days,
      dailyPriceSatang: item.dailyPriceSatang,
      totalSatang: item.dailyPriceSatang * days,
      status,
      message,
      createdAt: SEED_CREATED_AT,
      updatedAt: SEED_CREATED_AT,
    };
  };
  return [
    make("bk-seed-1", "cam-01", "u-tom", 3, 5, "confirmed", "For a wedding on Saturday."),
    make("bk-seed-2", "ele-01", "u-leah", 1, 2, "confirmed", "Community film night."),
    make("bk-seed-3", "spo-02", "u-fiona", 7, 9, "confirmed", "First time paddling, excited!"),
    make("bk-seed-4", "tool-01", "u-hannah", 4, 5, "pending", "Putting up shelves this weekend."),
    make("bk-seed-5", "mus-04", "u-marcus", 10, 11, "pending", "Birthday party set."),
    make("bk-seed-6", "cam-02", DEMO_USER_ID, 14, 15, "pending", "Shooting a short film."),
    make("bk-seed-7", "camp-01", DEMO_USER_ID, 20, 22, "confirmed", "Lake District weekend."),
    // Finished rentals, so the demo user can try rating both sides.
    make("bk-seed-8", "camp-03", DEMO_USER_ID, -10, -8, "confirmed", "Weekend in the Peak District."),
    make("bk-seed-9", "tool-01", "u-hannah", -6, -5, "confirmed", "Hanging a few shelves."),
  ];
}

type SeedRating = [raterId: string, rateeId: string, role: UserRating["role"], score: number, tags: RatingTag[], comment: string];

/** Earlier ratings between fictional users, so profiles show a reputation. */
const RATINGS: SeedRating[] = [
  ["u-tom", "u-priya", "owner", 5, ["on_time", "as_described", "fair_charges"], "Camera was spotless and she explained every setting."],
  ["u-leah", "u-priya", "owner", 5, ["on_time", "communicative"], "Quick replies and an easy pickup."],
  ["u-sam", "u-tom", "owner", 4, ["as_described", "fair_charges"], "Tent had a small tear that was already listed. No fuss at return."],
  ["u-callum", "u-tom", "owner", 5, ["on_time", "as_described", "communicative"], "Ready on time with all the pegs counted."],
  ["u-fiona", "u-hannah", "owner", 5, ["as_described", "fair_charges"], "Bike was set up for my height before I arrived."],
  ["u-priya", "u-sam", "owner", 5, ["on_time", "as_described", "fair_charges", "communicative"], "Lens in perfect condition."],
  ["u-marcus", "u-fiona", "owner", 4, ["communicative"], "Pickup moved by a day but she let me know early."],
  ["u-hannah", "u-marcus", "owner", 5, ["on_time", "as_described", "fair_charges"], "Board and pump exactly as shown."],
  ["u-tom", "u-leah", "owner", 3, ["communicative"], "Gazebo was missing two weights; she sorted it the next day."],
  ["u-priya", "u-callum", "owner", 5, ["on_time", "fair_charges"], "Smooth rental, no extra charges."],
  ["u-tom", DEMO_USER_ID, "owner", 5, ["on_time", "as_described"], "Light kit was charged and ready."],
  ["u-priya", "u-tom", "renter", 5, ["returned_on_time", "good_care"], "Returned clean and on time."],
  ["u-sam", "u-priya", "renter", 5, ["returned_on_time", "good_care", "communicative"], "Would happily lend to her again."],
  ["u-tom", "u-callum", "renter", 4, ["good_care"], "Returned a few hours late, but in great condition."],
  ["u-hannah", "u-fiona", "renter", 5, ["returned_on_time", "good_care"], "Looked after the bike really well."],
  ["u-marcus", "u-hannah", "renter", 5, ["returned_on_time", "communicative"], "Kept me updated the whole time."],
  ["u-callum", DEMO_USER_ID, "renter", 5, ["returned_on_time", "good_care"], "Stove came back cleaner than it left."],
];

export function seedRatings(): UserRating[] {
  const names = new Map(SEED_PROFILES.map((p) => [p.id, p.displayName]));
  return RATINGS.map(([raterId, rateeId, role, score, tags, comment], i) => ({
    id: `rt-seed-${i + 1}`,
    bookingId: `bk-history-${i + 1}`,
    raterId,
    raterName: names.get(raterId) ?? "Someone",
    rateeId,
    role,
    score,
    tags,
    comment,
    createdAt: new Date(Date.parse(SEED_CREATED_AT) - (i + 1) * 86_400_000 * 3).toISOString(),
    isDemo: true,
  }));
}
