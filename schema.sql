-- Rate My Therapist — Database Schema
-- Run once against your PostgreSQL database

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Therapists
CREATE TABLE IF NOT EXISTS therapists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  specialties   TEXT[] DEFAULT '{}',
  city          TEXT,
  state         TEXT,
  state_abbr    TEXT,
  practice_name TEXT,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  review_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS therapists_location_idx ON therapists (state_abbr, city);
CREATE INDEX IF NOT EXISTS therapists_specialties_idx ON therapists USING GIN (specialties);
CREATE INDEX IF NOT EXISTS therapists_slug_idx ON therapists (slug);

-- Users (Auth.js will also create accounts/sessions/verification_tokens)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auth.js required tables
CREATE TABLE IF NOT EXISTS accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId"       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id      UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous      BOOLEAN DEFAULT false,
  rating            INT CHECK (rating BETWEEN 1 AND 5),
  would_recommend   BOOLEAN,
  felt_heard        BOOLEAN,
  helped_with_goals BOOLEAN,
  num_sessions      INT,
  tags              TEXT[] DEFAULT '{}',
  body              TEXT NOT NULL,
  helpful_count     INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_therapist_idx ON reviews (therapist_id, created_at DESC);

-- Helpful votes (one per user per review)
CREATE TABLE IF NOT EXISTS review_votes (
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  PRIMARY KEY (review_id, user_id)
);

-- Trigger: keep avg_rating and review_count in sync on therapists
CREATE OR REPLACE FUNCTION update_therapist_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE therapists
  SET
    avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id))
  WHERE id = COALESCE(NEW.therapist_id, OLD.therapist_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_stats_trigger ON reviews;
CREATE TRIGGER reviews_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_therapist_stats();
