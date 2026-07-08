import type { Metadata } from "next";
import Link from "next/link";
import { BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Therapy Tools — Quizzes & Guides",
  description:
    "Free tools to help you find the right therapist: match quizzes, a therapy style quiz, and a printable checklist of questions to ask.",
  alternates: { canonical: `${BASE}/tools` },
};

const TOOLS = [
  {
    href: "/tools/therapist-match-quiz",
    title: "Therapist Match Quiz",
    description: "Answer a few questions about what you're looking for and get matched with therapists near you.",
  },
  {
    href: "/tools/therapy-style-quiz",
    title: "Therapy Style Quiz",
    description: "Not sure what kind of therapy fits you? Find out which approach lines up with how you actually work through problems.",
  },
  {
    href: "/tools/is-cbt-right-for-you",
    title: "Is CBT Right for You?",
    description: "A quick quiz to see whether Cognitive Behavioral Therapy is a good fit for what you're dealing with.",
  },
  {
    href: "/tools/questions-to-ask-your-therapist",
    title: "Questions to Ask Your Therapist",
    description: "A printable checklist of questions to bring to your first session — credentials, approach, logistics, and fit.",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Free Tools</h1>
      <p className="text-gray-500 mb-10">
        Free, no-signup tools to help you figure out what kind of support you need — and find it.
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-[#151515] transition"
          >
            <h2 className="font-black text-lg text-[#151515] mb-1">{t.title}</h2>
            <p className="text-sm text-gray-500">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
