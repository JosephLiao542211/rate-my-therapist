import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP_ARTICLES, getArticleBySlug, getCategoryBySlug, getArticlesByCategory } from "@/lib/help";
import HelpArticleBody from "@/components/HelpArticleBody";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BASE } from "@/lib/seo";

const HELP_SCHEMA_DATE = "2026-07-10";
const HELP_SCHEMA_AUTHOR = {
  "@type": "Organization",
  name: "Rate My Therapist",
  url: BASE,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `${BASE}/help/${slug}` },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
    },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategoryBySlug(article.category);
  const related = getArticlesByCategory(article.category).filter((a) => a.slug !== article.slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: article.title,
      text: article.summary,
      answerCount: 1,
      author: HELP_SCHEMA_AUTHOR,
      datePublished: HELP_SCHEMA_DATE,
      acceptedAnswer: {
        "@type": "Answer",
        text: article.body.join(" "),
        url: `${BASE}/help/${slug}#accepted-answer`,
        upvoteCount: 0,
        author: HELP_SCHEMA_AUTHOR,
        datePublished: HELP_SCHEMA_DATE,
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { name: "Help Center", url: "/help" },
            ...(category ? [{ name: category.name, url: `/help#${category.slug}` }] : []),
            { name: article.title, url: `/help/${slug}` },
          ]}
        />
        <h1 className="text-2xl font-black text-[#151515] mb-6">{article.title}</h1>

        <div id="accepted-answer">
          <HelpArticleBody body={article.body} />
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-bold text-[#151515] mb-3">Related questions</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {related.map((a) => (
                <Link key={a.slug} href={`/help/${a.slug}`} className="block px-5 py-3 hover:bg-gray-50 transition">
                  <p className="text-sm font-semibold text-[#151515]">{a.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">Didn&apos;t find what you needed?</p>
          <Link href="/feedback" className="text-sm font-bold text-[#151515] underline hover:opacity-80">
            Contact Support →
          </Link>
        </div>
      </div>
    </>
  );
}
