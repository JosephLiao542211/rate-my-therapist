-- Migration 003: Education fields, source UUID, clinic address lines
-- Run: psql $DATABASE_URL < migrations/003_education_uuid.sql

ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS pt_uuid              TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS education_institution TEXT,
  ADD COLUMN IF NOT EXISTS education_degree      TEXT;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT;
