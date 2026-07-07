import pool from "./db";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  review_count: number;
}

export async function getAllUsers(opts: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ users: AdminUser[]; total: number }> {
  const { limit = 50, offset = 0 } = opts;
  const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) FROM users");
  const { rows } = await pool.query<AdminUser & { review_count: string }>(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            COUNT(r.id) AS review_count
     FROM users u
     LEFT JOIN reviews r ON r.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return {
    users: rows.map((r) => ({ ...r, review_count: parseInt(r.review_count as unknown as string, 10) })),
    total: parseInt(countRes.rows[0].count, 10),
  };
}

export async function setUserRole(id: string, role: "user" | "admin"): Promise<AdminUser | null> {
  const { rows } = await pool.query<AdminUser>(
    "UPDATE users SET role = $2 WHERE id = $1 RETURNING id, name, email, role, created_at",
    [id, role]
  );
  return rows[0] ?? null;
}

export interface DashboardMetrics {
  totalTherapists: number;
  pendingTherapists: number;
  approvedTherapists: number;
  rejectedTherapists: number;
  totalReviews: number;
  reviewsLast7Days: number;
  totalUsers: number;
  avgRating: number | null;
  therapistsLast7Days: number;
  openRequests: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { rows } = await pool.query<{
    total_therapists: string;
    pending_therapists: string;
    approved_therapists: string;
    rejected_therapists: string;
    total_reviews: string;
    reviews_last_7_days: string;
    total_users: string;
    avg_rating: string | null;
    therapists_last_7_days: string;
    open_requests: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM therapists) AS total_therapists,
      (SELECT COUNT(*) FROM therapists WHERE status = 'pending') AS pending_therapists,
      (SELECT COUNT(*) FROM therapists WHERE status = 'approved') AS approved_therapists,
      (SELECT COUNT(*) FROM therapists WHERE status = 'rejected') AS rejected_therapists,
      (SELECT COUNT(*) FROM reviews) AS total_reviews,
      (SELECT COUNT(*) FROM reviews WHERE created_at > NOW() - INTERVAL '7 days') AS reviews_last_7_days,
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews) AS avg_rating,
      (SELECT COUNT(*) FROM therapists WHERE created_at > NOW() - INTERVAL '7 days') AS therapists_last_7_days,
      (SELECT COUNT(*) FROM requests WHERE status = 'open') AS open_requests
  `);
  const r = rows[0];
  return {
    totalTherapists: parseInt(r.total_therapists, 10),
    pendingTherapists: parseInt(r.pending_therapists, 10),
    approvedTherapists: parseInt(r.approved_therapists, 10),
    rejectedTherapists: parseInt(r.rejected_therapists, 10),
    totalReviews: parseInt(r.total_reviews, 10),
    reviewsLast7Days: parseInt(r.reviews_last_7_days, 10),
    totalUsers: parseInt(r.total_users, 10),
    avgRating: r.avg_rating ? parseFloat(r.avg_rating) : null,
    therapistsLast7Days: parseInt(r.therapists_last_7_days, 10),
    openRequests: parseInt(r.open_requests, 10),
  };
}
