-- Migration 009: Blog posts (SEO/backlink content, managed via /admin/blog)
-- Run: psql $DATABASE_URL < migrations/009_blog.sql

CREATE TABLE IF NOT EXISTS posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT NOT NULL,
  cover_image_url TEXT,
  tags          TEXT[] DEFAULT '{}',
  author_name   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS posts_status_idx ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);
