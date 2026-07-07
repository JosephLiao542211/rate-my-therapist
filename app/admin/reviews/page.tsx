import Link from "next/link";
import { getAllReviews } from "@/lib/reviews";
import { deleteReviewAction } from "@/app/admin/actions";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;
  const { reviews, total } = await getAllReviews({ limit, offset: (page - 1) * limit });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Reviews</h1>
        <p className="text-sm text-gray-500">{total} total reviews.</p>
      </div>

      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{r.rating}★</span>
                <Link href={`/therapist/${r.therapist_slug}`} className="font-semibold text-gray-700 hover:underline">
                  {r.therapist_name}
                </Link>
                <span className="text-gray-400">
                  by {r.is_anonymous ? "Anonymous" : r.author_name ?? "Unknown"}
                </span>
              </div>
              {r.body && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{r.body}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(r.created_at).toLocaleDateString()} · {r.helpful_count} helpful
              </p>
            </div>
            <form action={deleteReviewAction.bind(null, r.id)} className="shrink-0">
              <button className="border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded hover:border-red-400 hover:text-red-600 transition">
                Delete
              </button>
            </form>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
            No reviews yet.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/admin/reviews?page=${page - 1}`} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Previous
            </Link>
          )}
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/reviews?page=${page + 1}`} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
