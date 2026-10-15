import type { ItemSummary } from "../types";

export interface SmartKitResult {
  kitName: string;
  description: string;
  targetBudgetSatang: number | null;
  totalDailyPriceSatang: number;
  withinBudget: boolean;
  items: ItemSummary[];
  reasons: string[];
}

interface ScenarioTemplate {
  key: string;
  keywords: string[];
  kitName: string;
  description: string;
  defaultReasons: string[];
  slots: {
    categoryHint?: string;
    keywords: string[];
    reason: string;
  }[];
}

const SCENARIOS: ScenarioTemplate[] = [
  {
    key: "vlog",
    keywords: [
      "vlog",
      "youtube",
      "creator",
      "video",
      "filming",
      "shoot",
      "ถ่ายคลิป",
      "ถ่ายวิดีโอ",
      "คอนเทนต์",
      "tiktok",
      "reels",
      "ยูทูป",
    ],
    kitName: "Creator & Video Vlog Kit",
    description: "Complete setup for high-quality video storytelling, clear speech audio, and illumination.",
    defaultReasons: [
      "High-resolution camera captures crisp video in any lighting condition.",
      "Wireless mic system guarantees crystal-clear voice clarity.",
      "Video light kit ensures balanced illumination for indoor and evening shoots.",
    ],
    slots: [
      {
        categoryHint: "cameras-photography",
        keywords: ["camera", "dslr", "mirrorless", "sony", "canon", "gopro", "กล้อง"],
        reason: "High-resolution camera captures crisp video in any lighting.",
      },
      {
        categoryHint: "party-equipment",
        keywords: ["wireless mic", "mic", "microphone", "ไมค์", "speaker"],
        reason: "Microphone captures clear vocal audio without background rumble.",
      },
      {
        categoryHint: "cameras-photography",
        keywords: ["light", "led", "tripod", "gimbal", "ขาตั้ง", "ไฟ"],
        reason: "Video lighting and support provides clean framing and professional exposure.",
      },
    ],
  },
  {
    key: "podcast",
    keywords: [
      "podcast",
      "interview",
      "voice",
      "broadcast",
      "audio",
      "สัมภาษณ์",
      "พอดแคสต์",
      "อัดเสียง",
      "จัดรายการ",
    ],
    kitName: "Studio Podcast & Audio Kit",
    description: "Broadcast-quality acoustic recording package tailored for dialogues, interviews, and crisp voiceovers.",
    defaultReasons: [
      "Dynamic vocal microphone captures rich vocal depth with minimal room echo.",
      "Studio audio interface and sound reinforcement for clear playback and monitoring.",
    ],
    slots: [
      {
        categoryHint: "music-equipment",
        keywords: ["condenser", "microphone", "shure", "mic", "vocal", "ไมค์"],
        reason: "Studio microphone captures rich vocal presence and crisp articulation.",
      },
      {
        categoryHint: "electronics",
        keywords: ["interface", "scarlett", "focusrite", "speaker", "headphones", "pa", "audio", "ลำโพง", "หูฟัง"],
        reason: "Audio interface and monitoring setup ensures accurate sound balance and feedback prevention.",
      },
    ],
  },
  {
    key: "seminar",
    keywords: [
      "seminar",
      "presentation",
      "workshop",
      "slides",
      "meeting",
      "conference",
      "lecture",
      "สัมมนา",
      "พรีเซนต์",
      "ฉาย",
      "สไลด์",
      "ห้องประชุม",
      "นิทรรศการ",
    ],
    kitName: "Presentation & Seminar Kit",
    description: "Visual projection and speech amplification for workshops, lectures, and group presentations.",
    defaultReasons: [
      "High-lumen projector delivers sharp, readable slides even in ambient conference lighting.",
      "Loudspeaker or projection screen ensures high-contrast visual display and clear sound.",
    ],
    slots: [
      {
        categoryHint: "electronics",
        keywords: ["projector", "epson", "benq", "โปรเจกเตอร์"],
        reason: "High-lumen projector delivers sharp, readable slides even in ambient conference lighting.",
      },
      {
        categoryHint: "party-equipment",
        keywords: ["screen", "projection", "จอ", "จอโปรเจกเตอร์"],
        reason: "Large portable screen ensures high contrast viewing for all attendees.",
      },
      {
        categoryHint: "party-equipment",
        keywords: ["speaker", "pa", "sound", "ลำโพง"],
        reason: "Loudspeaker provides loud and clear speech coverage across the room.",
      },
    ],
  },
  {
    key: "portrait",
    keywords: [
      "photo",
      "portrait",
      "graduation",
      "model",
      "ถ่ายรูป",
      "รับปริญญา",
      "ภาพนิ่ง",
      "นางแบบ",
      "สตูดิโอ",
    ],
    kitName: "Portrait & Graduation Photoshoot Kit",
    description: "High-resolution camera and portrait optics optimized for natural skin tones and subject separation.",
    defaultReasons: [
      "High-megapixel sensor captures rich textures and vibrant colors.",
      "Fast telephoto zoom lens delivers flattering facial compression and creamy background blur.",
    ],
    slots: [
      {
        categoryHint: "cameras-photography",
        keywords: ["camera", "sony", "canon", "กล้อง"],
        reason: "High-resolution camera ensures maximum detail and fast autofocus.",
      },
      {
        categoryHint: "cameras-photography",
        keywords: ["lens", "telephoto", "light", "zoom", "เลนส์", "ไฟ"],
        reason: "Fast portrait lens provides natural subject isolation and creamy background blur.",
      },
    ],
  },
  {
    key: "camping",
    keywords: [
      "camp",
      "camping",
      "outdoor",
      "tent",
      "nature",
      "แคมป์",
      "กางเต็นท์",
      "เดินป่า",
      "กลางแจ้ง",
      "พักแรม",
    ],
    kitName: "Weekend Camping & Outdoor Kit",
    description: "Weather-resistant outdoor gear designed for easy campsite setup and outdoor comfort.",
    defaultReasons: [
      "Spacious, weather-proof family shelter keeps you dry and comfortable outdoors.",
      "Camping cookstove enables hot meals and outdoor cooking on the go.",
      "Portable power supply keeps lights, devices, and small appliances running.",
    ],
    slots: [
      {
        categoryHint: "camping-outdoors",
        keywords: ["tent", "เต็นท์"],
        reason: "Spacious, weather-proof shelter keeps you dry and comfortable outdoors.",
      },
      {
        categoryHint: "camping-outdoors",
        keywords: ["stove", "sleeping", "mat", "เตา", "ถุงนอน"],
        reason: "Essential camping gear ensures warmth and convenient outdoor cooking.",
      },
      {
        categoryHint: "electronics",
        keywords: ["power", "station", "battery", "light", "ไฟ", "แบตเตอรี่"],
        reason: "Portable power station keeps essential campsite lighting and gadgets powered.",
      },
    ],
  },
];

/**
 * Extracts a target daily budget in satang (1 THB = 100 satang) from a natural language string.
 */
export function extractBudgetSatang(prompt: string): number | null {
  if (!prompt || typeof prompt !== "string") return null;

  // Pattern 1: Thai "งบ 1,000" or "งบ800"
  const thaiMatch = prompt.match(/งบ\s*[:=]?\s*([0-9,]+)/i);
  if (thaiMatch && thaiMatch[1]) {
    const num = parseInt(thaiMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(num) && num > 0) return num * 100;
  }

  // Pattern 2: English "budget: ฿1,200", "budget 800", "budget = 1500"
  const enMatch = prompt.match(/budget\s*[:=]?\s*฿?\s*([0-9,]+)/i);
  if (enMatch && enMatch[1]) {
    const num = parseInt(enMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(num) && num > 0) return num * 100;
  }

  // Pattern 3: "1500 baht" or "1500 บาท"
  const bahtMatch = prompt.match(/([0-9,]+)\s*(?:baht|บาท)/i);
  if (bahtMatch && bahtMatch[1]) {
    const num = parseInt(bahtMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(num) && num > 0) return num * 100;
  }

  return null;
}

/**
 * Generates an intelligent, complementary equipment bundle based on a user's task prompt.
 */
export function generateSmartKit(
  prompt: string,
  catalog: ItemSummary[]
): SmartKitResult {
  const targetBudgetSatang = extractBudgetSatang(prompt);

  if (!catalog || catalog.length === 0) {
    return {
      kitName: "Custom Equipment Kit",
      description: "No items currently available in the catalog matching this request.",
      targetBudgetSatang,
      totalDailyPriceSatang: 0,
      withinBudget: true,
      items: [],
      reasons: ["No active equipment found matching current inventory."],
    };
  }

  const promptLower = prompt.toLowerCase();

  // Find best-matching scenario template
  let bestScenario: ScenarioTemplate | null = null;
  let highestScore = 0;

  for (const scenario of SCENARIOS) {
    let score = 0;
    for (const kw of scenario.keywords) {
      if (promptLower.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestScenario = scenario;
    }
  }

  const selectedItems: ItemSummary[] = [];
  const reasons: string[] = [];
  const pickedIds = new Set<string>();

  if (bestScenario && highestScore > 0) {
    // Fill scenario slots
    for (const slot of bestScenario.slots) {
      let candidates = catalog.filter((item) => {
        if (pickedIds.has(item.id)) return false;
        if (item.status && item.status !== "active") return false;

        const text = `${item.title} ${item.description}`.toLowerCase();
        return slot.keywords.some((kw) => text.includes(kw.toLowerCase()));
      });

      // Fallback to category if no keyword candidate matched
      if (candidates.length === 0 && slot.categoryHint) {
        candidates = catalog.filter((item) => {
          if (pickedIds.has(item.id)) return false;
          if (item.status && item.status !== "active") return false;
          return item.category === slot.categoryHint;
        });
      }

      if (candidates.length > 0) {
        // Sort candidates by rating and keyword relevance
        candidates.sort((a, b) => {
          const aText = `${a.title} ${a.description}`.toLowerCase();
          const bText = `${b.title} ${b.description}`.toLowerCase();
          const aHits = slot.keywords.filter((k) => aText.includes(k.toLowerCase())).length;
          const bHits = slot.keywords.filter((k) => bText.includes(k.toLowerCase())).length;
          if (bHits !== aHits) return bHits - aHits;
          return (b.rating ?? 0) - (a.rating ?? 0);
        });

        const chosen = candidates[0];
        selectedItems.push(chosen);
        pickedIds.add(chosen.id);
        reasons.push(slot.reason);
      }
    }
  }

  // Fallback: if no scenario matched or fewer than 2 items picked, populate with top-rated items
  if (selectedItems.length < 2) {
    const remaining = catalog.filter(
      (item) => !pickedIds.has(item.id) && item.status !== "paused"
    );

    remaining.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    for (const item of remaining) {
      if (selectedItems.length >= 3) break;
      selectedItems.push(item);
      pickedIds.add(item.id);
    }

    if (reasons.length === 0) {
      reasons.push("Curated from top-rated equipment with high community satisfaction.");
      reasons.push("Pairs versatile tools to cover your core project workflow.");
    }
  }

  const totalDailyPriceSatang = selectedItems.reduce(
    (sum, item) => sum + item.dailyPriceSatang,
    0
  );

  const withinBudget =
    targetBudgetSatang !== null ? totalDailyPriceSatang <= targetBudgetSatang : true;

  const kitName = bestScenario ? bestScenario.kitName : "Curated Creator & Event Kit";
  const description = bestScenario
    ? bestScenario.description
    : "Hand-picked high-performance equipment bundle designed for efficiency, reliability, and value.";

  return {
    kitName,
    description,
    targetBudgetSatang,
    totalDailyPriceSatang,
    withinBudget,
    items: selectedItems,
    reasons: reasons.length > 0 ? reasons : ["Tailored equipment set optimized for your project."],
  };
}
