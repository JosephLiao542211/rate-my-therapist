import pool from "./db";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  tags: string[];
  author_name: string | null;
  status: "draft" | "published";
  author_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export async function getPublishedPosts(opts: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ posts: Post[]; total: number }> {
  const { limit = 20, offset = 0 } = opts;
  const countRes = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM posts WHERE status = 'published'"
  );
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE status = 'published'
     ORDER BY published_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { posts: rows, total: parseInt(countRes.rows[0].count, 10) };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>("SELECT * FROM posts WHERE slug = $1", [slug]);
  return rows[0] ?? null;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    "SELECT slug FROM posts WHERE status = 'published'"
  );
  return rows.map((r) => r.slug);
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  const { rows } = await pool.query<Post>("SELECT * FROM posts ORDER BY created_at DESC");
  return rows;
}

export async function getPostById(id: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>("SELECT * FROM posts WHERE id = $1", [id]);
  return rows[0] ?? null;
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let slug = base;
  let n = 1;
  while (await getPostBySlug(slug)) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export async function createPost(data: {
  title: string;
  excerpt?: string | null;
  body: string;
  cover_image_url?: string | null;
  tags?: string[];
  author_name?: string | null;
  author_id?: string | null;
  status?: "draft" | "published";
}): Promise<Post> {
  const slug = await generateUniqueSlug(data.title);
  const status = data.status ?? "draft";
  const { rows } = await pool.query<Post>(
    `INSERT INTO posts (slug, title, excerpt, body, cover_image_url, tags, author_name, author_id, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      slug,
      data.title.trim(),
      data.excerpt?.trim() || null,
      data.body,
      data.cover_image_url?.trim() || null,
      data.tags ?? [],
      data.author_name?.trim() || null,
      data.author_id ?? null,
      status,
      status === "published" ? new Date() : null,
    ]
  );
  return rows[0];
}

export async function updatePost(
  id: string,
  data: {
    title: string;
    excerpt?: string | null;
    body: string;
    cover_image_url?: string | null;
    tags?: string[];
  }
): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `UPDATE posts SET title = $2, excerpt = $3, body = $4, cover_image_url = $5, tags = $6, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, data.title.trim(), data.excerpt?.trim() || null, data.body, data.cover_image_url?.trim() || null, data.tags ?? []]
  );
  return rows[0] ?? null;
}

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `UPDATE posts SET status = $2, published_at = CASE WHEN $2 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
     WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function deletePost(id: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>("DELETE FROM posts WHERE id = $1 RETURNING *", [id]);
  return rows[0] ?? null;
}
