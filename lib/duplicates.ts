import pool from "./db";
import type { PoolClient } from "pg";

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

export interface DuplicateGroup {
  key: {
    name: string;
    city: string;
    state_abbr: string;
  };
  candidates: DuplicateCandidate[];
}

const CANDIDATE_COLS = "id, slug, name, city, state_abbr, photo_url, gt_id, pt_uuid, review_count, created_at";
const GROUP_JOIN_CONDITION = `
  lower(a.name) = lower(b.name)
  AND lower(a.city) = lower(b.city)
  AND a.state_abbr = b.state_abbr
`;
const ACTIVE_DUPLICATE_WHERE = `
  archived_at IS NULL
  AND city IS NOT NULL AND city != ''
  AND state_abbr IS NOT NULL AND state_abbr != ''
`;
const VISIBLE_GROUPS_CTE = `
  WITH active AS (
    SELECT * FROM therapists WHERE ${ACTIVE_DUPLICATE_WHERE}
  ),
  duplicate_keys AS (
    SELECT lower(name) AS name_key, lower(city) AS city_key, state_abbr, COUNT(*)::int AS duplicate_count
    FROM active
    GROUP BY lower(name), lower(city), state_abbr
    HAVING COUNT(*) > 1
  ),
  visible_groups AS (
    SELECT k.name_key, k.city_key, k.state_abbr, k.duplicate_count
    FROM duplicate_keys k
    WHERE EXISTS (
      SELECT 1
      FROM active a
      JOIN active b ON ${GROUP_JOIN_CONDITION} AND a.id < b.id
      WHERE lower(a.name) = k.name_key
        AND lower(a.city) = k.city_key
        AND a.state_abbr = k.state_abbr
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_dismissals d
          WHERE d.therapist_id_a = a.id AND d.therapist_id_b = b.id
        )
    )
  )
`;

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

export async function getDuplicateGroups(
  opts: { limit?: number; offset?: number } = {}
): Promise<{ groups: DuplicateGroup[]; total: number }> {
  const { limit = 25, offset = 0 } = opts;

  const countRes = await pool.query<{ count: string }>(
    `${VISIBLE_GROUPS_CTE} SELECT COUNT(*) FROM visible_groups`
  );

  const dataRes = await pool.query<
    DuplicateCandidate & { group_name: string; group_city: string; group_state_abbr: string }
  >(
    `${VISIBLE_GROUPS_CTE},
     page_groups AS (
       SELECT * FROM visible_groups
       ORDER BY duplicate_count DESC, name_key, city_key, state_abbr
       LIMIT $1 OFFSET $2
     )
     SELECT
       t.${CANDIDATE_COLS.split(", ").join(", t.")},
       pg.name_key AS group_name,
       pg.city_key AS group_city,
       pg.state_abbr AS group_state_abbr
     FROM page_groups pg
     JOIN therapists t ON lower(t.name) = pg.name_key
       AND lower(t.city) = pg.city_key
       AND t.state_abbr = pg.state_abbr
     WHERE t.archived_at IS NULL
       AND t.city IS NOT NULL AND t.city != ''
       AND t.state_abbr IS NOT NULL AND t.state_abbr != ''
     ORDER BY pg.duplicate_count DESC, pg.name_key, pg.city_key, pg.state_abbr, t.review_count DESC, t.created_at ASC`,
    [limit, offset]
  );

  const groups = new Map<string, DuplicateGroup>();
  for (const row of dataRes.rows) {
    const key = `${row.group_name}|${row.group_city}|${row.group_state_abbr}`;
    const group = groups.get(key) ?? {
      key: {
        name: row.group_name,
        city: row.group_city,
        state_abbr: row.group_state_abbr,
      },
      candidates: [],
    };
    group.candidates.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      state_abbr: row.state_abbr,
      photo_url: row.photo_url,
      gt_id: row.gt_id,
      pt_uuid: row.pt_uuid,
      review_count: row.review_count,
      created_at: row.created_at,
    });
    groups.set(key, group);
  }

  return { groups: [...groups.values()], total: parseInt(countRes.rows[0].count, 10) };
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
    const result = await mergeDuplicateTherapistsInTransaction(client, keepId, mergeId);
    if (!result) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function mergeDuplicateTherapistGroup(
  keepId: string,
  mergeIds: string[]
): Promise<{ keepName: string; merged: { id: string; name: string }[] } | null> {
  const uniqueMergeIds = [...new Set(mergeIds)].filter((id) => id !== keepId);
  if (uniqueMergeIds.length === 0) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ids = [keepId, ...uniqueMergeIds];
    const { rows } = await client.query<DuplicateCandidate>(
      `SELECT ${CANDIDATE_COLS} FROM therapists
       WHERE id = ANY($1) AND ${ACTIVE_DUPLICATE_WHERE}
       FOR UPDATE`,
      [ids]
    );
    if (rows.length !== ids.length || !rows.some((row) => row.id === keepId)) {
      await client.query("ROLLBACK");
      return null;
    }

    const [first] = rows;
    const sameGroup = rows.every(
      (row) =>
        row.name.toLowerCase() === first.name.toLowerCase() &&
        (row.city ?? "").toLowerCase() === (first.city ?? "").toLowerCase() &&
        row.state_abbr === first.state_abbr
    );
    if (!sameGroup) {
      await client.query("ROLLBACK");
      return null;
    }

    const merged: { id: string; name: string }[] = [];
    let keepName = first.name;
    for (const mergeId of uniqueMergeIds) {
      const result = await mergeDuplicateTherapistsInTransaction(client, keepId, mergeId);
      if (!result) {
        await client.query("ROLLBACK");
        return null;
      }
      keepName = result.keepName;
      merged.push({ id: mergeId, name: result.mergeName });
    }

    await client.query("COMMIT");
    return { keepName, merged };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function mergeDuplicateTherapistsInTransaction(
  client: PoolClient,
  keepId: string,
  mergeId: string
): Promise<{ keepName: string; mergeName: string } | null> {
  const { rows } = await client.query(
    "SELECT * FROM therapists WHERE id = ANY($1) FOR UPDATE",
    [[keepId, mergeId]]
  );
  const keep = rows.find((r) => r.id === keepId);
  const merge = rows.find((r) => r.id === mergeId);
  if (!keep || !merge) {
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

  // gt_id/pt_uuid are UNIQUE, so clear them off the archived row before
  // copying them onto the kept row.
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

  return { keepName: keep.name, mergeName: merge.name };
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
