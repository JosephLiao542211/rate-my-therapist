/**
 * Seeds therapist data scraped from GoodTherapy into the database.
 *
 * Dedup has two layers:
 *  1. gt_id — re-running the same GoodTherapy member always updates the same row.
 *  2. name + city + state_abbr — a heuristic cross-source match so a therapist
 *     already seeded from Psychology Today (or a prior GoodTherapy run under a
 *     slightly different gt_id) doesn't get a duplicate row; we attach gt_id to
 *     the existing therapist instead of inserting a new one.
 *
 * Clinics: GoodTherapy rarely gives a named practice, so clinics are matched/
 * created off address + city + state_abbr (falling back to a null clinic name)
 * rather than requiring a locationName like the Psychology Today pipeline does.
 * Existing clinics (e.g. seeded from Psychology Today) are reused when the
 * address matches, same as PT's upsertClinic.
 */

import pg from "pg";
import type { GtTherapistRecord } from "./types.js";

const CANADIAN_PROVINCES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
]);

function countryForState(stateAbbr: string): string {
  return CANADIAN_PROVINCES.has(stateAbbr.toUpperCase()) ? "CA" : "US";
}

export async function seedTherapists(
  pool: pg.Pool,
  therapists: GtTherapistRecord[],
  opts: { verbose?: boolean } = {}
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const stats = { inserted: 0, updated: 0, skipped: 0 };

  for (const t of therapists) {
    const name = `${t.first_name} ${t.last_name}`.trim();

    try {
      const existingId = await findExistingTherapistId(pool, t, name);
      let therapistId: string;
      let wasInserted: boolean;

      if (existingId) {
        await pool.query(
          `UPDATE therapists SET
             name                    = $1,
             specialties             = $2,
             city                    = $3,
             state                   = $4,
             state_abbr              = $5,
             bio                     = COALESCE($6, bio),
             photo_url               = COALESCE($7, photo_url),
             phone                   = COALESCE($8, phone),
             credentials             = $9,
             health_role             = $10,
             languages               = $11,
             sliding_scale           = $12,
             individual_session_cost = COALESCE($13, individual_session_cost),
             telehealth              = $14,
             in_person               = $15,
             accepting_clients       = $16,
             issues                  = $17,
             modalities              = $18,
             insurance_accepted      = $19,
             website                 = COALESCE($20, website),
             email                   = COALESCE($21, email),
             gt_id                   = COALESCE(gt_id, $22),
             gt_seo_friendly         = $23
           WHERE id = $24`,
          [
            name, t.specialties, t.city, t.state, t.state_abbr,
            t.bio, t.photo_url, t.phone, t.credentials, t.health_role, t.languages,
            t.sliding_scale, t.individual_session_cost,
            t.telehealth, t.in_person, t.accepting_clients,
            t.specialties, t.modalities, t.insurance_accepted,
            t.website, t.email,
            t.gt_id, t.gt_seo_friendly,
            existingId,
          ]
        );
        therapistId = existingId;
        wasInserted = false;
      } else {
        const slug = await generateUniqueSlug(pool, name, t.city);
        const { rows } = await pool.query<{ id: string }>(
          `INSERT INTO therapists (
             slug, name, specialties, city, state, state_abbr,
             bio, photo_url, phone, credentials, health_role, languages,
             sliding_scale, individual_session_cost,
             telehealth, in_person, accepting_clients,
             issues, modalities, insurance_accepted,
             website, email,
             gt_id, gt_seo_friendly
           ) VALUES (
             $1,$2,$3,$4,$5,$6,
             $7,$8,$9,$10,$11,$12,
             $13,$14,
             $15,$16,$17,
             $18,$19,$20,
             $21,$22,
             $23,$24
           )
           RETURNING id`,
          [
            slug, name, t.specialties, t.city, t.state, t.state_abbr,
            t.bio, t.photo_url, t.phone, t.credentials, t.health_role, t.languages,
            t.sliding_scale, t.individual_session_cost,
            t.telehealth, t.in_person, t.accepting_clients,
            t.specialties, t.modalities, t.insurance_accepted,
            t.website, t.email,
            t.gt_id, t.gt_seo_friendly,
          ]
        );
        therapistId = rows[0].id;
        wasInserted = true;
      }

      if (wasInserted) stats.inserted++; else stats.updated++;

      let clinicNote = "";
      if (t.address_line) {
        const clinicId = await upsertClinic(pool, t);
        if (clinicId) {
          await pool.query(
            `INSERT INTO therapist_clinics (therapist_id, clinic_id, is_primary)
             VALUES ($1,$2,true)
             ON CONFLICT (therapist_id, clinic_id) DO UPDATE SET is_primary = EXCLUDED.is_primary`,
            [therapistId, clinicId]
          );
          clinicNote = " +clinic";
        }
      }

      if (opts.verbose) {
        console.log(`[${wasInserted ? "INSERT" : "UPDATE"}] ${name} (${t.city}, ${t.state_abbr})${clinicNote}`);
      }
    } catch (err) {
      console.error(`Failed to seed ${name}:`, err);
      stats.skipped++;
    }
  }

  return stats;
}

/** gt_id match first (same source record); otherwise a heuristic name+city+state match against any source. */
async function findExistingTherapistId(
  pool: pg.Pool,
  t: GtTherapistRecord,
  name: string
): Promise<string | null> {
  const byGtId = await pool.query<{ id: string }>("SELECT id FROM therapists WHERE gt_id = $1", [t.gt_id]);
  if (byGtId.rows[0]?.id) return byGtId.rows[0].id;

  if (!t.city) return null;

  // state_abbr is usually present and narrows the match, but a gap in upstream
  // parsing shouldn't silently disable cross-source dedup entirely — fall back
  // to name+city alone rather than bailing out when it's missing.
  const byNameCity = await pool.query<{ id: string }>(
    `SELECT id FROM therapists
     WHERE lower(name) = lower($1) AND lower(city) = lower($2)
       AND ($3 = '' OR state_abbr = $3)
       AND archived_at IS NULL
     LIMIT 1`,
    [name, t.city, t.state_abbr]
  );
  return byNameCity.rows[0]?.id ?? null;
}

async function upsertClinic(pool: pg.Pool, t: GtTherapistRecord): Promise<string | null> {
  const address = t.address_line!.trim();

  const { rows: existing } = await pool.query<{ id: string }>(
    `SELECT id FROM clinics WHERE lower(address_line) = lower($1) AND lower(city) = lower($2) AND state_abbr = $3 LIMIT 1`,
    [address, t.city, t.state_abbr]
  );
  if (existing[0]?.id) return existing[0].id;

  const slug = await generateUniqueClinicSlug(pool, address, t.city);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO clinics (slug, name, address_line, city, state, state_abbr, country_code, postal_code, lat, lon, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      slug,
      null,
      address,
      t.city,
      t.state,
      t.state_abbr,
      countryForState(t.state_abbr),
      t.postal_code,
      t.lat,
      t.lon,
      t.phone,
    ]
  );
  if (rows[0]?.id) return rows[0].id;

  const { rows: raceWinner } = await pool.query<{ id: string }>(
    `SELECT id FROM clinics WHERE lower(address_line) = lower($1) AND lower(city) = lower($2) AND state_abbr = $3 LIMIT 1`,
    [address, t.city, t.state_abbr]
  );
  return raceWinner[0]?.id ?? null;
}

async function generateUniqueClinicSlug(pool: pg.Pool, address: string, city: string): Promise<string> {
  const base = `${address}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = base;
  let suffix = 2;
  while (true) {
    const { rows } = await pool.query("SELECT 1 FROM clinics WHERE slug = $1", [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

async function generateUniqueSlug(pool: pg.Pool, name: string, city: string): Promise<string> {
  const base = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = base;
  let suffix = 2;
  while (true) {
    const { rows } = await pool.query("SELECT 1 FROM therapists WHERE slug = $1", [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}
