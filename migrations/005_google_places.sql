-- Migration 005: Google Places integration (clinic matching + review import)
-- Run: psql $DATABASE_URL < migrations/005_google_places.sql

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_reviews_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS clinics_google_place_id_idx
  ON clinics (google_place_id) WHERE google_place_id IS NOT NULL;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_review_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_source_dedup_idx
  ON reviews (source, source_review_id) WHERE source IS NOT NULL;
