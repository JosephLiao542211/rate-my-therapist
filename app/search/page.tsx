import type { Metadata } from "next";
import Link from "next/link";
import TherapistCard from "@/components/TherapistCard";
import SearchPagination from "@/components/SearchPagination";
import NearMeFilter from "@/components/NearMeFilter";
import { searchTherapists, getAllLocations } from "@/lib/therapists";
import { searchClinics } from "@/lib/clinics";
import { SPECIALTIES } from "@/lib/constants";
import { BASE } from "@/lib/seo";

interface Props {
  searchParams: Promise<{
    q?: string;
    state?: string;
    city?: string;
    specialty?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const parts = [params.q, params.specialty, params.city, params.state]
    .filter(Boolean)
    .join(" · ");
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Canonicalize to page 1 of the same filter combo — consolidates
  // pagination's ranking signal onto a single URL per query.
  const canonicalParams = new URLSearchParams({
    ...(params.q && { q: params.q }),
    ...(params.state && { state: params.state }),
    ...(params.city && { city: params.city }),
    ...(params.specialty && { specialty: params.specialty }),
  });
  const qs = canonicalParams.toString();
  const canonical = `${BASE}/search${qs ? `?${qs}` : ""}`;

  // Cheap count-only lookup to detect empty result pages — those are thin
  // content and shouldn't be indexed.
  const { total } = await searchTherapists({
    q: params.q,
    state: params.state,
    city: params.city,
    specialty: params.specialty,
    limit: 1,
  });

  return {
    title: parts ? `Therapists: ${parts}` : "Search Therapists",
    description: "Search for therapists by name, location, or specialty.",
    alternates: { canonical },
    // Page 2+ and empty-result pages carry no unique content — keep them
    // crawlable but out of the index so they don't compete with page 1 or
    // drag down the site's overall content-quality signal.
    robots: page > 1 || total === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const [{ therapists, total }, locations, clinics] = await Promise.all([
    searchTherapists({
      q: params.q,
      state: params.state,
      city: params.city,
      specialty: params.specialty,
      limit,
      offset,
    }),
    getAllLocations(),
    // Only match clinics on the free-text query — filters like state/specialty
    // don't apply to clinics, so skip clinic results once those are in play.
    params.q && !params.state && !params.city && !params.specialty
      ? searchClinics(params.q, 5)
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / limit);

  const states = [
    ...new Map(
      locations
        .filter((l) => l.state_abbr && l.state)
        .map((l) => [l.state_abbr, { abbr: l.state_abbr, name: l.state }])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const cities = [
    ...new Set(
      locations
        .filter((l) => l.city && (!params.state || l.state_abbr === params.state.toUpperCase()))
        .map((l) => l.city)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const stateName = states.find(
    (s) => s.abbr === params.state?.toUpperCase(),
  )?.name;
  const queryLabel = [params.q, params.specialty, params.city, stateName ?? params.state]
    .filter(Boolean)
    .join(" · ");

  function buildHref(p: number) {
    const sp = new URLSearchParams({
      ...(params.q && { q: params.q }),
      ...(params.state && { state: params.state }),
      ...(params.city && { city: params.city }),
      ...(params.specialty && { specialty: params.specialty }),
      page: String(p),
    });
    return `/search?${sp}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Filters bar */}
      <form
        method="GET"
        className="flex flex-wrap gap-3 mb-8 bg-white border border-gray-200 rounded-lg p-4"
      >
        <input
          name="q"
          type="text"
          defaultValue={params.q ?? ""}
          placeholder="Therapist name..."
          className="flex-1 min-w-[180px] border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
        />
        <select
          name="state"
          defaultValue={params.state ?? ""}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
        >
          <option value="">All provinces/states</option>
          {states.map((s) => (
            <option key={s.abbr} value={s.abbr}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={params.city ?? ""}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="specialty"
          defaultValue={params.specialty ?? ""}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
        >
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#151515] text-white font-bold px-6 py-2 rounded text-sm hover:opacity-80 transition"
        >
          Search
        </button>
        <NearMeFilter />
      </form>

      <h1 className="text-2xl font-black text-[#151515] mb-1">
        {queryLabel ? `Results for "${queryLabel}"` : "All Therapists"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {total} therapist{total !== 1 ? "s" : ""} found
      </p>

      {clinics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#151515] uppercase tracking-widest mb-3">
            Practices &amp; Clinics
          </h2>
          <div className="flex flex-col gap-2">
            {clinics.map((c) => (
              <Link
                key={c.id}
                href={`/clinic/${c.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-[#F5F5F5] transition"
              >
                <p className="font-bold text-[#151515]">{c.name}</p>
                <p className="text-sm text-gray-500">
                  {[c.address_line, c.city, c.state_abbr].filter(Boolean).join(", ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {therapists.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-bold">No therapists found.</p>
          <p className="text-sm mt-2">Try broadening your search or add one.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {therapists.map((t) => (
              <TherapistCard key={t.id} therapist={t} />
            ))}
          </div>

          <SearchPagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
