import pool from "./db";
import { SPECIALTIES } from "./constants";

export interface Therapist {
  id: string;
  slug: string;
  name: string;
  specialties: string[];
  city: string | null;
  state: string | null;
  state_abbr: string | null;
  practice_name: string | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
  // Extended fields (migration 002)
  bio: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  credentials: string[];
  health_role: string | null;
  languages: string[];
  sliding_scale: boolean | null;
  individual_session_cost: number | null;
  telehealth: boolean;
  in_person: boolean;
  accepting_clients: boolean;
  issues: string[];
  modalities: string[];
  insurance_accepted: string[];
  years_in_practice: number | null;
  pt_uuid: string | null;
  education_institution: string | null;
  education_degree: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface Clinic {
  id: string;
  slug: string | null;
  name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  state_abbr: string | null;
  country_code: string;
  postal_code: string | null;
  lat: number | null;
  lon: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_primary: boolean;
}

export async function getTherapistBySlug(slug: string): Promise<Therapist | null> {
  const { rows } = await pool.query<Therapist>(
    "SELECT * FROM therapists WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function searchTherapists(opts: {
  q?: string;
  state?: string;
  city?: string;
  specialty?: string;
  limit?: number;
  offset?: number;
}): Promise<{ therapists: Therapist[]; total: number }> {
  const { q, state, city, specialty, limit = 20, offset = 0 } = opts;

  const conditions: string[] = ["status = 'approved'"];
  const values: (string | number)[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(name ILIKE $${idx} OR practice_name ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }
  if (state) {
    conditions.push(`state_abbr = $${idx}`);
    values.push(state.toUpperCase());
    idx++;
  }
  if (city) {
    conditions.push(`city ILIKE $${idx}`);
    values.push(city);
    idx++;
  }
  if (specialty) {
    conditions.push(`$${idx} = ANY(specialties)`);
    values.push(specialty);
    idx++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM therapists ${where}`,
    values
  );

  const dataRes = await pool.query<Therapist>(
    `SELECT * FROM therapists ${where}
     ORDER BY review_count DESC, avg_rating DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return {
    therapists: dataRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
}

export async function getTherapistsByLocation(
  state_abbr: string,
  city?: string
): Promise<Therapist[]> {
  if (city) {
    const { rows } = await pool.query<Therapist>(
      "SELECT * FROM therapists WHERE state_abbr = $1 AND city ILIKE $2 AND status = 'approved' ORDER BY avg_rating DESC",
      [state_abbr.toUpperCase(), city]
    );
    return rows;
  }
  const { rows } = await pool.query<Therapist>(
    "SELECT * FROM therapists WHERE state_abbr = $1 AND status = 'approved' ORDER BY avg_rating DESC LIMIT 50",
    [state_abbr.toUpperCase()]
  );
  return rows;
}

export async function getTherapistsBySpecialty(specialty: string): Promise<Therapist[]> {
  const { rows } = await pool.query<Therapist>(
    "SELECT * FROM therapists WHERE $1 = ANY(specialties) AND status = 'approved' ORDER BY avg_rating DESC LIMIT 50",
    [specialty]
  );
  return rows;
}

export async function getTherapistsByLocationAndSpecialty(
  state_abbr: string,
  city: string,
  specialty: string
): Promise<Therapist[]> {
  const { rows } = await pool.query<Therapist>(
    `SELECT * FROM therapists
     WHERE state_abbr = $1 AND city ILIKE $2 AND $3 = ANY(specialties) AND status = 'approved'
     ORDER BY avg_rating DESC`,
    [state_abbr.toUpperCase(), city, specialty]
  );
  return rows;
}

// Restricted to the curated SPECIALTIES list (not raw DB tags, which include
// hundreds of free-text values like "Adults" or "Coping Skills") — otherwise
// this cross product explodes into tens of thousands of thin combo pages.
export async function getLocationSpecialtyCombos(): Promise<
  { state_abbr: string; city: string; specialty: string }[]
> {
  const { rows } = await pool.query<{ state_abbr: string; city: string; specialty: string }>(
    `SELECT DISTINCT state_abbr, city, unnest(specialties) AS specialty
     FROM therapists
     WHERE state_abbr IS NOT NULL AND city IS NOT NULL AND status = 'approved'
       AND specialties && $1`,
    [SPECIALTIES]
  );
  return rows.filter((r) => SPECIALTIES.includes(r.specialty));
}

export async function getAllLocations(): Promise<{ state_abbr: string; state: string; city: string }[]> {
  const { rows } = await pool.query<{ state_abbr: string; state: string; city: string }>(
    `SELECT DISTINCT state_abbr, state, city FROM therapists
     WHERE state_abbr IS NOT NULL AND city IS NOT NULL AND status = 'approved'
     ORDER BY state_abbr, city`
  );
  return rows;
}

export async function getTopLocations(limit = 12): Promise<{ state_abbr: string; city: string; count: number }[]> {
  const { rows } = await pool.query<{ state_abbr: string; city: string; count: string }>(
    `SELECT state_abbr, city, COUNT(*) AS count FROM therapists
     WHERE state_abbr IS NOT NULL AND city IS NOT NULL AND status = 'approved'
     GROUP BY state_abbr, city
     ORDER BY count DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({ ...r, count: parseInt(r.count, 10) }));
}

export async function getAllSpecialties(): Promise<string[]> {
  const { rows } = await pool.query<{ specialty: string }>(
    "SELECT DISTINCT unnest(specialties) AS specialty FROM therapists WHERE status = 'approved' ORDER BY specialty"
  );
  return rows.map((r) => r.specialty);
}

export async function getAllTherapistSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    "SELECT slug FROM therapists WHERE status = 'approved'"
  );
  return rows.map((r) => r.slug);
}

// ── Admin: approval workflow ────────────────────────────────────────────────

export async function getPendingTherapists(): Promise<Therapist[]> {
  const { rows } = await pool.query<Therapist>(
    "SELECT * FROM therapists WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return rows;
}

export async function setTherapistStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<Therapist | null> {
  const { rows } = await pool.query<Therapist>(
    "UPDATE therapists SET status = $2 WHERE id = $1 RETURNING *",
    [id, status]
  );
  return rows[0] ?? null;
}

export async function getClinicsForTherapist(therapist_id: string): Promise<Clinic[]> {
  const { rows } = await pool.query<Clinic>(
    `SELECT c.*, tc.is_primary
     FROM clinics c
     JOIN therapist_clinics tc ON tc.clinic_id = c.id
     WHERE tc.therapist_id = $1
     ORDER BY tc.is_primary DESC`,
    [therapist_id]
  );
  return rows;
}

export async function createTherapist(data: {
  name: string;
  specialties: string[];
  city: string;
  state: string;
  state_abbr: string;
  practice_name?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  credentials?: string[];
  languages?: string[];
  telehealth?: boolean;
  in_person?: boolean;
  sliding_scale?: boolean;
  individual_session_cost?: number;
  modalities?: string[];
  issues?: string[];
  insurance_accepted?: string[];
  years_in_practice?: number;
  accepting_clients?: boolean;
}): Promise<Therapist> {
  const slug = await generateUniqueSlug(data.name, data.city);
  const { rows } = await pool.query<Therapist>(
    `INSERT INTO therapists (
       slug, name, specialties, city, state, state_abbr, practice_name,
       bio, phone, email, website, credentials, languages,
       telehealth, in_person, sliding_scale, individual_session_cost,
       modalities, issues, insurance_accepted, years_in_practice, accepting_clients,
       status
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       $8,$9,$10,$11,$12,$13,
       $14,$15,$16,$17,
       $18,$19,$20,$21,$22,
       'pending'
     )
     RETURNING *`,
    [
      slug, data.name, data.specialties, data.city, data.state, data.state_abbr.toUpperCase(), data.practice_name ?? null,
      data.bio ?? null, data.phone ?? null, data.email ?? null, data.website ?? null,
      data.credentials ?? [], data.languages ?? [],
      data.telehealth ?? false, data.in_person ?? true,
      data.sliding_scale ?? null, data.individual_session_cost ?? null,
      data.modalities ?? [], data.issues ?? [], data.insurance_accepted ?? [],
      data.years_in_practice ?? null, data.accepting_clients ?? true,
    ]
  );
  return rows[0];
}

export async function getSimilarTherapists(
  therapist_id: string,
  specialties: string[],
  state_abbr: string | null,
  limit = 3
): Promise<Therapist[]> {
  if (specialties.length === 0) return [];
  const { rows } = await pool.query<Therapist>(
    `SELECT * FROM therapists
     WHERE id != $1
       AND specialties && $2
       AND ($3::text IS NULL OR state_abbr = $3)
     ORDER BY avg_rating DESC
     LIMIT $4`,
    [therapist_id, specialties, state_abbr, limit]
  );
  return rows;
}

async function generateUniqueSlug(name: string, city: string): Promise<string> {
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
