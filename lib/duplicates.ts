import pool from "./db";

export interface DuplicateCandidate {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state_abbr: string | null;
  photo_url: string | null;
  gt_id: number | null;
  pt_uuid: string | null;
  review_count: number;
  created_at: string;
}

export interface DuplicatePair {
  a: DuplicateCandidate;
  b: DuplicateCandidate;
}

const CANDIDATE_COLS = "id, slug, name, city, state_abbr, photo_url, gt_id, pt_uuid, review_count, created_at";

/**
 * Heuristic: same name + city + state_abbr (case-insensitive), across any
 * source. This is the same match used by the GoodTherapy pipeline's
 * cross-source dedup (lib/data-pipeline/goodtherapy/seed.ts) — surfacing it
 * here lets an admin catch anything that dedup missed or that came from two
 * sources whose name/city didn't line up cleanly.
 */
export async function getDuplicatePairs(
  opts: { limit?: number; offset?: number } = {}
): Promise<{ pairs: DuplicatePair[]; total: number }> {
  const { limit = 25, offset = 0 } = opts;

  const joinCondition = `
    lower(a.name) = lower(b.name)
    AND lower(a.city) = lower(b.city)
    AND a.state_abbr = b.state_abbr
    AND a.id < b.id
  `;
  const where = `
    a.archived_at IS NULL AND b.archived_at IS NULL
    AND a.city IS NOT NULL AND a.city != ''
    AND a.state_abbr IS NOT NULL AND a.state_abbr != ''
    AND NOT EXISTS (
      SELECT 1 FROM duplicate_dismissals d
      WHERE d.therapist_id_a = a.id AND d.therapist_id_b = b.id
    )
  `;

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM therapists a JOIN therapists b ON ${joinCondition} WHERE ${where}`
  );

  const dataRes = await pool.query<Record<string, unknown>>(
    `SELECT
       ${CANDIDATE_COLS.split(", ").map((c) => `a.${c} AS a_${c}`).join(", ")},
       ${CANDIDATE_COLS.split(", ").map((c) => `b.${c} AS b_${c}`).join(", ")}
     FROM therapists a JOIN therapists b ON ${joinCondition}
     WHERE ${where}
     ORDER BY a.name
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const pairs: DuplicatePair[] = dataRes.rows.map((row) => ({
    a: unprefix(row, "a_") as unknown as DuplicateCandidate,
    b: unprefix(row, "b_") as unknown as DuplicateCandidate,
  }));

  return { pairs, total: parseInt(countRes.rows[0].count, 10) };
}

export async function getDuplicatePairCount(): Promise<number> {
  const { total } = await getDuplicatePairs({ limit: 1 });
  return total;
}

function unprefix(row: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}

/**
 * Merges `mergeId` into `keepId`: reassigns its reviews, clinic links, and
 * claim/feedback requests, backfills any fields `keepId` is missing (source
 * ids, bio, photo, etc.), then archives the duplicate rather than deleting
 * it outright — consistent with how the rest of the admin treats removal
 * (see archiveTherapist in lib/therapists.ts).
 */
export async function mergeDuplicateTherapists(
  keepId: string,
  mergeId: string
): Promise<{ keepName: string; mergeName: string } | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT * FROM therapists WHERE id = ANY($1) FOR UPDATE",
      [[keepId, mergeId]]
    );
    const keep = rows.find((r) => r.id === keepId);
    const merge = rows.find((r) => r.id === mergeId);
    if (!keep || !merge) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("UPDATE reviews SET therapist_id = $1 WHERE therapist_id = $2", [keepId, mergeId]);
    await client.query("UPDATE requests SET therapist_id = $1 WHERE therapist_id = $2", [keepId, mergeId]);
    await client.query(
      `INSERT INTO therapist_clinics (therapist_id, clinic_id, is_primary)
       SELECT $1, clinic_id, is_primary FROM therapist_clinics WHERE therapist_id = $2
       ON CONFLICT (therapist_id, clinic_id) DO NOTHING`,
      [keepId, mergeId]
    );

    // gt_id/pt_uuid are UNIQUE — clear them off the row being archived before
    // copying them onto the kept row, and rename its slug so it doesn't
    // collide if it's ever restored.
    await client.query(
      `UPDATE therapists SET
         gt_id = NULL, gt_seo_friendly = NULL, pt_uuid = NULL,
         status = 'archived', archived_at = NOW(),
         slug = slug || '-merged-' || substr(id::text, 1, 8)
       WHERE id = $1`,
      [mergeId]
    );

    await client.query(
      `UPDATE therapists SET
         gt_id = COALESCE(gt_id, $1),
         gt_seo_friendly = COALESCE(gt_seo_friendly, $2),
         pt_uuid = COALESCE(pt_uuid, $3),
         bio = COALESCE(bio, $4),
         photo_url = COALESCE(photo_url, $5),
         phone = COALESCE(phone, $6),
         email = COALESCE(email, $7),
         website = COALESCE(website, $8),
         individual_session_cost = COALESCE(individual_session_cost, $9),
         languages = CASE WHEN array_length(languages, 1) IS NULL THEN $10 ELSE languages END,
         modalities = CASE WHEN array_length(modalities, 1) IS NULL THEN $11 ELSE modalities END,
         insurance_accepted = CASE WHEN array_length(insurance_accepted, 1) IS NULL THEN $12 ELSE insurance_accepted END
       WHERE id = $13`,
      [
        merge.gt_id, merge.gt_seo_friendly, merge.pt_uuid,
        merge.bio, merge.photo_url, merge.phone, merge.email, merge.website,
        merge.individual_session_cost, merge.languages, merge.modalities, merge.insurance_accepted,
        keepId,
      ]
    );

    await client.query("COMMIT");
    return { keepName: keep.name, mergeName: merge.name };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function dismissDuplicatePair(
  idA: string,
  idB: string,
  dismissedBy: string | null
): Promise<void> {
  const [a, b] = [idA, idB].sort();
  await pool.query(
    `INSERT INTO duplicate_dismissals (therapist_id_a, therapist_id_b, dismissed_by)
     VALUES ($1,$2,$3)
     ON CONFLICT (therapist_id_a, therapist_id_b) DO NOTHING`,
    [a, b, dismissedBy]
  );
}
