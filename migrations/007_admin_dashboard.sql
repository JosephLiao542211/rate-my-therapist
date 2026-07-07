-- Migration 007: Admin dashboard — user roles, therapist approval workflow, audit log
-- Run: psql $DATABASE_URL < migrations/007_admin_dashboard.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

-- Backfill: rows created before this migration are already live on the site.
UPDATE therapists SET status = 'approved' WHERE status IS NULL;

ALTER TABLE therapists
  ADD CONSTRAINT therapists_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS therapists_status_idx ON therapists (status);

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email    TEXT,
  action         TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      TEXT,
  entity_label   TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);

-- Promote yourself: UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
