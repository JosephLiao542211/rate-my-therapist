import type { Metadata } from "next";
import Link from "next/link";
import { HELP_CATEGORIES, HELP_ARTICLES, getArticlesByCategory } from "@/lib/help";
import { BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Help Center — FAQ",
  description:
    "Answers to common questions about searching for therapists, writing reviews, managing your account, and handling negative reviews on Rate My Therapist.",
  alternates: { canonical: `${BASE}/help` },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HELP_ARTICLES.map((a) => ({
    "@type": "Question",
    name: a.title,
    acceptedAnswer: {
      "@type": "Answer",
      text: a.summary,
    },
  })),
};

export default function HelpCenterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-black text-[#151515] mb-2">Help Center</h1>
        <p className="text-gray-500 mb-10">
          Answers to common questions about searching, writing reviews, and using Rate My Therapist. Can&apos;t
          find what you&apos;re looking for?{" "}
          <Link href="/feedback" className="underline hover:text-[#151515]">
            Contact us
          </Link>
          .
        </p>

        <div className="flex flex-col gap-10">
          {HELP_CATEGORIES.map((category) => {
            const articles = getArticlesByCategory(category.slug);
            if (articles.length === 0) return null;
            return (
              <section key={category.slug} id={category.slug}>
                <h2 className="text-lg font-black text-[#151515] mb-1">{category.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/help/${article.slug}`}
                      className="block px-5 py-4 hover:bg-gray-50 transition"
                    >
                      <p className="text-sm font-semibold text-[#151515]">{article.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{article.summary}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 bg-[#151515] text-white rounded-lg p-6 text-center">
          <p className="font-black text-lg mb-2">Still need help?</p>
          <p className="text-gray-300 text-sm mb-4">Send us a message and our team will get back to you.</p>
          <Link
            href="/feedback"
            className="inline-block bg-white text-[#151515] font-bold px-6 py-2.5 rounded-full hover:opacity-80 transition text-sm"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </>
  );
}
