import pool from "./db";

export interface SiteRequest {
  id: string;
  type: "claim" | "feedback";
  therapist_id: string | null;
  therapist_name: string | null;
  therapist_slug?: string | null;
  name: string | null;
  email: string | null;
  message: string;
  status: "open" | "resolved";
  user_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function createRequest(data: {
  type: "claim" | "feedback";
  therapist_id?: string | null;
  therapist_name?: string | null;
  name?: string | null;
  email?: string | null;
  message: string;
  user_id?: string | null;
}): Promise<SiteRequest> {
  const { rows } = await pool.query<SiteRequest>(
    `INSERT INTO requests (type, therapist_id, therapist_name, name, email, message, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      data.type,
      data.therapist_id ?? null,
      data.therapist_name ?? null,
      data.name ?? null,
      data.email ?? null,
      data.message,
      data.user_id ?? null,
    ]
  );
  return rows[0];
}

export async function getRequests(opts: {
  status?: "open" | "resolved";
  type?: "claim" | "feedback";
  limit?: number;
  offset?: number;
} = {}): Promise<{ requests: SiteRequest[]; total: number }> {
  const { status, type, limit = 50, offset = 0 } = opts;
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;
  if (status) { conditions.push(`r.status = $${idx++}`); values.push(status); }
  if (type) { conditions.push(`r.type = $${idx++}`); values.push(type); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM requests r ${where}`,
    values
  );
  const dataRes = await pool.query<SiteRequest>(
    `SELECT r.*, t.slug AS therapist_slug
     FROM requests r
     LEFT JOIN therapists t ON r.therapist_id = t.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );
  return { requests: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
}

export async function resolveRequest(id: string): Promise<SiteRequest | null> {
  const { rows } = await pool.query<SiteRequest>(
    `UPDATE requests SET status = 'resolved', resolved_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getOpenRequestCount(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM requests WHERE status = 'open'"
  );
  return parseInt(rows[0].count, 10);
}
