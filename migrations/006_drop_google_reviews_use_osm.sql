-- Migration 006: Reverses the Google-review-import part of migration 005.
--
-- Google Maps Platform's ToS prohibits persisting reviews/ratings from the
-- Places API into your own database long-term, so that pipeline was dropped
-- entirely rather than shipped. Clinic matching (the other half of 005) is
-- moving from paid Google Places to free OpenStreetMap/Nominatim, so
-- google_place_id is renamed to the more accurate osm_id.
--
-- Run: psql $DATABASE_URL < migrations/006_drop_google_reviews_use_osm.sql

DROP INDEX IF EXISTS reviews_source_dedup_idx;
ALTER TABLE reviews
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS source_review_id;

ALTER TABLE clinics
  DROP COLUMN IF EXISTS google_reviews_synced_at;

DROP INDEX IF EXISTS clinics_google_place_id_idx;
ALTER TABLE clinics RENAME COLUMN google_place_id TO osm_id;
CREATE UNIQUE INDEX IF NOT EXISTS clinics_osm_id_idx ON clinics (osm_id) WHERE osm_id IS NOT NULL;
