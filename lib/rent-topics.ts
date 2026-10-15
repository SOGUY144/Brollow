import type { CategorySlug } from "./types";

/**
 * Landing pages for what people type into Google: "rent a projector",
 * "เช่ากล้อง". Each page lists matching live listings, so it only ranks for
 * things we can actually offer. Add a topic when there are listings for it.
 */
export interface RentTopic {
  slug: string;
  name: string;
  /** Thai name, used in the heading and description for Thai searches. */
  thai: string;
  /** Search words (any can match), or a whole category. */
  query?: string;
  category?: CategorySlug;
}

export const RENT_TOPICS: RentTopic[] = [
  { slug: "tents", name: "Tents", thai: "เต็นท์", query: "tent" },
  { slug: "camping-gear", name: "Camping gear", thai: "อุปกรณ์แคมป์ปิ้ง", category: "camping-outdoors" },
  { slug: "drills", name: "Drills", thai: "สว่าน", query: "drill" },
  { slug: "pressure-washers", name: "Pressure washers", thai: "เครื่องฉีดน้ำแรงดันสูง", query: "pressure washer" },
  { slug: "diy-tools", name: "DIY tools", thai: "เครื่องมือช่าง", category: "tools-diy" },
  { slug: "gazebos", name: "Gazebos", thai: "เต็นท์จัดงาน", query: "gazebo" },
  { slug: "party-equipment", name: "Party equipment", thai: "อุปกรณ์จัดปาร์ตี้", category: "party-equipment" },
];

export function findTopic(slug: string): RentTopic | undefined {
  return RENT_TOPICS.find((t) => t.slug === slug);
}
