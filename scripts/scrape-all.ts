#!/usr/bin/env tsx
/**
 * Scrapes ALL therapists from Psychology Today — every Canadian province
 * and every US state, paginating until exhausted.
 *
 * Usage:
 *   npm run scrape:all
 *   npm run scrape:all -- --country ca          (Canada only)
 *   npm run scrape:all -- --country us          (USA only)
 *   npm run scrape:all -- --delay 1500 --concurrency 2
 *   npm run scrape:all -- --dry-run
 */

import "dotenv/config";
import pg from "pg";
import { parseListingPage, extractNextPageUrl } from "../lib/data-pipeline/psychology-today/list-parser.js";
import { parseProfilePage } from "../lib/data-pipeline/psychology-today/profile-parser.js";
import { seedTherapists } from "../lib/data-pipeline/psychology-today/seed.js";
import { HttpSession, jitter, sleep } from "../lib/data-pipeline/psychology-today/http.js";
import type { PtProfileDetail } from "../lib/data-pipeline/psychology-today/types.js";

// ── Region lists ────────────────────────────────────────────────────────────

const CA_PROVINCES = [
  "alberta",
  "british-columbia",
  "manitoba",
  "new-brunswick",
  "newfoundland-and-labrador",
  "northwest-territories",
  "nova-scotia",
  "nunavut",
  "ontario",
  "prince-edward-island",
  "quebec",
  "saskatchewan",
  "yukon",
];

const US_STATES = [
  "alabama", "alaska", "arizona", "arkansas", "california",
  "colorado", "connecticut", "delaware", "district-of-columbia",
  "florida", "georgia", "hawaii", "idaho", "illinois", "indiana",
  "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland",
  "massachusetts", "michigan", "minnesota", "mississippi", "missouri",
  "montana", "nebraska", "nevada", "new-hampshire", "new-jersey",
  "new-mexico", "new-york", "north-carolina", "north-dakota", "ohio",
  "oklahoma", "oregon", "pennsylvania", "rhode-island", "south-carolina",
  "south-dakota", "tennessee", "texas", "utah", "vermont", "virginia",
  "washington", "west-virginia", "wisconsin", "wyoming",
];

// ── Arg parsing ─────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const getArg = (flag: string, def: string) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
};

const COUNTRY     = getArg("--country", "both");   // "ca" | "us" | "both"
const DELAY       = parseInt(getArg("--delay", "1000"), 10);
const CONCURRENCY = parseInt(getArg("--concurrency", "3"), 10);
const DRY_RUN     = argv.includes("--dry-run");
const VERBOSE     = argv.includes("--verbose");

// ── Concurrency pool ─────────────────────────────────────────────────────────

async function pMap<T, R>(
  items: T[],
  fn: (item: T, i: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const worker = async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ── Region scraper ───────────────────────────────────────────────────────────

async function scrapeRegion(
  session: HttpSession,
  pool: pg.Pool,
  country: string,
  region: string,
  totals: { inserted: number; updated: number; skipped: number }
) {
  const base = `https://www.psychologytoday.com/${country}/therapists/${region}`;
  let currentUrl: string | null = base;
  let page = 0;

  while (currentUrl) {
    page++;
    process.stdout.write(`  [${country.toUpperCase()}/${region}] page ${page} → ${currentUrl}\n`);

    let html: string;
    try {
      ({ html } = await session.fetch(currentUrl));
    } catch (err) {
      console.error(`  ⚠️  Fetch failed: ${err}`);
      break;
    }

    const entries = parseListingPage(html, currentUrl);
    process.stdout.write(`    ${entries.length} therapists found on listing page\n`);

    if (entries.length === 0) break;

    // Fetch all profile pages with jittered delays
    const enriched = await pMap(
      entries,
      async (entry, i): Promise<PtProfileDetail> => {
        if (i > 0) await sleep(jitter(DELAY, DELAY * 2));
        try {
          const { html: profileHtml } = await session.fetch(entry.pt_url);
          return parseProfilePage(profileHtml, entry);
        } catch {
          return entry;
        }
      },
      CONCURRENCY
    );

    if (DRY_RUN) {
      for (const t of enriched) {
        console.log(`  [dry-run] ${t.first_name} ${t.last_name} | ${t.location.cityName} | specialties=${t.specialties.length}`);
      }
      totals.inserted += enriched.length;
    } else {
      const stats = await seedTherapists(pool, enriched, { verbose: VERBOSE });
      totals.inserted += stats.inserted;
      totals.updated  += stats.updated;
      totals.skipped  += stats.skipped;
      process.stdout.write(`    seeded → +${stats.inserted} new, ~${stats.updated} updated, ${stats.skipped} skipped\n`);
    }

    // Next page
    const next = extractNextPageUrl(html, currentUrl);
    if (!next) break;

    currentUrl = next;
    await sleep(jitter(DELAY, DELAY * 3));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!DRY_RUN && !process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set.");
    process.exit(1);
  }

  const regions: Array<{ country: string; region: string }> = [];

  if (COUNTRY === "ca" || COUNTRY === "both") {
    for (const r of CA_PROVINCES) regions.push({ country: "ca", region: r });
  }
  if (COUNTRY === "us" || COUNTRY === "both") {
    for (const r of US_STATES) regions.push({ country: "us", region: r });
  }

  const totalRegions = regions.length;
  console.log(`\n🌎  Scraping ${totalRegions} regions (delay=${DELAY}ms, concurrency=${CONCURRENCY}, dry-run=${DRY_RUN})\n`);

  const pool = DRY_RUN ? null : new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const totals = { inserted: 0, updated: 0, skipped: 0 };

  // Group regions by country so we can warm up a fresh session per country block
  let session = new HttpSession(DELAY);
  let currentCountry = "";

  for (let i = 0; i < regions.length; i++) {
    const { country, region } = regions[i];
    console.log(`\n[${i + 1}/${totalRegions}] ${country.toUpperCase()} — ${region}`);

    // Fresh session when country changes (or at start) → new proxy target country + new IP
    if (country !== currentCountry) {
      session = new HttpSession(DELAY, country);
      await session.warmUp();
      currentCountry = country;
    }

    try {
      await scrapeRegion(session, pool!, country, region, totals);
    } catch (err) {
      console.error(`  ❌  Region failed: ${err}`);
    }

    // Randomised pause between regions
    if (i < regions.length - 1) {
      const pause = jitter(DELAY * 2, DELAY * 5);
      process.stdout.write(`  [pause] ${(pause / 1000).toFixed(1)}s before next region\n`);
      await sleep(pause);
    }
  }

  if (pool) await pool.end();

  console.log(`\n✅  All done!`);
  console.log(`    Inserted: ${totals.inserted}`);
  console.log(`    Updated:  ${totals.updated}`);
  console.log(`    Skipped:  ${totals.skipped}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
