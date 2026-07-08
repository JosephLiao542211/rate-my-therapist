import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistsByLocation, getAllLocations } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  const locations = await getAllLocations();
  const states = [...new Set(locations.map((l) => l.state_abbr.toLowerCase()))];
  return states.map((state) => ({ state }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const therapists = await getTherapistsByLocation(stateUpper);
  return {
    title: `Therapists in ${stateUpper}`,
    description: `Find and review therapists in ${stateUpper}. Read real client reviews, ratings, and specialties.`,
    alternates: { canonical: `${BASE}/location/${state}` },
    // Empty states are thin, same-template content — keep them
    // crawlable but out of the index so they don't drag down site quality.
    robots: therapists.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const therapists = await getTherapistsByLocation(stateUpper);

  // Group by city
  const byCity: Record<string, typeof therapists> = {};
  for (const t of therapists) {
    const city = t.city ?? "Unknown";
    byCity[city] = byCity[city] ?? [];
    byCity[city].push(t);
  }
  const cities = Object.keys(byCity).sort();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: stateUpper, url: `/location/${state}` },
        ]}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Therapists in {stateUpper}
      </h1>
      <p className="text-gray-500 mb-4">
        {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-10">
        Browse client-reviewed therapists across {stateUpper}, grouped by city. Every rating comes from a real
        client, so you can compare communication style, specialties, and outcomes before you book.
      </p>

      {cities.length === 0 ? (
        <p className="text-gray-500">No therapists listed in this state yet.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {cities.map((city) => (
            <section key={city}>
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                <Link
                  href={`/location/${state}/${city.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-teal-600 transition"
                >
                  {city}
                </Link>
                <span className="text-sm text-gray-400 font-normal ml-2">
                  ({byCity[city].length})
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {byCity[city].slice(0, 5).map((t) => (
                  <TherapistCard key={t.id} therapist={t} />
                ))}
                {byCity[city].length > 5 && (
                  <Link
                    href={`/location/${state}/${city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-teal-600 font-semibold hover:underline"
                  >
                    View all {byCity[city].length} therapists in {city} →
                  </Link>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
