// Downloads openly licensed demo photos from Openverse (https://openverse.org)
// and records attribution in public/images/items/credits.json.
// Usage: npm run images:fetch            (skips items that already have photos)
//        npm run images:fetch -- --force (re-download everything)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "items");
const CREDITS = path.join(OUT, "credits.json");
const ALLOWED = new Set(["cc0", "pdm", "by", "by-sa"]);
const force = process.argv.includes("--force");

// Item id -> search phrase. Images that were reviewed and did not show the
// item are listed by Openverse id in scripts/rejected-images.json.
export const QUERIES = {
  "cam-01": "canon dslr camera lens",
  "cam-02": "sony mirrorless camera",
  "cam-03": "telephoto zoom lens",
  "cam-04": "softbox studio lighting",
  "cam-05": "gopro action camera",
  "ele-01": "video projector",
  "ele-02": "dji drone",
  "ele-03": "power bank charging",
  "ele-04": "nintendo switch console",
  "camp-01": "family tent camping",
  "camp-02": "sleeping bag tent camping",
  "camp-03": "camping stove",
  "camp-04": "sit on top kayak",
  "tool-01": "cordless drill",
  "tool-02": "pressure washer",
  "tool-03": "carpet cleaner machine",
  "tool-04": "extension ladder",
  "tool-05": "circular saw power tool",
  "mus-01": "electric guitar amplifier",
  "mus-02": "digital piano keyboard",
  "mus-03": "pa system speakers",
  "mus-04": "dj controller",
  "spo-01": "road bike",
  "spo-02": "stand up paddle board",
  "spo-03": "golf bag clubs",
  "spo-04": "tennis racket balls",
  "par-01": "gazebo garden party",
  "par-02": "smoke machine fog",
  "par-03": "popcorn machine",
  "par-04": "festoon lights",
};

const REJECTED = new Set(existsSync(path.join("scripts", "rejected-images.json")) ? JSON.parse(readFileSync(path.join("scripts", "rejected-images.json"), "utf8")) : []);
const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")) : {};
mkdirSync(OUT, { recursive: true });

async function search(query) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.search = new URLSearchParams({ q: query, page_size: "20", mature: "false", license_type: "commercial,modification" }).toString();
  const res = await fetch(url, { headers: { "User-Agent": "brollow-demo-seed/1.0" } });
  if (!res.ok) throw new Error(`Openverse ${res.status} for "${query}"`);
  const data = await res.json();
  return data.results.filter((r) => {
    const ratio = r.width / r.height;
    return !REJECTED.has(r.id) && ALLOWED.has(r.license) && r.width >= 500 && ratio >= 1.05 && ratio <= 1.9;
  });
}

async function download(result, file) {
  // Openverse serves a resized thumbnail for every image; it keeps files small.
  const res = await fetch(`https://api.openverse.org/v1/images/${result.id}/thumb/?full_size=true`, {
    headers: { "User-Agent": "brollow-demo-seed/1.0" },
  });
  if (!res.ok) throw new Error(`thumb ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

for (const [itemId, query] of Object.entries(QUERIES)) {
  // Items keep photos that were reviewed; only items with none are fetched.
  if (!force && credits[itemId]?.length) continue;
  try {
    const results = await search(query);
    const picked = [];
    for (const r of results) {
      if (picked.length === 2) break;
      try {
        await download(r, path.join(OUT, `${itemId}-${picked.length + 1}.jpg`));
        picked.push({
          openverseId: r.id,
          title: r.title,
          creator: r.creator ?? "Unknown",
          license: `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim(),
          licenseUrl: r.license_url,
          source: r.foreign_landing_url,
        });
      } catch {
        // try the next candidate
      }
    }
    credits[itemId] = picked;
    console.log(`${itemId}: ${picked.length} photo(s)`);
  } catch (err) {
    console.error(`${itemId}: ${err.message}`);
  }
}

writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
