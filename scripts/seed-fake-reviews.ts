/**
 * Seeds a small batch of fake anonymous reviews across a handful of
 * therapists (most therapists are left with zero reviews).
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import {
  MANIFEST_PATH,
  WORDED_REVIEWS,
  NO_DESCRIPTION_COUNT,
  randomWeightedRating,
} from "./seed-fake-reviews-data";

const MAX_WORDED_PER_THERAPIST = 2;

function deriveFlags(rating: number) {
  if (rating >= 4)
    return { would_recommend: true, felt_heard: true, helped_with_goals: true };
  if (rating === 3)
    return {
      would_recommend: null,
      felt_heard: true,
      helped_with_goals: false,
    };
  return {
    would_recommend: false,
    felt_heard: false,
    helped_with_goals: false,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomPastDate(): Date {
  const daysAgo = Math.floor(Math.random() * 300) + 1;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const wordedTherapistCount = Math.ceil(WORDED_REVIEWS.length / MAX_WORDED_PER_THERAPIST);
    const totalTherapistsNeeded = wordedTherapistCount + NO_DESCRIPTION_COUNT;

    const { rows: therapists } = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM therapists ORDER BY random() LIMIT $1`,
      [totalTherapistsNeeded],
    );

    if (therapists.length === 0) {
      console.error("No therapists found — run the therapist seed first.");
      process.exit(1);
    }

    // Non-overlapping pools: worded reviews get their own therapists,
    // no-description reviews get a separate, much larger set.
    const wordedTherapists = therapists.slice(0, wordedTherapistCount);
    const noDescriptionTherapists = therapists.slice(wordedTherapistCount);

    const insertedIds: string[] = [];

    // Round-robin over wordedTherapists caps each at MAX_WORDED_PER_THERAPIST
    // since wordedTherapistCount = ceil(WORDED_REVIEWS.length / MAX_WORDED_PER_THERAPIST).
    const shuffledWorded = shuffle(WORDED_REVIEWS);
    for (let i = 0; i < shuffledWorded.length; i++) {
      const review = shuffledWorded[i];
      const therapist = wordedTherapists[i % wordedTherapists.length];
      const flags = deriveFlags(review.rating);

      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO reviews
           (therapist_id, user_id, is_anonymous, rating, would_recommend, felt_heard,
            helped_with_goals, num_sessions, tags, body, created_at)
         VALUES ($1, NULL, true, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          therapist.id,
          review.rating,
          flags.would_recommend,
          flags.felt_heard,
          flags.helped_with_goals,
          Math.floor(Math.random() * 15) + 1,
          [],
          review.body,
          randomPastDate(),
        ],
      );
      insertedIds.push(rows[0].id);
    }

    // One rating-only (no body) review per therapist in this pool.
    for (const therapist of noDescriptionTherapists) {
      const rating = randomWeightedRating();
      const flags = deriveFlags(rating);

      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO reviews
           (therapist_id, user_id, is_anonymous, rating, would_recommend, felt_heard,
            helped_with_goals, num_sessions, tags, body, created_at)
         VALUES ($1, NULL, true, $2, $3, $4, $5, $6, $7, '', $8)
         RETURNING id`,
        [
          therapist.id,
          rating,
          flags.would_recommend,
          flags.felt_heard,
          flags.helped_with_goals,
          Math.floor(Math.random() * 15) + 1,
          [],
          randomPastDate(),
        ],
      );
      insertedIds.push(rows[0].id);
    }

    const existingManifest: string[] = fs.existsSync(MANIFEST_PATH)
      ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"))
      : [];
    fs.writeFileSync(
      MANIFEST_PATH,
      JSON.stringify([...existingManifest, ...insertedIds], null, 2),
    );

    console.log(
      `Inserted ${shuffledWorded.length} worded reviews across ${wordedTherapists.length} therapists (max ${MAX_WORDED_PER_THERAPIST} each), ` +
        `plus ${noDescriptionTherapists.length} rating-only reviews across ${noDescriptionTherapists.length} more therapists.`,
    );
    console.log(`\nTracked in ${path.relative(process.cwd(), MANIFEST_PATH)} — run "npm run db:undo-seed-reviews" to remove.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
