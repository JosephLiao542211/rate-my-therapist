import pool from "./db";

export interface Review {
  id: string;
  therapist_id: string;
  user_id: string | null;
  is_anonymous: boolean;
  rating: number;
  would_recommend: boolean | null;
  felt_heard: boolean | null;
  helped_with_goals: boolean | null;
  num_sessions: number | null;
  tags: string[];
  body: string;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  author_name?: string | null;
}

export async function getReviewsByTherapist(therapist_id: string): Promise<Review[]> {
  const { rows } = await pool.query<Review>(
    `SELECT r.*, u.name AS author_name
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.therapist_id = $1
     ORDER BY r.created_at DESC`,
    [therapist_id]
  );
  return rows;
}

export async function createReview(data: {
  therapist_id: string;
  user_id: string | null;
  is_anonymous: boolean;
  rating: number;
  would_recommend?: boolean;
  felt_heard?: boolean;
  helped_with_goals?: boolean;
  num_sessions?: number;
  tags?: string[];
  body: string;
}): Promise<Review> {
  const { rows } = await pool.query<Review>(
    `INSERT INTO reviews
       (therapist_id, user_id, is_anonymous, rating, would_recommend, felt_heard,
        helped_with_goals, num_sessions, tags, body)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.therapist_id,
      data.user_id,
      data.is_anonymous,
      data.rating,
      data.would_recommend ?? null,
      data.felt_heard ?? null,
      data.helped_with_goals ?? null,
      data.num_sessions ?? null,
      data.tags ?? [],
      data.body,
    ]
  );
  return rows[0];
}

export async function voteOnReview(
  review_id: string,
  user_id: string,
  is_helpful: boolean
): Promise<void> {
  // Upsert vote
  await pool.query(
    `INSERT INTO review_votes (review_id, user_id, is_helpful)
     VALUES ($1, $2, $3)
     ON CONFLICT (review_id, user_id) DO UPDATE SET is_helpful = EXCLUDED.is_helpful`,
    [review_id, user_id, is_helpful]
  );

  // Recount
  await pool.query(
    `UPDATE reviews SET
       helpful_count     = (SELECT COUNT(*) FROM review_votes WHERE review_id = $1 AND is_helpful = true),
       not_helpful_count = (SELECT COUNT(*) FROM review_votes WHERE review_id = $1 AND is_helpful = false)
     WHERE id = $1`,
    [review_id]
  );
}

export async function getAllReviews(opts: {
  q?: string;
  rating?: number;
  limit?: number;
  offset?: number;
} = {}): Promise<{ reviews: (Review & { therapist_name: string; therapist_slug: string })[]; total: number }> {
  const { q, rating, limit = 50, offset = 0 } = opts;

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(r.body ILIKE $${idx} OR t.name ILIKE $${idx} OR u.name ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }
  if (rating) {
    conditions.push(`r.rating = $${idx}`);
    values.push(rating);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     JOIN therapists t ON r.therapist_id = t.id
     ${where}`,
    values
  );

  const { rows } = await pool.query<Review & { therapist_name: string; therapist_slug: string }>(
    `SELECT r.*, u.name AS author_name, t.name AS therapist_name, t.slug AS therapist_slug
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     JOIN therapists t ON r.therapist_id = t.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );
  return { reviews: rows, total: parseInt(countRes.rows[0].count, 10) };
}

export async function deleteReview(id: string): Promise<Review | null> {
  const { rows } = await pool.query<Review>(
    "DELETE FROM reviews WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserVotes(
  review_ids: string[],
  user_id: string
): Promise<Record<string, boolean>> {
  if (!review_ids.length) return {};
  const { rows } = await pool.query<{ review_id: string; is_helpful: boolean }>(
    `SELECT review_id, is_helpful FROM review_votes
     WHERE review_id = ANY($1) AND user_id = $2`,
    [review_ids, user_id]
  );
  return Object.fromEntries(rows.map((r) => [r.review_id, r.is_helpful]));
}
