import Link from "next/link";
import type { Therapist } from "@/lib/therapists";

function ratingBg(rating: number): string {
  if (rating >= 4) return "bg-[#41F9C0]";
  if (rating >= 3) return "bg-[#FFF155]";
  return "bg-[#FF969A]";
}

export default function TherapistCard({ therapist }: { therapist: Therapist }) {
  const hasRating = therapist.review_count > 0;
  const ratingDisplay = hasRating ? Number(therapist.avg_rating).toFixed(2) : "N/A";
  const badgeBg = hasRating ? ratingBg(Number(therapist.avg_rating)) : "bg-[#E8E8E8]";

  return (
    <Link
      href={`/therapist/${therapist.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition group"
    >
      <div className="flex gap-4 items-start">
        {/* Rating badge */}
        <div className={`${badgeBg} w-16 h-16 flex items-center justify-center shrink-0`}>
          <span className="text-xl font-black text-[#151515]">{ratingDisplay}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xl text-[#151515] group-hover:underline truncate">
            {therapist.name}
          </h3>
          {therapist.practice_name && (
            <p className="text-sm text-gray-500 truncate">{therapist.practice_name}</p>
          )}
          <p className="text-sm text-gray-500">
            {[therapist.city, therapist.state_abbr].filter(Boolean).join(", ")}
          </p>
          {therapist.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {therapist.specialties.slice(0, 3).map((s) => (
                <span key={s} className="text-xs border border-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">
            {therapist.review_count} {therapist.review_count === 1 ? "rating" : "ratings"}
          </p>
        </div>
      </div>
    </Link>
  );
}
