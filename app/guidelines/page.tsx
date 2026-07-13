import type { Metadata } from "next";
import { BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Site Guidelines",
  description: "Guidelines for submitting reviews and listings on Rate My Therapist.",
  alternates: { canonical: `${BASE}/guidelines` },
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14 text-[#151515]">
      <h1 className="text-3xl font-black mb-2">Site Guidelines</h1>
      <p className="text-sm text-gray-500 mb-10">
        These guidelines keep Rate My Therapist useful, honest, and fair for everyone.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">Writing a Review</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only review a therapist you have personally seen for a session.</li>
            <li>Focus on your own experience: communication style, professionalism, fit, and outcomes.</li>
            <li>Be specific and constructive — vague reviews help fewer people.</li>
            <li>Avoid sharing another client&apos;s private information, even indirectly.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">What&apos;s Not Allowed</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fake, duplicate, or incentivized reviews.</li>
            <li>Reviews written by the therapist about themselves, or by competitors.</li>
            <li>Hate speech, harassment, threats, or discriminatory language.</li>
            <li>Sharing diagnoses, medications, or other sensitive details about a third party.</li>
            <li>Off-topic content, spam, or promotional links.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">Adding a Therapist</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only add real, practicing therapists or counselors.</li>
            <li>Provide accurate location and specialty information where possible.</li>
            <li>Duplicate listings for the same therapist may be merged or removed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">Moderation</h2>
          <p>
            We may remove content that violates these guidelines or our{" "}
            <a href="/terms" className="underline hover:text-[#151515]">Terms &amp; Conditions</a>, without prior
            notice. Repeated violations may result in account restrictions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">In Crisis?</h2>
          <p>
            RMT is a review directory, not a crisis service. If you or someone else is in immediate danger, please
            contact your local emergency number or a crisis hotline right away.
          </p>
        </section>
      </div>
    </div>
  );
}
