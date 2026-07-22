"use client";

import { useMemo, useState } from "react";
import type { Therapist } from "@/lib/therapists";
import TherapistCard from "@/components/TherapistCard";

const SORT_OPTIONS = {
  "rating-desc": "Rating: High to Low",
  "rating-asc": "Rating: Low to High",
  "name-asc": "Name: A-Z",
  "reviews-desc": "Number of Ratings",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export function sortTherapists(therapists: Therapist[], sort: SortOption): Therapist[] {
  const sorted = [...therapists];
  switch (sort) {
    case "rating-desc":
      sorted.sort((a, b) => Number(b.avg_rating) - Number(a.avg_rating));
      break;
    case "rating-asc":
      sorted.sort((a, b) => Number(a.avg_rating) - Number(b.avg_rating));
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "reviews-desc":
      sorted.sort((a, b) => b.review_count - a.review_count);
      break;
  }
  return sorted;
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Sort by
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
      >
        {Object.entries(SORT_OPTIONS).map(([optValue, label]) => (
          <option key={optValue} value={optValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SortableTherapistList({ therapists }: { therapists: Therapist[] }) {
  const [sort, setSort] = useState<SortOption>("rating-desc");
  const sorted = useMemo(() => sortTherapists(therapists, sort), [therapists, sort]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((t) => (
          <TherapistCard key={t.id} therapist={t} />
        ))}
      </div>
    </div>
  );
}
