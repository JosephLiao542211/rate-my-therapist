#!/usr/bin/env tsx
/**
 * GoodTherapy therapist scraper
 *
 * Usage:
 *   npx tsx lib/data-pipeline/goodtherapy/scrape.ts [options]
 *
 * Options:
 *   --location    <query>  zip/postal code or "City, ST" to search (default: 10001)
 *   --limit       <n>      max therapists to seed (default: 50)
 *   --pages       <n>      max listing pages to fetch, 10 results/page (default: 10) —
 *                          stops when either --limit or --pages is hit, whichever first
 *   --profiles             fetch each full profile for rich detail (recommended)
 *   --concurrency <n>      parallel profile fetches, via extra browser tabs (default: 3)
 *   --dry-run              print what would be seeded, no DB writes
 *   --headless             run without a visible browser window (default: headed —
 *                          GoodTherapy's Cloudflare challenge on /next/search only
 *                          reliably clears in headed mode; headless gets stuck)
 *   --verbose               extra logging
 *
 * Examples:
 *   npx tsx lib/data-pipeline/goodtherapy/scrape.ts --location "Toronto, ON" --limit 600 --pages 20 --profiles --concurrency 4
 *   npx tsx lib/data-pipeline/goodtherapy/scrape.ts --location 10001 --dry-run
 */

import "dotenv/config";
import pg from "pg";
import { GtBrowserSession } from "./browser.js";
import { mergeProfileDetail, normalizeListingMember } from "./normalize.js";
import { seedTherapists } from "./seed.js";
import type { GtListingMember, GtProfileDetail, GtTherapistRecord, ScrapeOptions } from "./types.js";

function parseArgs(argv: string[]): ScrapeOptions {
  const args = argv.slice(2);
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : def;
  };
  return {
    location: get("--location", "10001"),
    miles: parseInt(get("--miles", "25"), 10),
    limit: parseInt(get("--limit", "50"), 10),
    pages: parseInt(get("--pages", "10"), 10),
    concurrency: parseInt(get("--concurrency", "3"), 10),
    dryRun: args.includes("--dry-run"),
    profiles: args.includes("--profiles"),
    headless: args.includes("--headless"),
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  const verbose = process.argv.includes("--verbose");

  console.log("\n🔍  GoodTherapy Scraper");
  console.log(`    Location:    ${opts.location}`);
  console.log(`    Limit:       ${opts.limit}`);
  console.log(`    Pages:       ${opts.pages}`);
  console.log(`    Profiles:    ${opts.profiles}`);
  console.log(`    Concurrency: ${opts.concurrency}`);
  console.log(`    Dry run:     ${opts.dryRun}\n`);

  if (!opts.dryRun && !process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set. Create a .env.local file or export it.");
    process.exit(1);
  }

  const session = new GtBrowserSession(opts.headless);
  await session.open();

  let members: GtListingMember[] = [];
  try {
    await session.warmUp();
    console.log(`🔎  Searching "${opts.location}" (up to ${opts.limit}, max ${opts.pages} pages)...`);
    members = await session.searchAllPages(opts.location, opts.limit, opts.pages);
    console.log(`✅  Found ${members.length} therapists`);

    let records: GtTherapistRecord[] = members.map(normalizeListingMember);

    if (opts.profiles && records.length > 0) {
      console.log(`\n👤  Fetching ${records.length} profile pages (concurrency=${opts.concurrency})...`);
      const bySeoFriendly = new Map(records.map((r) => [r.gt_seo_friendly, r]));

      await session.fetchProfilesConcurrent(
        records.map((r) => r.gt_seo_friendly),
        opts.concurrency,
        (seoFriendly, detail, done) => {
          const record = bySeoFriendly.get(seoFriendly);
          if (record && detail) {
            const merged = mergeProfileDetail(record, detail as unknown as GtProfileDetail);
            bySeoFriendly.set(seoFriendly, merged);
          }
          if (verbose || done % 5 === 0) {
            console.log(`    [${done}/${records.length}] ${seoFriendly}`);
          }
        }
      );

      records = records.map((r) => bySeoFriendly.get(r.gt_seo_friendly) ?? r);
    }

    if (opts.dryRun) {
      console.log("\n🏃  Dry run — printing what would be seeded:\n");
      for (const r of records) {
        console.log(`  ${r.first_name} ${r.last_name} | ${r.city}, ${r.state_abbr} | gt_id=${r.gt_id}`);
      }
      console.log(`\n  Would seed ${records.length} therapists.`);
      return;
    }

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    try {
      console.log(`\n💾  Seeding ${records.length} therapists into database...`);
      const stats = await seedTherapists(pool, records, { verbose });
      console.log(`\n🎉  Done!`);
      console.log(`    Inserted: ${stats.inserted}`);
      console.log(`    Updated:  ${stats.updated}`);
      console.log(`    Skipped:  ${stats.skipped}`);
    } finally {
      await pool.end();
    }
  } finally {
    await session.close();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
