import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsBySpecialty, getAllSpecialties } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { SPECIALTIES } from "@/lib/constants";
import { specialtyToSlug, slugToSpecialty } from "@/lib/specialties";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  // Combine known specialties + any in DB
  const dbSpecialties = await getAllSpecialties();
  const allSlugs = new Set([
    ...SPECIALTIES.map(specialtyToSlug),
    ...dbSpecialties.map(specialtyToSlug),
  ]);
  return [...allSlugs].map((name) => ({ name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const specialty = slugToSpecialty(name);
  const therapists = await getTherapistsBySpecialty(specialty);
  return {
    title: `${specialty} Therapists`,
    description: `Find and review ${specialty} therapists. Read real client ratings and reviews to find the right fit.`,
    alternates: { canonical: `${BASE}/specialty/${name}` },
    // Empty specialties are thin, same-template content — keep them
    // crawlable but out of the index so they don't drag down site quality.
    robots: therapists.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function SpecialtyPage({ params }: Props) {
  const { name } = await params;
  const specialty = slugToSpecialty(name);
  const therapists = await getTherapistsBySpecialty(specialty);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: specialty, url: `/specialty/${name}` },
        ]}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        {specialty} Therapists
      </h1>
      <p className="text-gray-500 mb-4">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-10">
        Browse client-reviewed {specialty.toLowerCase()} therapists below. Every rating comes from someone
        who has actually been in session with that therapist, so you can compare communication style, fit,
        and outcomes before you book.
      </p>

      {therapists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold">No therapists listed for this specialty yet.</p>
          <Link
            href="/add-therapist"
            className="mt-4 inline-block bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
          >
            + Add a Therapist
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      )}

      <Faq
        items={[
          {
            question: `How do I choose a good ${specialty.toLowerCase()} therapist?`,
            answer: `Look at client reviews for communication style, whether the therapist specializes in ${specialty.toLowerCase()}, and whether past clients felt heard and made progress toward their goals. A good fit matters as much as credentials.`,
          },
          {
            question: `What should I expect from ${specialty.toLowerCase()} therapy?`,
            answer: `This varies by therapist and approach, but most ${specialty.toLowerCase()} therapists will start with an intake to understand your history and goals, then work with you on a plan tailored to your situation.`,
          },
          {
            question: "How much does therapy typically cost?",
            answer: "Cost varies widely by therapist, location, and insurance coverage. Many therapists on Rate My Therapist list whether they accept insurance or offer a sliding scale — check individual profiles for details.",
          },
        ]}
      />
    </div>
  );
}
