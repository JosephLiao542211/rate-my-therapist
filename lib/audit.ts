import pool from "./db";

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function logAudit(entry: {
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, actor_email, action, entity_type, entity_id, entity_label, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      entry.actor_user_id,
      entry.actor_email,
      entry.action,
      entry.entity_type,
      entry.entity_id ?? null,
      entry.entity_label ?? null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ]
  );
}

export async function getAuditLog(opts: {
  entity_type?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const { entity_type, limit = 50, offset = 0 } = opts;
  const where = entity_type ? "WHERE entity_type = $1" : "";
  const values = entity_type ? [entity_type] : [];

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM audit_log ${where}`,
    values
  );
  const dataRes = await pool.query<AuditLogEntry>(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return { entries: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
}
