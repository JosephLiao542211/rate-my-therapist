-- Migration 008: Therapist claim requests + general site feedback
-- Run: psql $DATABASE_URL < migrations/008_requests.sql

CREATE TABLE IF NOT EXISTS requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('claim', 'feedback')),
  therapist_id    UUID REFERENCES therapists(id) ON DELETE SET NULL,
  therapist_name  TEXT,
  name            TEXT,
  email           TEXT,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS requests_status_idx ON requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS requests_type_idx ON requests (type);
