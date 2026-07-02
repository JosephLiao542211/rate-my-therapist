-- Migration 002: Extended therapist fields + clinics table
-- Run: psql $DATABASE_URL < migrations/002_extended_fields.sql

-- ── Extended therapist fields ──────────────────────────────────────────────

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS bio                   TEXT,
  ADD COLUMN IF NOT EXISTS photo_url             TEXT,
  ADD COLUMN IF NOT EXISTS phone                 TEXT,
  ADD COLUMN IF NOT EXISTS email                 TEXT,
  ADD COLUMN IF NOT EXISTS website               TEXT,
  ADD COLUMN IF NOT EXISTS credentials           TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS health_role           TEXT,
  ADD COLUMN IF NOT EXISTS languages             TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sliding_scale         BOOLEAN,
  ADD COLUMN IF NOT EXISTS individual_session_cost INT,
  ADD COLUMN IF NOT EXISTS telehealth            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_person             BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepting_clients     BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS issues                TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modalities            TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS insurance_accepted    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_in_practice     INT;

CREATE INDEX IF NOT EXISTS therapists_lang_idx     ON therapists USING GIN (languages);
CREATE INDEX IF NOT EXISTS therapists_issues_idx   ON therapists USING GIN (issues);
CREATE INDEX IF NOT EXISTS therapists_modality_idx ON therapists USING GIN (modalities);

-- ── Clinics table ──────────────────────────────────────────────────────────
-- A clinic/practice is a physical (or virtual) location.
-- Multiple therapists can share a clinic; one therapist can have multiple clinics.

CREATE TABLE IF NOT EXISTS clinics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  address_line TEXT,
  city         TEXT,
  state        TEXT,
  state_abbr   TEXT,
  country_code TEXT DEFAULT 'US',
  postal_code  TEXT,
  lat          NUMERIC(10, 7),
  lon          NUMERIC(10, 7),
  phone        TEXT,
  email        TEXT,
  website      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clinics_location_idx ON clinics (country_code, state_abbr, city);

-- ── Junction: therapist ↔ clinic ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS therapist_clinics (
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  clinic_id    UUID NOT NULL REFERENCES clinics(id)    ON DELETE CASCADE,
  is_primary   BOOLEAN DEFAULT true,
  PRIMARY KEY  (therapist_id, clinic_id)
);
