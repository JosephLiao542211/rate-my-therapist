import type { Metadata } from "next";
import Link from "next/link";
import { BASE } from "@/lib/seo";
import ChecklistClient from "./ChecklistClient";

export const metadata: Metadata = {
  title: "Questions to Ask Your Therapist — Free Printable Checklist",
  description:
    "A free, printable checklist of questions to ask a new therapist before or during your first session — credentials, logistics, and fit.",
  alternates: { canonical: `${BASE}/tools/questions-to-ask-your-therapist` },
};

export default function QuestionsChecklistPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Questions to Ask Your Therapist</h1>
      <p className="text-gray-500 mb-8">
        Starting therapy can feel like a leap of faith. Bring this checklist to your first session (or a
        consultation call) to make sure you&apos;re making an informed choice.
      </p>

      <ChecklistClient />

      <div className="mt-12 bg-[#151515] text-white rounded-lg p-6 text-center print:hidden">
        <p className="font-black text-lg mb-2">Haven&apos;t found a therapist yet?</p>
        <p className="text-gray-300 text-sm mb-4">Search reviews and find someone who fits what you need.</p>
        <Link
          href="/search"
          className="inline-block bg-white text-[#151515] font-bold px-6 py-2.5 rounded-full hover:opacity-80 transition text-sm"
        >
          Search Therapists →
        </Link>
      </div>
    </div>
  );
}
