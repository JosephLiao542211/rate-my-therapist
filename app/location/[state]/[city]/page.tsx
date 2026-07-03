import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsByLocation, getAllLocations } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  return {
    title: `Therapists in ${cityName}, ${stateUpper}`,
    description: `Find and review therapists in ${cityName}, ${stateUpper}. Read real client reviews, compare ratings, and find the right mental health professional.`,
    alternates: { canonical: `${BASE}/location/${state}/${city}` },
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
      <p className="text-gray-500 mb-10">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
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
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      )}
    </div>
  );
}
