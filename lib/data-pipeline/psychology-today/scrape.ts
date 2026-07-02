#!/usr/bin/env tsx
/**
 * Psychology Today therapist scraper
 *
 * Usage:
 *   npx tsx lib/data-pipeline/psychology-today/scrape.ts [options]
 *
 * Options:
 *   --country   ca | us                    (default: ca)
 *   --region    ontario | california ...   (URL slug for province/state)
 *   --pages     <n>                        max listing pages to scrape (default: 1)
 *   --limit     <n>                        max therapists to seed (default: 100)
 *   --profiles                             fetch each profile for rich detail
 *   --dry-run                              print what would be seeded, no DB writes
 *   --verbose                              extra logging
 *   --concurrency <n>                      parallel profile fetches (default: 3)
 *   --delay <ms>                           ms delay between requests (default: 800)
 *
 * Examples:
 *   npx tsx lib/data-pipeline/psychology-today/scrape.ts --country ca --region ontario --pages 3 --limit 60
 *   npx tsx lib/data-pipeline/psychology-today/scrape.ts --country us --region california --pages 5 --profiles
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { parseListingPage } from "./list-parser.js";
import { parseProfilePage } from "./profile-parser.js";
import { seedTherapists } from "./seed.js";
import { extractJsonLd, extractNuxtData } from "./nuxt-resolver.js";
import { HttpSession, jitter, sleep as httpSleep } from "./http.js";
import type { PtListingEntry, PtProfileDetail, ScrapeOptions } from "./types.js";

// ── Arg parsing ────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): ScrapeOptions {
  const args = argv.slice(2);
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : def;
  };
  return {
    country:       get("--country", "ca"),
    region:        get("--region", "ontario"),
    pages:         parseInt(get("--pages", "1"), 10),
    limit:         parseInt(get("--limit", "100"), 10),
    dryRun:        args.includes("--dry-run"),
    concurrency:   parseInt(get("--concurrency", "3"), 10),
  };
}

// ── Debug helpers ──────────────────────────────────────────────────────────

function debugHtml(html: string, url: string) {
  const debugDir = path.resolve("lib/data-pipeline/psychology-today/debug");
  fs.mkdirSync(debugDir, { recursive: true });

  // Save raw HTML
  const htmlFile = path.join(debugDir, "listing.html");
  fs.writeFileSync(htmlFile, html);
  console.log(`\n[debug] HTML saved → ${htmlFile} (${(html.length / 1024).toFixed(1)} KB)`);

  // JSON-LD blocks
  const ldBlocks = extractJsonLd(html);
  const ldFile = path.join(debugDir, "jsonld.json");
  fs.writeFileSync(ldFile, JSON.stringify(ldBlocks, null, 2));
  console.log(`[debug] JSON-LD blocks: ${ldBlocks.length} → ${ldFile}`);
  for (const [i, b] of ldBlocks.entries()) {
    const t = (b as Record<string, unknown>)?.["@type"];
    console.log(`         [${i}] @type = ${JSON.stringify(t)}`);
  }

  // NUXT data
  const nuxtData = extractNuxtData(html);
  if (!nuxtData) {
    console.log("[debug] __NUXT_DATA__ script tag: NOT FOUND");
    // Check what script tags exist
    const scriptTags = [...html.matchAll(/<script([^>]*)>/gi)].map(m => m[1].trim());
    console.log(`[debug] Script tags found (${scriptTags.length}):`);
    for (const t of scriptTags.slice(0, 20)) {
      console.log(`         <script ${t}>`);
    }
  } else {
    const nuxtFile = path.join(debugDir, "nuxt-data.json");
    fs.writeFileSync(nuxtFile, JSON.stringify(nuxtData.slice(0, 200), null, 2));
    console.log(`[debug] __NUXT_DATA__ length: ${nuxtData.length} entries → first 200 in ${nuxtFile}`);

    // Count how many entries look like therapist objects
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let candidates = 0;
    for (const entry of nuxtData) {
      if (
        typeof entry === "object" && entry !== null && !Array.isArray(entry) &&
        "uuid" in entry && "firstName" in entry && "lastName" in entry && "id" in entry
      ) {
        candidates++;
      }
    }
    console.log(`[debug] NUXT therapist-shaped objects: ${candidates}`);

    // Sample the first 10 object entries to show their keys
    let shown = 0;
    for (const entry of nuxtData) {
      if (typeof entry === "object" && entry !== null && !Array.isArray(entry) && shown < 10) {
        console.log(`[debug] sample obj keys: [${Object.keys(entry).join(", ")}]`);
        shown++;
      }
    }
  }
  console.log();
}

const sleep = httpSleep;

// ── Concurrency pool ───────────────────────────────────────────────────────

async function pMap<T, R>(
  items: T[],
  fn: (item: T, i: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  const verbose = process.argv.includes("--verbose");
  const debug   = process.argv.includes("--debug");
  const delayIdx = process.argv.indexOf("--delay");
  const baseDelay = delayIdx !== -1 ? parseInt(process.argv[delayIdx + 1], 10) : 2000;

  console.log("\n🔍  Psychology Today Scraper");
  console.log(`    Country:  ${opts.country.toUpperCase()}`);
  console.log(`    Region:   ${opts.region}`);
  console.log(`    Pages:    ${opts.pages}`);
  console.log(`    Limit:    ${opts.limit}`);
  console.log(`    Dry run:  ${opts.dryRun}\n`);

  if (!opts.dryRun && !process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set. Create a .env.local file or export it.");
    process.exit(1);
  }

  const session = new HttpSession(baseDelay, opts.country);
  await session.warmUp();

  // ── Collect listing entries ──

  const allEntries: PtProfileDetail[] = [];
  const baseListUrl = `https://www.psychologytoday.com/${opts.country}/therapists/${opts.region}`;

  for (let page = 1; page <= opts.pages; page++) {
    const url = page === 1 ? baseListUrl : `${baseListUrl}?page=${page}`;
    console.log(`📄  Fetching listing page ${page}/${opts.pages}: ${url}`);

    try {
      const html = await session.fetch(url);
      if (debug && page === 1) debugHtml(html, url);
      const entries = parseListingPage(html, url);
      console.log(`    Found ${entries.length} therapists on page ${page}`);
      allEntries.push(...entries);

      if (allEntries.length >= opts.limit) break;
      if (page < opts.pages) await sleep(jitter(baseDelay, baseDelay * 3));
    } catch (err) {
      console.error(`    ⚠️  Failed page ${page}:`, err);
    }
  }

  const limited = allEntries.slice(0, opts.limit);
  console.log(`\n✅  Collected ${limited.length} therapist entries`);

  // ── Enrich with profile pages (always) ──

  let toSeed: PtProfileDetail[] = limited;

  if (limited.length > 0) {
    console.log(`\n👤  Fetching ${limited.length} profile pages (concurrency=${opts.concurrency})...`);
    let done = 0;

    toSeed = await pMap(
      limited,
      async (entry, i) => {
        if (i > 0) await sleep(jitter(baseDelay, baseDelay * 2));
        try {
          const html = await session.fetch(entry.pt_url);
          const detail = parseProfilePage(html, entry);
          done++;
          if (verbose || done % 10 === 0) {
            process.stdout.write(`    [${done}/${limited.length}] ${entry.first_name} ${entry.last_name}\n`);
          }
          return detail;
        } catch (err) {
          console.warn(`    ⚠️  Profile fetch failed for ${entry.pt_url}:`, err);
          return entry;
        }
      },
      opts.concurrency
    );
  }

  // ── Seed ──

  if (opts.dryRun) {
    console.log("\n🏃  Dry run — printing what would be seeded:\n");
    for (const t of toSeed) {
      console.log(
        `  ${t.first_name} ${t.last_name} | ${t.location.cityName}, ${t.location.regionCode} | uuid=${t.pt_uuid}`
      );
    }
    console.log(`\n  Would seed ${toSeed.length} therapists.`);
    return;
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  try {
    console.log(`\n💾  Seeding ${toSeed.length} therapists into database...`);
    const stats = await seedTherapists(pool, toSeed, { verbose });
    console.log(`\n🎉  Done!`);
    console.log(`    Inserted: ${stats.inserted}`);
    console.log(`    Updated:  ${stats.updated}`);
    console.log(`    Skipped:  ${stats.skipped}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
