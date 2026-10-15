import { describe, expect, it } from "vitest";
import type { ItemSummary } from "../types";
import { extractBudgetSatang, generateSmartKit } from "./ai-kit";

const mockCatalog: ItemSummary[] = [
  {
    id: "item-1",
    ownerId: "owner-1",
    title: "Sony Alpha A7 IV Mirrorless Camera",
    description: "4K 60p full-frame camera, excellent for video, vlogging, and professional portrait photography.",
    category: "cameras-photography",
    dailyPriceSatang: 50000, // 500 THB
    location: "Chatuchak",
    condition: "like_new",
    rules: ["Handle with care"],
    images: ["/test-camera.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.9,
    reviewCount: 12,
  },
  {
    id: "item-2",
    ownerId: "owner-2",
    title: "DJI Mic 2 Wireless Microphone System",
    description: "Dual-channel 32-bit float audio transmitter and receiver for vlogs, interviews, and creators.",
    category: "electronics",
    dailyPriceSatang: 20000, // 200 THB
    location: "Chatuchak",
    condition: "like_new",
    rules: [],
    images: ["/test-mic.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.8,
    reviewCount: 9,
  },
  {
    id: "item-3",
    ownerId: "owner-1",
    title: "Manfrotto Carbon Fiber Video Tripod",
    description: "Fluid head tripod offering rock-solid stability for smooth pan shots and stationary recording.",
    category: "cameras-photography",
    dailyPriceSatang: 10000, // 100 THB
    location: "Chatuchak",
    condition: "good",
    rules: [],
    images: ["/test-tripod.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 5.0,
    reviewCount: 4,
  },
  {
    id: "item-4",
    ownerId: "owner-3",
    title: "Shure SM7B Vocal Studio Microphone",
    description: "Industry-standard dynamic vocal microphone for podcasts, broadcast audio, and vocal tracking.",
    category: "music-equipment",
    dailyPriceSatang: 30000, // 300 THB
    location: "Watthana",
    condition: "like_new",
    rules: [],
    images: ["/test-shure.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.9,
    reviewCount: 15,
  },
  {
    id: "item-5",
    ownerId: "owner-3",
    title: "Focusrite Scarlett 2i2 USB Audio Interface",
    description: "2-in 2-out studio USB sound card interface for dual microphones and podcasting setups.",
    category: "electronics",
    dailyPriceSatang: 20000, // 200 THB
    location: "Watthana",
    condition: "like_new",
    rules: [],
    images: ["/test-interface.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.7,
    reviewCount: 6,
  },
  {
    id: "item-6",
    ownerId: "owner-4",
    title: "Epson Full HD High-Lumen Projector",
    description: "Bright 3,800 ANSI lumen projector ideal for slide presentations, lectures, and movie screenings.",
    category: "electronics",
    dailyPriceSatang: 45000, // 450 THB
    location: "Phra Khanong",
    condition: "good",
    rules: [],
    images: ["/test-projector.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.8,
    reviewCount: 8,
  },
  {
    id: "item-7",
    ownerId: "owner-4",
    title: "100-inch Portable Tripod Projector Screen",
    description: "Matte white portable projection screen for business meetings, conferences, and seminars.",
    category: "party-equipment",
    dailyPriceSatang: 20000, // 200 THB
    location: "Phra Khanong",
    condition: "like_new",
    rules: [],
    images: ["/test-screen.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.6,
    reviewCount: 5,
  },
  {
    id: "item-8",
    ownerId: "owner-2",
    title: "JBL PartyBox Portable Bluetooth Speaker with Mic Input",
    description: "160W high-output wireless loudspeaker with crystal-clear voice projection and bass boost.",
    category: "party-equipment",
    dailyPriceSatang: 35000, // 350 THB
    location: "Bang Kapi",
    condition: "good",
    rules: [],
    images: ["/test-speaker.jpg"],
    availableFrom: null,
    availableUntil: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: null,
    rating: 4.9,
    reviewCount: 20,
  },
];

describe("extractBudgetSatang", () => {
  it("extracts budget in standard English formats", () => {
    expect(extractBudgetSatang("Solo vlog, budget ฿800")).toBe(80000);
    expect(extractBudgetSatang("budget: 1,200 per day")).toBe(120000);
    expect(extractBudgetSatang("1500 baht total daily limit")).toBe(150000);
  });

  it("extracts budget in Thai format phrases", () => {
    expect(extractBudgetSatang("จัดสัมมนา 30 คน ฉายสไลด์ งบ 1,500 บาท")).toBe(150000);
    expect(extractBudgetSatang("ถ่ายคลิปงบ800")).toBe(80000);
    expect(extractBudgetSatang("งบ 1000")).toBe(100000);
  });

  it("returns null when no budget is mentioned", () => {
    expect(extractBudgetSatang("Just shooting an outdoor video")).toBeNull();
    expect(extractBudgetSatang("")).toBeNull();
  });
});

describe("generateSmartKit", () => {
  it("builds a Creator Vlog bundle with camera, mic, and tripod", () => {
    const kit = generateSmartKit("Outdoor Vlog / YouTube video, budget ฿800", mockCatalog);

    expect(kit.kitName).toContain("Vlog");
    expect(kit.items.length).toBeGreaterThanOrEqual(2);
    expect(kit.items.some((i) => i.id === "item-1")).toBe(true); // Sony Camera
    expect(kit.items.some((i) => i.id === "item-2")).toBe(true); // DJI Mic
    expect(kit.targetBudgetSatang).toBe(80000);
    expect(kit.withinBudget).toBe(true);
    expect(kit.totalDailyPriceSatang).toBeLessThanOrEqual(80000);
    expect(kit.reasons.length).toBeGreaterThan(0);
  });

  it("builds a Podcast bundle with microphone and audio interface", () => {
    const kit = generateSmartKit("2-Person Podcast Recording, budget ฿1,200", mockCatalog);

    expect(kit.kitName).toContain("Podcast");
    expect(kit.items.some((i) => i.id === "item-4")).toBe(true); // Shure Mic
    expect(kit.items.some((i) => i.id === "item-5")).toBe(true); // Scarlett Interface
    expect(kit.targetBudgetSatang).toBe(120000);
    expect(kit.withinBudget).toBe(true);
    expect(kit.reasons.length).toBeGreaterThan(0);
  });

  it("builds a Presentation & Seminar bundle with projector and screen", () => {
    const kit = generateSmartKit("Workshop seminar 30 people with slides, budget ฿1,500", mockCatalog);

    expect(kit.kitName).toContain("Presentation");
    expect(kit.items.some((i) => i.id === "item-6")).toBe(true); // Projector
    expect(kit.items.some((i) => i.id === "item-7")).toBe(true); // Screen
    expect(kit.targetBudgetSatang).toBe(150000);
    expect(kit.withinBudget).toBe(true);
  });

  it("handles empty catalog gracefully without crashing", () => {
    const kit = generateSmartKit("Need a camera, budget ฿1,000", []);

    expect(kit.items).toEqual([]);
    expect(kit.totalDailyPriceSatang).toBe(0);
    expect(kit.withinBudget).toBe(true);
    expect(kit.reasons.length).toBeGreaterThan(0);
  });

  it("handles generic prompt with sensible suggestions", () => {
    const kit = generateSmartKit("Something fun for the weekend", mockCatalog);

    expect(kit.items.length).toBeGreaterThan(0);
    expect(kit.reasons.length).toBeGreaterThan(0);
  });
});
