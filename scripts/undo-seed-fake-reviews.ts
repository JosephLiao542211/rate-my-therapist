/**
 * Removes reviews inserted by seed-fake-reviews.ts.
 *
 * Uses the manifest written by that script when available. If no manifest
 * exists (e.g. reviews were seeded before manifest tracking was added),
 * falls back to matching the known worded-seed bodies among anonymous,
 * no-user reviews. The fallback intentionally does NOT touch rating-only
 * (empty body) reviews, since a genuine empty-body review can't be
 * distinguished from a seeded one by content alone — always prefer the
 * manifest path.
 */

import "dotenv/config";
import fs from "fs";
import pg from "pg";
import { MANIFEST_PATH, WORDED_REVIEWS } from "./seed-fake-reviews-data";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hasManifest = fs.existsSync(MANIFEST_PATH);
    const ids: string[] = hasManifest
      ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"))
      : [];

    let result;
    if (ids.length > 0) {
      result = await pool.query(`DELETE FROM reviews WHERE id = ANY($1)`, [ids]);
    } else {
      console.log("No manifest found — falling back to matching known worded seed review bodies.");
      const bodies = WORDED_REVIEWS.map((r) => r.body);
      result = await pool.query(
        `DELETE FROM reviews WHERE is_anonymous = true AND user_id IS NULL AND body = ANY($1)`,
        [bodies],
      );
    }

    if (hasManifest) fs.unlinkSync(MANIFEST_PATH);

    console.log(`Deleted ${result.rowCount ?? 0} fake review(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
