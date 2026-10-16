export interface Coordinates { latitude: number; longitude: number }

export function validCoordinates(value: Coordinates | null | undefined): value is Coordinates {
  return !!value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

/** Great-circle distance, not a road route or travel time. Missing coordinates stay unknown. */
export function distanceKm(a: Coordinates | null | undefined, b: Coordinates | null | undefined): number | null {
  if (!validCoordinates(a) || !validCoordinates(b)) return null;
  const radians = (v: number) => v * Math.PI / 180;
  const h = Math.sin(radians(b.latitude - a.latitude) ** 2 / 2)
    ? Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
      + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2
    : Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
      + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

const KNOWN_AREA_COORDINATES: Array<{ keywords: string[]; coords: Coordinates }> = [
  // Bangkok & Thailand districts / universities
  { keywords: ["sukhumvit", "สุขุมวิท", "asok", "อโศก", "phrom phong", "พร้อมพงษ์", "thonglor", "ทองหล่อ", "ekkamai", "เอกมัย", "on nut", "อ่อนนุช", "phra khanong", "พระโขนง"], coords: { latitude: 13.7307, longitude: 100.5696 } },
  { keywords: ["siam", "สยาม", "pathum wan", "ปทุมวัน", "chula", "จุฬา", "samyan", "สามย่าน", "mbk", "ratchathewi", "ราชเทวี"], coords: { latitude: 13.7462, longitude: 100.5347 } },
  { keywords: ["silom", "สีลม", "sathorn", "สาทร", "bang rak", "บางรัก", "lumphini", "ลุมพินี"], coords: { latitude: 13.7248, longitude: 100.5318 } },
  { keywords: ["ari", "อารีย์", "phaya thai", "พญาไท", "victory monument", "อนุสาวรีย์", "saphan khwai", "สะพานควาย"], coords: { latitude: 13.7796, longitude: 100.5446 } },
  { keywords: ["chatuchak", "จตุจักร", "ladprao", "lat phrao", "ลาดพร้าว", "kasetsart", "เกษตร", "bang sue", "บางซื่อ", "vibhavadi", "วิภาวดี"], coords: { latitude: 13.8162, longitude: 100.5608 } },
  { keywords: ["rama 9", "พระราม 9", "huai khwang", "ห้วยขวาง", "ratchada", "รัชดา", "din daeng", "ดินแดง", "asoke"], coords: { latitude: 13.7582, longitude: 100.5665 } },
  { keywords: ["lat krabang", "ลาดกระบัง", "kmitl", "suvarnabhumi", "สุวรรณภูมิ"], coords: { latitude: 13.7298, longitude: 100.7782 } },
  { keywords: ["bang na", "บางนา", "bearing", "แบริ่ง", "srinakarin", "ศรีนครินทร์", "prawet", "ประเวศ", "udom suk", "อุดมสุข"], coords: { latitude: 13.6682, longitude: 100.6140 } },
  { keywords: ["thonburi", "ธนบุรี", "iconsiam", "คลองสาน", "บางมด", "bang mod", "kmutt", "ท่าพระ", "วงเวียนใหญ่"], coords: { latitude: 13.7262, longitude: 100.5105 } },
  { keywords: ["rangsit", "รังสิต", "pathum thani", "ปทุมธานี", "thammasat", "ธรรมศาสตร์", "คลองหลวง"], coords: { latitude: 14.0725, longitude: 100.6058 } },
  { keywords: ["nonthaburi", "นนทบุรี", "pak kret", "ปากเกร็ด", "งามวงศ์วาน", "ngamwongwan", "บางใหญ่"], coords: { latitude: 13.8591, longitude: 100.5217 } },
  { keywords: ["salaya", "ศาลายา", "mahidol", "มหิดล", "nakhon pathom", "นครปฐม"], coords: { latitude: 13.7944, longitude: 100.3256 } },
  { keywords: ["samut prakan", "สมุทรปราการ", "สำโรง", "ปากน้ำ"], coords: { latitude: 13.5991, longitude: 100.5998 } },
  { keywords: ["chiang mai", "เชียงใหม่", "nimman", "นิมมาน"], coords: { latitude: 18.7883, longitude: 98.9853 } },
  { keywords: ["phuket", "ภูเก็ต"], coords: { latitude: 7.8804, longitude: 98.3923 } },
  { keywords: ["pattaya", "พัทยา", "chonburi", "ชลบุรี", "บางแสน", "ศรีราชา"], coords: { latitude: 12.9236, longitude: 100.8825 } },
  { keywords: ["khon kaen", "ขอนแก่น"], coords: { latitude: 16.4419, longitude: 102.8360 } },
  { keywords: ["hat yai", "หาดใหญ่", "songkhla", "สงขลา"], coords: { latitude: 7.0086, longitude: 100.4747 } },
  { keywords: ["korat", "โคราช", "นครราชสีมา"], coords: { latitude: 14.9799, longitude: 102.0978 } },
  // UK seed locations
  { keywords: ["hackney"], coords: { latitude: 51.5450, longitude: -0.0553 } },
  { keywords: ["islington"], coords: { latitude: 51.5362, longitude: -0.1033 } },
  { keywords: ["didsbury", "manchester"], coords: { latitude: 53.4168, longitude: -2.2312 } },
  { keywords: ["clifton", "bristol"], coords: { latitude: 51.4553, longitude: -2.6203 } },
  { keywords: ["headingley", "leeds"], coords: { latitude: 53.8198, longitude: -1.5784 } },
  { keywords: ["leith", "edinburgh"], coords: { latitude: 55.9755, longitude: -3.1665 } },
  { keywords: ["kemptown", "brighton"], coords: { latitude: 50.8195, longitude: -0.1235 } },
  { keywords: ["jewellery quarter", "birmingham"], coords: { latitude: 52.4872, longitude: -1.9102 } },
  { keywords: ["finnieston", "glasgow"], coords: { latitude: 55.8648, longitude: -4.2838 } },
  { keywords: ["london"], coords: { latitude: 51.5074, longitude: -0.1278 } },
  // General Bangkok fallback
  { keywords: ["bangkok", "กรุงเทพ", "กทม", "bkk", "thailand", "ไทย"], coords: { latitude: 13.7563, longitude: 100.5018 } },
];

/**
 * Resolves coordinates for an item's pickup area.
 * Uses explicit coordinates when valid and non-zero (ignores 0,0 Null Island),
 * otherwise matches the location text against known Thai/UK neighborhoods,
 * defaulting to central Bangkok so every listing renders a neighborhood map.
 */
export function resolveItemCoordinates(
  locationText: string,
  explicit?: Coordinates | null
): Coordinates {
  if (
    validCoordinates(explicit) &&
    !(Math.abs(explicit.latitude) < 0.001 && Math.abs(explicit.longitude) < 0.001)
  ) {
    return explicit;
  }

  const normalized = (locationText || "").trim().toLowerCase();
  for (const entry of KNOWN_AREA_COORDINATES) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.coords;
    }
  }

  return { latitude: 13.7563, longitude: 100.5018 };
}

