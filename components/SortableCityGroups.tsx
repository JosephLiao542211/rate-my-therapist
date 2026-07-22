"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Therapist } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";
import { sortTherapists, SortSelect, type SortOption } from "@/components/SortableTherapistList";

export default function SortableCityGroups({
  state,
  cities,
  byCity,
}: {
  state: string;
  cities: string[];
  byCity: Record<string, Therapist[]>;
}) {
  const [sort, setSort] = useState<SortOption>("rating-desc");

  const sortedByCity = useMemo(() => {
    const result: Record<string, Therapist[]> = {};
    for (const city of cities) {
      result[city] = sortTherapists(byCity[city], sort);
    }
    return result;
  }, [cities, byCity, sort]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <div className="flex flex-col gap-10">
        {cities.map((city) => {
          const citySlug = city.toLowerCase().replace(/\s+/g, "-");
          const therapists = sortedByCity[city];
          return (
            <section key={city}>
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                <Link
                  href={`/location/${state}/${citySlug}`}
                  className="hover:text-teal-600 transition"
                >
                  {city}
                </Link>
                <span className="text-sm text-gray-400 font-normal ml-2">
                  ({therapists.length})
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {therapists.slice(0, 5).map((t) => (
                  <TherapistCard key={t.id} therapist={t} />
                ))}
                {therapists.length > 5 && (
                  <Link
                    href={`/location/${state}/${citySlug}`}
                    className="text-sm text-teal-600 font-semibold hover:underline"
                  >
                    View all {therapists.length} therapists in {city} →
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
