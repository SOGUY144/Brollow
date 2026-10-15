/**
 * Turns what people actually type ("อยากเช่ากล้อง", "rent a projector",
 * "cameras near me") into keyword groups. Every group must match an item;
 * any word inside a group may match.
 */

/** Thai words (no spaces between words) mapped to English listing keywords. */
const THAI: Record<string, string[]> = {
  "กล้อง": ["camera", "gopro", "lens"],
  "เลนส์": ["lens"],
  "ขาตั้ง": ["stand", "tripod"],
  "ไฟถ่ายภาพ": ["light"],
  "ไฟประดับ": ["festoon", "lights"],
  "ไฟปาร์ตี้": ["festoon", "lights"],
  "โปรเจกเตอร์": ["projector"],
  "โปรเจคเตอร์": ["projector"],
  "เครื่องฉาย": ["projector"],
  "โดรน": ["drone"],
  "แบตสำรอง": ["power station", "battery"],
  "พาวเวอร์แบงค์": ["power station", "battery"],
  "เครื่องปั่นไฟ": ["power station"],
  "เครื่องเล่นเกม": ["console", "games"],
  "เกม": ["console", "games"],
  "เต็นท์งาน": ["gazebo"],
  "ซุ้ม": ["gazebo"],
  "เต็นท์": ["tent"],
  "เต้นท์": ["tent"],
  "ถุงนอน": ["sleeping bag"],
  "เตาแคมป์": ["stove"],
  "เตาแก๊ส": ["stove"],
  "เตา": ["stove"],
  "คายัค": ["kayak"],
  "เรือ": ["kayak", "paddle"],
  "แคมป์ปิ้ง": ["camping", "tent", "sleeping", "stove", "kayak"],
  "แคมป์": ["camping", "tent", "sleeping", "stove", "kayak"],
  "สว่าน": ["drill"],
  "เครื่องฉีดน้ำ": ["pressure washer"],
  "ฉีดน้ำแรงดัน": ["pressure washer"],
  "เครื่องซักพรม": ["carpet"],
  "ซักพรม": ["carpet"],
  "บันได": ["ladder"],
  "เลื่อย": ["saw"],
  "เครื่องมือช่าง": ["drill", "saw", "ladder", "washer"],
  "กีตาร์": ["guitar"],
  "เปียโน": ["piano", "keyboard"],
  "คีย์บอร์ด": ["piano", "keyboard"],
  "ลำโพง": ["speaker"],
  "เครื่องเสียง": ["speaker", "pa"],
  "ดีเจ": ["dj"],
  "จักรยาน": ["bike"],
  "ซัพบอร์ด": ["paddle"],
  "บอร์ดยืนพาย": ["paddle"],
  "ไม้กอล์ฟ": ["golf"],
  "กอล์ฟ": ["golf"],
  "ไม้เทนนิส": ["tennis"],
  "เทนนิส": ["tennis"],
  "เครื่องทำควัน": ["smoke"],
  "สโมค": ["smoke"],
  "ป๊อปคอร์น": ["popcorn"],
  "ข้าวโพดคั่ว": ["popcorn"],
  "ปาร์ตี้": ["party"],
  "งานเลี้ยง": ["party"],
};

/** Words that express wanting to rent, not what to rent. */
const THAI_FILLER = [
  "อยากเช่า", "อยากยืม", "อยากได้", "ต้องการ", "หาเช่า", "ให้เช่า", "เช่า", "ยืม",
  "ราคาถูก", "ใกล้ฉัน", "ใกล้ๆ", "หน่อย", "ครับ", "ค่ะ", "คะ", "นะ", "หา", "ขอ", "ของ", "ที่", "แถว", "ใน",
];
const ENGLISH_FILLER = new Set([
  "rent", "rental", "rentals", "renting", "hire", "borrow", "want", "need", "looking", "find", "for", "to",
  "a", "an", "the", "i", "me", "my", "near", "nearby", "cheap", "some", "something", "please", "day", "daily",
]);

/** English words mapped to related listing words. */
const ENGLISH: Record<string, string[]> = {
  camera: ["camera", "gopro", "lens"],
  bike: ["bike", "bicycle"],
  bicycle: ["bike", "bicycle"],
  speaker: ["speaker", "pa"],
  sup: ["paddle"],
  paddleboard: ["paddle"],
  keyboard: ["keyboard", "piano"],
  piano: ["piano", "keyboard"],
  console: ["console", "games"],
  switch: ["console", "games"],
  fog: ["smoke"],
  light: ["light", "lights", "festoon"],
};

const THAI_KEYS = Object.keys(THAI).sort((a, b) => b.length - a.length);
const THAI_FILLER_SORTED = [...THAI_FILLER].sort((a, b) => b.length - a.length);

function singular(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

export function parseQuery(raw: string): string[][] {
  let text = raw.toLowerCase().trim();
  const groups: string[][] = [];

  // Thai: pull out known words first (longest first), then drop filler words.
  for (const key of THAI_KEYS) {
    if (text.includes(key)) {
      groups.push(THAI[key]);
      text = text.split(key).join(" ");
    }
  }
  for (const filler of THAI_FILLER_SORTED) text = text.split(filler).join(" ");

  for (const token of text.split(/[\s,.;:!?()/+-]+/).filter(Boolean)) {
    if (/^[a-z0-9]+$/.test(token)) {
      if (token.length < 2 || ENGLISH_FILLER.has(token)) continue;
      const word = singular(token);
      groups.push(ENGLISH[word] ?? [word]);
    } else if (token.length >= 2) {
      // Unknown Thai (or other) text still has to appear in the listing itself.
      groups.push([token]);
    }
  }
  return groups;
}
