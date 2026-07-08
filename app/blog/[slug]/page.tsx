import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPostSlugs } from "@/lib/posts";
import PostBody from "@/components/PostBody";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BASE } from "@/lib/seo";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name ?? "Rate My Therapist" },
    publisher: { "@type": "Organization", name: "Rate My Therapist" },
    mainEntityOfPage: `${BASE}/blog/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${slug}` }]} />
        <h1 className="text-3xl font-black text-[#151515] mt-4 mb-2">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          {post.author_name && <span>{post.author_name}</span>}
          {post.published_at && <span>· {new Date(post.published_at).toLocaleDateString()}</span>}
        </div>

        <PostBody body={post.body} />

        <div className="mt-12 bg-[#151515] text-white rounded-lg p-6 text-center">
          <p className="font-black text-lg mb-2">Ready to find the right therapist?</p>
          <p className="text-gray-300 text-sm mb-4">Browse honest reviews and find a great match near you.</p>
          <Link
            href="/search"
            className="inline-block bg-white text-[#151515] font-bold px-6 py-2.5 rounded-full hover:opacity-80 transition text-sm"
          >
            Search Therapists →
          </Link>
        </div>
      </div>
    </>
  );
}
