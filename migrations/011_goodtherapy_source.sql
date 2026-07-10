-- Migration 011: GoodTherapy source tracking (for dedup/upsert, mirrors pt_uuid)
-- Run: psql $DATABASE_URL < migrations/011_goodtherapy_source.sql

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS gt_id            INT UNIQUE,
  ADD COLUMN IF NOT EXISTS gt_seo_friendly  TEXT;
