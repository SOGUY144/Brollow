import { describe, expect, it } from "vitest";
import { isActiveCategory } from "../categories";
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
  it("เต็นท์ finds tents and สว่าน finds drills", () => {
    expect(find("อยากเช่าเต็นท์")).toEqual(["camp-01"]);
    expect(find("หาเช่าสว่านหน่อย")).toEqual(["tool-01"]);
    expect(find("อยากเช่าเต็นท์")).not.toContain("tool-01");
  });
  it("เต็นท์งาน finds the party gazebo", () => {
    expect(find("ให้เช่าเต็นท์งาน")).toEqual(["par-01"]);
  });
  it("a filler-only search shows all active items", () => {
    const activeCount = catalog.filter((i) => isActiveCategory(i.category)).length;
    expect(find("อยากเช่าของ")).toHaveLength(activeCount);
  });
  it("unknown words don't return unrelated items", () => {
    expect(find("เช่า arduino")).toEqual([]);
  });
});
