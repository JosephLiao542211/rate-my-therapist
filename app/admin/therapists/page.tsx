import Link from "next/link";
import { searchTherapistsAdmin } from "@/lib/therapists";
import { US_STATES, SPECIALTIES } from "@/lib/constants";
import { approveTherapistAction, rejectTherapistAction, archiveTherapistAction } from "@/app/admin/actions";
import ConfirmButton from "@/components/ConfirmButton";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-300",
  approved: "bg-green-50 text-green-700 border-green-300",
  rejected: "bg-red-50 text-red-700 border-red-300",
  archived: "bg-gray-100 text-gray-500 border-gray-300",
};

export default async function AdminTherapistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; specialty?: string; status?: string; page?: string }>;
}) {
  const { q, state, specialty, status, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;

  const validStatus = status === "pending" || status === "approved" || status === "rejected" ? status : undefined;

  const { therapists, total } = await searchTherapistsAdmin({
    q,
    state,
    specialty,
    status: validStatus,
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, state, specialty, status, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return `/admin/therapists?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Therapists</h1>
          <p className="text-sm text-gray-500">{total} therapist{total === 1 ? "" : "s"} found.</p>
        </div>
        <Link href="/admin/therapists/archived" className="text-sm font-semibold text-gray-500 hover:text-[#151515]">
          View archived →
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
            className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">State</label>
          <select name="state" defaultValue={state ?? ""} className="border border-gray-300 rounded px-3 py-2 text-sm w-36">
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Specialty</label>
          <select name="specialty" defaultValue={specialty ?? ""} className="border border-gray-300 rounded px-3 py-2 text-sm w-44">
            <option value="">All specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</label>
          <select name="status" defaultValue={status ?? ""} className="border border-gray-300 rounded px-3 py-2 text-sm w-36">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button className="bg-[#151515] text-white text-sm font-bold px-4 py-2 rounded hover:opacity-80 transition">
          Filter
        </button>
        {(q || state || specialty || status) && (
          <Link href="/admin/therapists" className="text-sm font-semibold text-gray-500 hover:text-[#151515] px-2 py-2">
            Clear
          </Link>
        )}
      </form>

      {therapists.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
          No therapists match these filters.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{t.name}</p>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {t.practice_name && <>{t.practice_name} · </>}
                  {t.city}, {t.state_abbr}
                </p>
                {t.credentials?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{t.credentials.join(", ")}</p>
                )}
                {t.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.specialties.slice(0, 6).map((s) => (
                      <span key={s} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {t.avg_rating}★ · {t.review_count} review{t.review_count === 1 ? "" : "s"}
                  {t.email && <> · {t.email}</>}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 items-end">
                <Link
                  href={`/admin/therapists/${t.id}/edit`}
                  className="bg-[#151515] text-white text-xs font-bold px-3 py-2 rounded hover:opacity-80 transition"
                >
                  Edit
                </Link>
                {t.status === "pending" && (
                  <div className="flex gap-2">
                    <form action={approveTherapistAction.bind(null, t.id)}>
                      <button className="border border-gray-300 text-xs font-bold px-3 py-1.5 rounded hover:border-green-400 hover:text-green-600 transition">
                        Approve
                      </button>
                    </form>
                    <form action={rejectTherapistAction.bind(null, t.id)}>
                      <button className="border border-gray-300 text-xs font-bold px-3 py-1.5 rounded hover:border-red-400 hover:text-red-600 transition">
                        Reject
                      </button>
                    </form>
                  </div>
                )}
                <form action={archiveTherapistAction.bind(null, t.id)}>
                  <ConfirmButton
                    message={`Archive ${t.name}? Their profile and ${t.review_count} review${t.review_count === 1 ? "" : "s"} will be hidden from the site. You can restore them later from the Archived view.`}
                    className="text-xs font-bold px-3 py-1.5 rounded text-red-500 hover:bg-red-50 transition"
                  >
                    Delete
                  </ConfirmButton>
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
