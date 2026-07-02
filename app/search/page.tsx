import type { Metadata } from "next";
import TherapistCard from "@/components/TherapistCard";
import { searchTherapists } from "@/lib/therapists";
import { SPECIALTIES, US_STATES } from "@/lib/constants";

interface Props {
  searchParams: Promise<{ q?: string; state?: string; specialty?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const parts = [params.q, params.specialty, params.state].filter(Boolean).join(" · ");
  return {
    title: parts ? `Therapists: ${parts}` : "Search Therapists",
    description: "Search for therapists by name, location, or specialty.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const { therapists, total } = await searchTherapists({
    q: params.q,
    state: params.state,
    specialty: params.specialty,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);
  const stateName = US_STATES.find((s) => s.abbr === params.state?.toUpperCase())?.name;
  const queryLabel = [params.q, params.specialty, stateName ?? params.state].filter(Boolean).join(" · ");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Filters bar */}
      <form method="GET" className="flex flex-wrap gap-3 mb-8 bg-white border border-gray-200 rounded-lg p-4">
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
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.abbr} value={s.abbr}>{s.name}</option>
          ))}
        </select>
        <select
          name="specialty"
          defaultValue={params.specialty ?? ""}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
        >
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#151515] text-white font-bold px-6 py-2 rounded text-sm hover:opacity-80 transition"
        >
          Search
        </button>
      </form>

      <h1 className="text-2xl font-black text-[#151515] mb-1">
        {queryLabel ? `Results for "${queryLabel}"` : "All Therapists"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {total} therapist{total !== 1 ? "s" : ""} found
      </p>

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

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => {
                const p = i + 1;
                const sp = new URLSearchParams({
                  ...(params.q && { q: params.q }),
                  ...(params.state && { state: params.state }),
                  ...(params.specialty && { specialty: params.specialty }),
                  page: String(p),
                });
                return (
                  <a
                    key={p}
                    href={`/search?${sp}`}
                    className={`px-4 py-2 rounded text-sm font-bold border transition ${
                      p === page
                        ? "bg-[#151515] text-white border-[#151515]"
                        : "border-gray-300 text-[#151515] hover:bg-[#151515] hover:text-white hover:border-[#151515]"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
