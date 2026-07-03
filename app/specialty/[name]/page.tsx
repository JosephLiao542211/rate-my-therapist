import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsBySpecialty, getAllSpecialties } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SPECIALTIES } from "@/lib/constants";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

interface Props {
  params: Promise<{ name: string }>;
}

function slugToSpecialty(slug: string): string {
  // Try to find an exact match from the known list
  const match = SPECIALTIES.find(
    (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
  );
  return match ?? slug.replace(/-/g, " ");
}

export async function generateStaticParams() {
  // Combine known specialties + any in DB
  const dbSpecialties = await getAllSpecialties();
  const allSlugs = new Set([
    ...SPECIALTIES.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    ...dbSpecialties.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  ]);
  return [...allSlugs].map((name) => ({ name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const specialty = slugToSpecialty(name);
  return {
    title: `${specialty} Therapists`,
    description: `Find and review ${specialty} therapists. Read real client ratings and reviews to find the right fit.`,
    alternates: { canonical: `${BASE}/specialty/${name}` },
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
      <p className="text-gray-500 mb-10">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
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
    </div>
  );
}
