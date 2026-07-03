# Google Places Reviews Seeding Pipeline (Plan)

## Context

The site needs real review signal on therapist profiles (currently ~9,976 profiles, nearly all with 0 reviews, which is also why most are `noindex`d as thin content). The plan is to backfill real reviews from each therapist's Google Business Profile via the Places API, matched by name/location, mirroring the existing `lib/data-pipeline/psychology-today/` scraper's architecture.

**Known and accepted risk:** Google's Places API ToS restricts long-term storage/redisplay of review content and requires "Powered by Google" attribution. This risk was flagged and the user has explicitly chosen to proceed anyway — this document is purely the technical design, not a compliance strategy.

## Architecture

Two-phase pipeline, structurally parallel to `psychology-today/`, reusing its `pg.Pool` and `jitter`/`sleep` helpers:

- **Phase A — match**: for therapists with no `google_place_id` yet, Text Search Google Places for `"{practice_name || name} {city} {state_abbr}"`, score candidates by name+city similarity, persist the best match (or a "checked, no match" marker) so re-runs don't burn API calls re-querying dead ends.
- **Phase B — seed reviews**: for therapists with a `google_place_id`, call Place Details (`fields=reviews`) and upsert the returned reviews (Google returns up to 5 "most relevant" per place) into the `reviews` table.

No cookie-jar/UA-rotation machinery is needed (that's `http.ts`'s anti-bot scaffolding for scraping HTML) — Places API is a plain authenticated JSON API, so the client is a thin fetch wrapper with exponential backoff on 429/5xx.

## New files

**`lib/data-pipeline/google-places/types.ts`** — `PlaceSearchCandidate`, `PlaceReview`, `PlaceDetails`.

**`lib/data-pipeline/google-places/client.ts`** — `PlacesClient` class wrapping `places.googleapis.com/v1`:
- `textSearch(query)` → POST `/places:searchText`, field mask `places.id,places.displayName,places.formattedAddress,places.addressComponents`
- `getReviews(placeId)` → GET `/places/{id}`, field mask `id,reviews`
- Retry loop with jittered exponential backoff on 429/5xx (reuse `sleep`/`jitter` imported from `../psychology-today/http.ts`, don't duplicate).

**`lib/data-pipeline/google-places/match.ts`**:
- `buildQuery(therapist)` → tries `practice_name` first (more reliable for solo practitioners with a GBP listing), falls back to `name`.
- `scoreCandidate(therapist, candidate)` → Jaccard token-overlap similarity on name (0.7 weight) + city-substring match (0.3 weight). No fuzzy-match npm dependency needed for a first cut — zero-dep, easy to tune.
- `MATCH_THRESHOLD = 0.55` (tune via `--dry-run` on a test batch before running for real).
- `findBestMatch(client, therapist)` → tries each query variant, returns best candidate above threshold or `null`.

**`lib/data-pipeline/google-places/seed.ts`**:
- `seedPlaceMatch(pool, therapistId, match, opts)` → `UPDATE therapists SET google_place_id = $1, google_place_checked_at = NOW() WHERE id = $2`. Always stamps `google_place_checked_at` (even on no-match) — this is the key mechanism that prevents re-querying already-checked, non-matching therapists on every run.
- `seedGoogleReviews(pool, therapistId, reviews, opts)` → per review, `INSERT INTO reviews (therapist_id, source, external_author_name, rating, body, created_at) VALUES (..., 'google', ...) ON CONFLICT (therapist_id, source, external_author_name, created_at) DO UPDATE SET rating=EXCLUDED.rating, body=EXCLUDED.body`. Uses `new Date(review.publishTime)` (Google's actual review timestamp), not `now()`.

**`scripts/seed-google-reviews.ts`** — CLI entrypoint mirroring `scrape.ts`'s arg style:
```
--limit <n>          max therapists to process (default: 50)
--concurrency <n>    parallel API calls (default: 2)
--delay <ms>         base delay between calls (default: 500)
--force              re-match therapists already checked
--dry-run            no DB writes
--verbose            per-therapist logging
--phase <match|reviews|both>   (default: both)
```
Runs Phase A query (`WHERE google_place_id IS NULL AND (google_place_checked_at IS NULL OR $force)`) then Phase B query (`WHERE google_place_id IS NOT NULL`), each through a small local `pMap` concurrency helper (same pattern already duplicated between `scrape.ts`/`scrape-all.ts` — following existing precedent rather than introducing a shared util).

Add to `package.json`: `"seed:google-reviews": "tsx --env-file=.env.local scripts/seed-google-reviews.ts"`.

## Migration: `migrations/004_google_places.sql`

```sql
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS google_place_id        TEXT,
  ADD COLUMN IF NOT EXISTS google_place_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS therapists_google_place_idx ON therapists (google_place_id);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source                TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS external_author_name   TEXT;

-- Partial unique index: only Google-sourced rows participate in the dedup
-- constraint (NULL != NULL in Postgres unique indexes, so ordinary user
-- reviews with external_author_name IS NULL never collide with each other).
CREATE UNIQUE INDEX IF NOT EXISTS reviews_google_dedup_idx
  ON reviews (therapist_id, source, external_author_name, created_at)
  WHERE source = 'google';

CREATE INDEX IF NOT EXISTS reviews_source_idx ON reviews (source);
```

Run via the existing `npm run db:migrate` (tracked in `schema_migrations`, same as `002`/`003`).

`is_anonymous` stays untouched/default-`false` for Google rows — it's for local anonymous user submissions, not external provenance. `source='google'` + `user_id IS NULL` + `external_author_name IS NOT NULL` is the full signal.

The existing `reviews_stats_trigger` (fires on any INSERT/UPDATE/DELETE to `reviews`) automatically recalculates `therapists.avg_rating`/`review_count` — no extra stats logic needed.

## One follow-up app-layer fix (small, do it in the same PR)

`lib/reviews.ts`'s `getReviewsByTherapist` currently does `LEFT JOIN users u ... u.name AS author_name`. Once Google-sourced rows exist (`user_id IS NULL`), the author name would render blank. Change the select to `COALESCE(u.name, r.external_author_name) AS author_name` — one line, otherwise the seeded reviews are invisible/anonymous-looking on the actual page.

## Env vars

Add to `.env.local.example`:
```
# Google Places API (New) — https://console.cloud.google.com/apis/library/places.googleapis.com
GOOGLE_PLACES_API_KEY=
```

**Manual steps for the user (not automatable):**
1. Create/select a GCP project, enable billing.
2. Enable **"Places API (New)"** (distinct from the legacy Places API).
3. Create an API key, restricted to Places API (New) (server-side batch job — no need for a browser-restricted key).
4. Paste it into `.env.local` as `GOOGLE_PLACES_API_KEY`. (Only add to Vercel's env store if this ever needs to run from a Function/Cron rather than locally.)

## Cost/rate-control defaults

- Defaults: `--limit 50 --concurrency 2 --delay 500` — a first test batch costs cents, not dollars.
- Recommended rollout order: run `--phase match --limit 200 --dry-run --verbose` first to tune `MATCH_THRESHOLD` against real data, then run Phase A for real in checkpointed batches (safe to re-run — already-checked therapists are skipped via `google_place_checked_at`), inspect match quality on a sample, only then run `--phase reviews` at scale.
- Both phases are billed separately per Google's SKU model; running unrestricted across all ~9,976 therapists is a real cost — always test with `--limit` first.

## Verification

1. `npm run db:migrate` — confirm `004_google_places.sql` applies cleanly (idempotent `ADD COLUMN IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS`, safe to re-run).
2. `npm run seed:google-reviews -- --phase match --limit 10 --dry-run --verbose` — confirm sensible match/no-match output before any DB writes or API spend beyond Phase A.
3. `npm run seed:google-reviews -- --phase match --limit 10 --verbose` — real run, then `SELECT name, google_place_id, google_place_checked_at FROM therapists WHERE google_place_checked_at IS NOT NULL LIMIT 10;` to confirm persistence.
4. `npm run seed:google-reviews -- --phase reviews --limit 5 --verbose` — confirm reviews land: `SELECT * FROM reviews WHERE source='google';` and confirm `therapists.avg_rating`/`review_count` updated via the trigger.
5. Re-run the same batch again — confirm idempotency (no duplicate rows, `stats.updated` increments instead of `stats.inserted`).
6. Load `/therapist/<a-seeded-slug>` in the browser (or `curl`) and confirm the seeded review renders with a visible author name (validates the `COALESCE` fix in `lib/reviews.ts`).
