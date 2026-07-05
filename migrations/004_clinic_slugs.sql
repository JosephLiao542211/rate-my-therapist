-- Migration 004: Clinic slugs for indexable /clinic/[slug] pages
-- Run: psql $DATABASE_URL < migrations/004_clinic_slugs.sql

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs for existing rows: name-city, de-duped with a numeric suffix.
WITH base AS (
  SELECT id,
         regexp_replace(
           lower(trim(both '-' from regexp_replace(coalesce(name, 'clinic') || '-' || coalesce(city, ''), '[^a-zA-Z0-9]+', '-', 'g'))),
           '-+', '-', 'g'
         ) AS base_slug
  FROM clinics
),
numbered AS (
  SELECT id, base_slug,
         row_number() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM base
)
UPDATE clinics c
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || n.rn END
FROM numbered n
WHERE c.id = n.id AND c.slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clinics_slug_idx ON clinics (slug);
