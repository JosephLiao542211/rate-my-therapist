/**
 * Seeds therapist data from a Psychology Today scrape into the database.
 * Clinics are only created when the location has a named locationName.
 */

import pg from "pg";
import type { PtListingEntry, PtProfileDetail, PtLocation } from "./types.js";

type TherapistData = PtListingEntry | PtProfileDetail;

function isDetailProfile(t: TherapistData): t is PtProfileDetail {
  return "languages" in t;
}

export async function seedTherapists(
  pool: pg.Pool,
  therapists: TherapistData[],
  opts: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const stats = { inserted: 0, updated: 0, skipped: 0 };

  for (const t of therapists) {
    const name = `${t.first_name} ${t.last_name}`.trim();
    const detail = isDetailProfile(t) ? t : null;

    const city       = t.location.cityName;
    const state      = t.location.regionName;
    const state_abbr = t.location.regionCode;
    const country_code = t.location.countryCode;

    const slug = await generateUniqueSlug(pool, name, city);

    if (opts.dryRun) {
      if (opts.verbose) console.log(`[dry-run] Would upsert: ${name} (${city}, ${state_abbr})`);
      stats.inserted++;
      continue;
    }

    try {
      const { rows } = await pool.query<{ id: string; slug: string; inserted: boolean }>(
        `INSERT INTO therapists (
           slug, name, specialties, city, state, state_abbr,
           bio, photo_url, phone, practice_name,
           credentials, health_role, languages,
           sliding_scale, individual_session_cost,
           telehealth, in_person, accepting_clients,
           issues, modalities, insurance_accepted,
           years_in_practice,
           education_institution, education_degree,
           pt_uuid
         ) VALUES (
           $1,$2,$3,$4,$5,$6,
           $7,$8,$9,$10,
           $11,$12,$13,
           $14,$15,
           $16,$17,$18,
           $19,$20,$21,
           $22,
           $23,$24,
           $25
         )
         ON CONFLICT (slug) DO UPDATE SET
           name                    = EXCLUDED.name,
           specialties             = EXCLUDED.specialties,
           city                    = EXCLUDED.city,
           state                   = EXCLUDED.state,
           state_abbr              = EXCLUDED.state_abbr,
           bio                     = COALESCE(EXCLUDED.bio, therapists.bio),
           photo_url               = COALESCE(EXCLUDED.photo_url, therapists.photo_url),
           phone                   = COALESCE(EXCLUDED.phone, therapists.phone),
           practice_name           = COALESCE(EXCLUDED.practice_name, therapists.practice_name),
           credentials             = EXCLUDED.credentials,
           health_role             = EXCLUDED.health_role,
           languages               = EXCLUDED.languages,
           sliding_scale           = EXCLUDED.sliding_scale,
           individual_session_cost = EXCLUDED.individual_session_cost,
           telehealth              = EXCLUDED.telehealth,
           in_person               = EXCLUDED.in_person,
           accepting_clients       = EXCLUDED.accepting_clients,
           issues                  = EXCLUDED.issues,
           modalities              = EXCLUDED.modalities,
           insurance_accepted      = EXCLUDED.insurance_accepted,
           years_in_practice       = COALESCE(EXCLUDED.years_in_practice, therapists.years_in_practice),
           education_institution   = COALESCE(EXCLUDED.education_institution, therapists.education_institution),
           education_degree        = COALESCE(EXCLUDED.education_degree, therapists.education_degree),
           pt_uuid                 = COALESCE(EXCLUDED.pt_uuid, therapists.pt_uuid)
         RETURNING id, slug, (xmax = 0) AS inserted`,
        [
          slug,
          name,
          detail?.specialties ?? [],
          city,
          state,
          state_abbr,
          t.bio,
          t.photo_url,
          t.phone,
          t.practice_name,
          t.credentials,
          t.health_role,
          detail?.languages ?? [],
          t.fees.sliding_scale,
          t.fees.individual_session_cost,
          detail?.telehealth ?? false,
          detail?.in_person ?? true,
          detail?.accepting_clients ?? true,
          detail?.specialties ?? [],
          detail?.modalities ?? [],
          detail?.insurance_accepted ?? [],
          detail?.years_in_practice ?? null,
          detail?.education?.institution ?? null,
          detail?.education?.degree ?? null,
          t.pt_uuid || null,
        ]
      );

      const row = rows[0];
      const wasInserted = (row as Record<string, unknown>).inserted === true;
      if (wasInserted) stats.inserted++; else stats.updated++;

      // ── Clinics: only add if location has a name ──
      const locationsToSeed: Array<PtLocation & { isPrimary: boolean }> = [];

      if (t.location.locationName) {
        locationsToSeed.push({ ...t.location, isPrimary: true });
      }
      if (t.secondary_location?.locationName) {
        locationsToSeed.push({ ...t.secondary_location, isPrimary: false });
      }

      for (const loc of locationsToSeed) {
        if (!row?.id) continue;
        const clinicId = await upsertClinic(pool, loc, country_code);
        if (clinicId) {
          await pool.query(
            `INSERT INTO therapist_clinics (therapist_id, clinic_id, is_primary)
             VALUES ($1,$2,$3)
             ON CONFLICT (therapist_id, clinic_id) DO UPDATE SET is_primary = EXCLUDED.is_primary`,
            [row.id, clinicId, loc.isPrimary]
          );
        }
      }

      if (opts.verbose) {
        const action = wasInserted ? "INSERT" : "UPDATE";
        const clinicCount = locationsToSeed.length;
        console.log(`[${action}] ${name} (${city}, ${state_abbr})${clinicCount ? ` +${clinicCount} clinic(s)` : ""}`);
      }
    } catch (err) {
      console.error(`Failed to seed ${name}:`, err);
      stats.skipped++;
    }
  }

  return stats;
}

async function upsertClinic(pool: pg.Pool, loc: PtLocation, defaultCountry: string): Promise<string | null> {
  // Try insert; if there's a conflict on (city, state_abbr, postal_code, name), return existing id
  const address = [loc.addressLine1, loc.addressLine2].filter(Boolean).join(", ") || null;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO clinics (name, address_line, city, state, state_abbr, country_code, postal_code, lat, lon, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      loc.locationName!,
      address,
      loc.cityName,
      loc.regionName,
      loc.regionCode || defaultCountry,
      loc.countryCode || defaultCountry,
      loc.postalCode || null,
      loc.lat || null,
      loc.lon || null,
      loc.phone || null,
    ]
  );

  if (rows[0]?.id) return rows[0].id;

  // Already existed — look it up
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM clinics WHERE name=$1 AND city=$2 AND state_abbr=$3 LIMIT 1`,
    [loc.locationName, loc.cityName, loc.regionCode || defaultCountry]
  );
  return existing.rows[0]?.id ?? null;
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
