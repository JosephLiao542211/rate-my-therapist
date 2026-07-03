import Link from "next/link";
import type { Therapist } from "@/lib/therapists";

function ratingBg(rating: number): string {
  if (rating >= 4) return "bg-[#41F9C0]";
  if (rating >= 3) return "bg-[#FFF155]";
  return "bg-[#FF969A]";
}

export default function TherapistCard({ therapist }: { therapist: Therapist }) {
  const hasRating = therapist.review_count > 0;
  const ratingDisplay = hasRating ? Number(therapist.avg_rating).toFixed(1) : "0.0";
  const badgeBg = hasRating ? ratingBg(Number(therapist.avg_rating)) : "bg-[#E8E8E8]";
  const location = [therapist.city, therapist.state_abbr].filter(Boolean).join(", ");

  return (
    <Link
      href={`/therapist/${therapist.slug}`}
      className="relative block bg-white hover:bg-[#F5F5F5] border border-gray-200 rounded-lg p-5 transition group"
    >
      <div className="flex gap-6 items-center">
        {/* Rating badge */}
        <div className="text-center shrink-0 w-16">
          <p className="font-poppins text-[10px] font-bold uppercase tracking-widest text-[#151515] mb-1">
            Quality
          </p>
          <div className={`${badgeBg} w-16 h-16 flex items-center justify-center`}>
            <span className="font-poppins text-2xl font-black text-[#151515]">{ratingDisplay}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {therapist.review_count} {therapist.review_count === 1 ? "rating" : "ratings"}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-poppins font-black text-xl text-[#151515] group-hover:underline truncate">
            {therapist.name}
          </h3>
          {therapist.specialties[0] && (
            <p className="text-sm text-[#151515] truncate">{therapist.specialties[0]}</p>
          )}
          <p className="text-sm text-gray-500 truncate">
            {[therapist.practice_name, location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Bookmark icon */}
      <svg
        className="absolute top-5 right-5 w-5 h-5 text-gray-400 group-hover:text-gray-600 transition"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </Link>
  );
}
