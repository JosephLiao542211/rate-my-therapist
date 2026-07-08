import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { BASE } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Therapy Tips & Mental Health Resources",
  description:
    "Guides, checklists, and advice for finding the right therapist and getting the most out of therapy.",
  alternates: { canonical: `${BASE}/blog` },
};

export default async function BlogIndexPage() {
  const { posts } = await getPublishedPosts({ limit: 30 });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Blog</h1>
      <p className="text-gray-500 mb-10">Therapy tips, mental health resources, and finding the right fit.</p>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-400 border-2 border-dashed border-gray-300 rounded-lg py-16 text-center">
          No posts yet — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-[#151515] transition"
            >
              <h2 className="text-xl font-black text-[#151515] mb-1">{p.title}</h2>
              {p.excerpt && <p className="text-sm text-gray-500 mb-2">{p.excerpt}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {p.published_at && <span>{new Date(p.published_at).toLocaleDateString()}</span>}
                {p.tags.length > 0 && <span>· {p.tags.join(", ")}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
