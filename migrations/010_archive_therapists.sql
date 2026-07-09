-- Migration 010: Soft-delete (archive) therapists instead of hard DELETE
-- Run: psql $DATABASE_URL < migrations/010_archive_therapists.sql

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE therapists
  DROP CONSTRAINT IF EXISTS therapists_status_check;

ALTER TABLE therapists
  ADD CONSTRAINT therapists_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));
