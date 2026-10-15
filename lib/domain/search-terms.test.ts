import { describe, expect, it } from "vitest";
import { seedItems } from "../data/seed";
import type { ItemSummary } from "../types";
import { EMPTY_FILTERS, searchItems } from "./search";
import { parseQuery } from "./search-terms";

const catalog: ItemSummary[] = seedItems().map((i) => ({ ...i, owner: null, rating: null, reviewCount: 0 }));
const find = (q: string) => searchItems(catalog, { ...EMPTY_FILTERS, q }, []).map((i) => i.id);

describe("how people phrase a search", () => {
  it("ignores 'I want to rent' wording in Thai and English", () => {
    expect(parseQuery("อยากเช่ากล้อง")).toEqual([["camera", "gopro", "lens"]]);
    expect(parseQuery("I want to rent a projector")).toEqual([["projector"]]);
    expect(parseQuery("อยากเช่าของ")).toEqual([]);
  });
  it("understands plurals", () => {
    expect(parseQuery("cameras")).toEqual([["camera", "gopro", "lens"]]);
  });
  it("prefers the longer Thai word", () => {
    expect(parseQuery("เช่าเต็นท์งาน")).toEqual([["gazebo"]]);
  });
});

describe("Thai searches find English listings", () => {
  it("กล้อง finds cameras", () => {
    expect(find("อยากเช่ากล้อง")).toEqual(expect.arrayContaining(["cam-01", "cam-02", "cam-05"]));
    expect(find("อยากเช่ากล้อง")).not.toContain("tool-01");
  });
  it("เต็นท์ finds the tent and สว่าน finds the drill", () => {
    expect(find("เช่าเต็นท์")).toContain("camp-01");
    expect(find("หาเช่าสว่านหน่อย")).toEqual(["tool-01"]);
  });
  it("โปรเจกเตอร์ finds the projector", () => {
    expect(find("ให้เช่าโปรเจกเตอร์")).toEqual(["ele-01"]);
  });
  it("a filler-only search shows everything", () => {
    expect(find("อยากเช่าของ")).toHaveLength(catalog.length);
  });
  it("unknown words don't return unrelated items", () => {
    expect(find("เช่า arduino")).toEqual([]);
  });
});
