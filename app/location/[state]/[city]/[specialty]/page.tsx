import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsByLocationAndSpecialty } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { slugToSpecialty } from "@/lib/specialties";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

// Location × specialty is a large cross product (thousands of combos and
// growing with the data set) — rendering it all at build time blew the
// build to 80k+ pages and 11+ minutes with per-page timeouts. Instead these
// render on demand (dynamicParams defaults to true) and are cached by ISR,
// so build time stays flat regardless of how much data is seeded.
export async function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ state: string; city: string; specialty: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, specialty: specialtySlug } = await params;
  const cityName = city.replace(/-/g, " ");
  const stateUpper = state.toUpperCase();
  const specialty = slugToSpecialty(specialtySlug);
  const therapists = await getTherapistsByLocationAndSpecialty(stateUpper, cityName, specialty);
  return {
    title: `${specialty} Therapists in ${cityName}, ${stateUpper}`,
    description: `Find and review ${specialty.toLowerCase()} therapists in ${cityName}, ${stateUpper}. Read real client ratings to find the right fit near you.`,
    alternates: { canonical: `${BASE}/location/${state}/${city}/${specialtySlug}` },
    robots: therapists.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function LocationSpecialtyPage({ params }: Props) {
  const { state, city, specialty: specialtySlug } = await params;
  const cityName = city.replace(/-/g, " ");
  const stateUpper = state.toUpperCase();
  const specialty = slugToSpecialty(specialtySlug);

  const therapists = await getTherapistsByLocationAndSpecialty(stateUpper, cityName, specialty);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: stateUpper, url: `/location/${state}` },
          { name: cityName, url: `/location/${state}/${city}` },
          { name: specialty, url: `/location/${state}/${city}/${specialtySlug}` },
        ]}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 capitalize">
        {specialty} Therapists in {cityName}, {stateUpper}
      </h1>
      <p className="text-gray-500 mb-4">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-10">
        Compare client-reviewed {specialty.toLowerCase()} therapists practicing in {cityName}, {stateUpper}.
        Ratings and reviews come from real clients, so you can find a local fit before booking a first session.
      </p>

      {therapists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold">
            No {specialty.toLowerCase()} therapists listed in {cityName}, {stateUpper} yet.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={`/location/${state}/${city}`}
              className="text-teal-600 font-semibold text-sm hover:underline"
            >
              See all therapists in {cityName} →
            </Link>
            <Link
              href="/add-therapist"
              className="inline-block bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
            >
              + Add a Therapist
            </Link>
          </div>
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
            question: `Are there ${specialty.toLowerCase()} therapists in ${cityName}, ${stateUpper}?`,
            answer: `Yes — browse the ${specialty.toLowerCase()} therapists above who practice in or near ${cityName}, ${stateUpper}, along with their client ratings and reviews.`,
          },
          {
            question: `How do I choose a ${specialty.toLowerCase()} therapist in ${cityName}?`,
            answer: `Compare reviews for communication style and outcomes, check whether they offer telehealth or in-person sessions, and confirm they accept your insurance or offer a sliding scale before booking.`,
          },
        ]}
      />
    </div>
  );
}
