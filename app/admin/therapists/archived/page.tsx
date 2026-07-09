import Link from "next/link";
import { getArchivedTherapists } from "@/lib/therapists";
import { restoreTherapistAction } from "@/app/admin/actions";

export default async function ArchivedTherapistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;

  const { therapists, total } = await getArchivedTherapists({
    q,
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return `/admin/therapists/archived?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Archived Therapists</h1>
          <p className="text-sm text-gray-500">{total} archived therapist{total === 1 ? "" : "s"}.</p>
        </div>
        <Link href="/admin/therapists" className="text-sm font-semibold text-gray-500 hover:text-[#151515]">
          ← Back to directory
        </Link>
      </div>

      <form className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Name, practice, email…"
            className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
          />
        </div>
        <button className="bg-[#151515] text-white text-sm font-bold px-4 py-2 rounded hover:opacity-80 transition">
          Filter
        </button>
        {q && (
          <Link href="/admin/therapists/archived" className="text-sm font-semibold text-gray-500 hover:text-[#151515] px-2 py-2">
            Clear
          </Link>
        )}
      </form>

      {therapists.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
          No archived therapists{q ? " match this search" : ""}.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-500">
                  {t.practice_name && <>{t.practice_name} · </>}
                  {t.city}, {t.state_abbr}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t.review_count} review{t.review_count === 1 ? "" : "s"}
                  {t.archived_at && <> · Archived {new Date(t.archived_at).toLocaleDateString()}</>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/therapists/${t.id}/edit`}
                  className="border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded hover:border-gray-400 transition"
                >
                  View
                </Link>
                <form action={restoreTherapistAction.bind(null, t.id)}>
                  <button className="bg-[#151515] text-white text-xs font-bold px-3 py-2 rounded hover:opacity-80 transition">
                    Restore
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={buildQuery({ page: String(page - 1) })} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Previous
            </Link>
          )}
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildQuery({ page: String(page + 1) })} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
