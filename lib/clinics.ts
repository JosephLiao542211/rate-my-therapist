import pool from "./db";
import type { Clinic, Therapist } from "./therapists";

export interface ClinicWithSlug extends Clinic {
  slug: string;
}

export async function getClinicBySlug(slug: string): Promise<ClinicWithSlug | null> {
  const { rows } = await pool.query<ClinicWithSlug>(
    "SELECT * FROM clinics WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function getAllClinicSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    "SELECT slug FROM clinics WHERE slug IS NOT NULL"
  );
  return rows.map((r) => r.slug);
}

export async function getTherapistCountForClinic(clinic_id: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM therapist_clinics WHERE clinic_id = $1",
    [clinic_id]
  );
  return parseInt(rows[0].count, 10);
}

export async function getTherapistsForClinic(clinic_id: string): Promise<Therapist[]> {
  const { rows } = await pool.query<Therapist>(
    `SELECT t.* FROM therapists t
     JOIN therapist_clinics tc ON tc.therapist_id = t.id
     WHERE tc.clinic_id = $1
     ORDER BY t.avg_rating DESC`,
    [clinic_id]
  );
  return rows;
}

export async function getTopClinics(limit = 12): Promise<(ClinicWithSlug & { therapist_count: number })[]> {
  const { rows } = await pool.query<ClinicWithSlug & { therapist_count: string }>(
    `SELECT c.*, COUNT(tc.therapist_id) AS therapist_count
     FROM clinics c
     JOIN therapist_clinics tc ON tc.clinic_id = c.id
     WHERE c.slug IS NOT NULL
     GROUP BY c.id
     ORDER BY therapist_count DESC, c.name ASC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({ ...r, therapist_count: parseInt(r.therapist_count, 10) }));
}

export async function searchClinics(q: string, limit = 10): Promise<ClinicWithSlug[]> {
  const { rows } = await pool.query<ClinicWithSlug>(
    `SELECT * FROM clinics WHERE name ILIKE $1 OR city ILIKE $1 ORDER BY name LIMIT $2`,
    [`%${q}%`, limit]
  );
  return rows;
}
