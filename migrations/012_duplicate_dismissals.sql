-- Migration 012: Duplicate-flag dismissals for the admin "Duplicate Flags" tab.
-- Lets an admin mark a flagged pair as "not a duplicate" so it stops resurfacing.
-- Run: psql $DATABASE_URL < migrations/012_duplicate_dismissals.sql

CREATE TABLE IF NOT EXISTS duplicate_dismissals (
  therapist_id_a UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  therapist_id_b UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  dismissed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  dismissed_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (therapist_id_a, therapist_id_b),
  CHECK (therapist_id_a < therapist_id_b)
);
