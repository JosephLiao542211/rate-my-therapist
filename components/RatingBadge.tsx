function ratingColor(rating: number): string {
  if (rating >= 4) return "bg-[#41F9C0]";
  if (rating >= 3) return "bg-[#FFF155]";
  return "bg-[#FF969A]";
}

export default function RatingBadge({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const color = rating > 0 ? ratingColor(Number(rating)) : "bg-[#E8E8E8]";

  const sizeClass =
    size === "lg"
      ? "w-20 h-20 text-3xl font-black"
      : size === "md"
      ? "w-14 h-14 text-xl font-black"
      : "w-10 h-10 text-base font-black";

  const display = rating > 0 ? Number(rating).toFixed(1) : "N/A";

  return (
    <div
      className={`${color} ${sizeClass} flex items-center justify-center text-[#151515] shrink-0`}
    >
      {display}
    </div>
  );
}
