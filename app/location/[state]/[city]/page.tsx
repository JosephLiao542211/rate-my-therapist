import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsByLocation, getAllLocations } from "@/lib/therapists";
import SortableTherapistList from "@/components/SortableTherapistList";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

interface Props {
  params: Promise<{ state: string; city: string }>;
}

export async function generateStaticParams() {
  const locations = await getAllLocations();
  return locations.map((l) => ({
    state: l.state_abbr.toLowerCase(),
    city: l.city.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const cityName = city.replace(/-/g, " ");
  const stateUpper = state.toUpperCase();
  const therapists = await getTherapistsByLocation(stateUpper, cityName);
  return {
    title: `Therapists in ${cityName}, ${stateUpper}`,
    description: `Find and review therapists in ${cityName}, ${stateUpper}. Read real client reviews, compare ratings, and find the right mental health professional.`,
    alternates: { canonical: `${BASE}/location/${state}/${city}` },
    // Empty cities are thin, same-template content — keep them
    // crawlable but out of the index so they don't drag down site quality.
    robots: therapists.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const stateUpper = state.toUpperCase();
  const cityName = city.replace(/-/g, " ");

  const therapists = await getTherapistsByLocation(stateUpper, cityName);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: stateUpper, url: `/location/${state}` },
          { name: cityName, url: `/location/${state}/${city}` },
        ]}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 capitalize">
        Therapists in {cityName}, {stateUpper}
      </h1>
      <p className="text-gray-500 mb-4">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-10">
        Browse client-reviewed therapists practicing in {cityName}, {stateUpper}. Ratings and reviews come
        from real clients, so you can compare communication style, specialties, and fit before booking.
      </p>

      {therapists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold">No therapists listed here yet.</p>
          <Link
            href="/add-therapist"
            className="mt-4 inline-block bg-teal-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-700 transition"
          >
            + Add a Therapist
          </Link>
        </div>
      ) : (
        <SortableTherapistList therapists={therapists} />
      )}

      <Faq
        items={[
          {
            question: `How do I find a therapist in ${cityName}, ${stateUpper}?`,
            answer: `Browse the client-reviewed therapists above, or filter by specialty to find someone who focuses on what you're looking for. Each profile shows ratings and reviews from real clients.`,
          },
          {
            question: `Do therapists in ${cityName} offer telehealth?`,
            answer: `Many do. Check individual therapist profiles for whether they offer telehealth, in-person sessions, or both.`,
          },
          {
            question: "What does therapy typically cost?",
            answer: "Cost varies by therapist, insurance coverage, and whether they offer a sliding scale. Check individual profiles for pricing and insurance details.",
          },
        ]}
      />
    </div>
  );
}
