import Link from "next/link";
import { getDuplicatePairs } from "@/lib/duplicates";
import { mergeDuplicatesAction, dismissDuplicateAction } from "@/app/admin/actions";
import { formatDistanceToNow } from "@/lib/format-time";
import type { DuplicateCandidate } from "@/lib/duplicates";

const PAGE_SIZE = 25;

export default async function AdminDuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { pairs, total } = await getDuplicatePairs({ limit: PAGE_SIZE, offset });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Duplicate Flags</h1>
        <p className="text-sm text-gray-500">
          Therapists that share the same name, city, and state across sources — likely the same
          person seeded twice (e.g. once from Psychology Today, once from GoodTherapy).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {pairs.map((pair) => (
          <div key={`${pair.a.id}-${pair.b.id}`} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Candidate candidate={pair.a} />
              <Candidate candidate={pair.b} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <form action={mergeDuplicatesAction.bind(null, pair.a.id, pair.b.id)}>
                <button className="text-xs font-bold px-3 py-2 rounded bg-[#151515] text-white hover:opacity-80 transition">
                  Keep &ldquo;{pair.a.name}&rdquo; (archive other)
                </button>
              </form>
              <form action={mergeDuplicatesAction.bind(null, pair.b.id, pair.a.id)}>
                <button className="text-xs font-bold px-3 py-2 rounded bg-[#151515] text-white hover:opacity-80 transition">
                  Keep &ldquo;{pair.b.name}&rdquo; (archive other)
                </button>
              </form>
              <form action={dismissDuplicateAction.bind(null, pair.a.id, pair.b.id)}>
                <button className="text-xs font-bold px-3 py-2 rounded border border-gray-300 text-gray-600 hover:border-[#151515] hover:text-[#151515] transition">
                  Not a duplicate
                </button>
              </form>
            </div>
          </div>
        ))}
        {pairs.length === 0 && (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
            No flagged duplicates right now.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs font-bold">
          <PageLink page={page - 1} disabled={page <= 1} label="← Prev" />
          <span className="text-gray-400">
            Page {page} of {totalPages} ({total} flagged pairs)
          </span>
          <PageLink page={page + 1} disabled={page >= totalPages} label="Next →" />
        </div>
      )}
    </div>
  );
}

function Candidate({ candidate: c }: { candidate: DuplicateCandidate }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-gray-50">
      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts (PT/GT), not configured in next.config images */}
        {c.photo_url && <img src={c.photo_url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0">
        <Link href={`/admin/therapists/${c.id}/edit`} className="font-semibold text-sm hover:underline">
          {c.name}
        </Link>
        <p className="text-xs text-gray-500">
          {c.city}, {c.state_abbr}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {c.pt_uuid && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              Psychology Today
            </span>
          )}
          {c.gt_id && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              GoodTherapy
            </span>
          )}
          {c.review_count > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              {c.review_count} review{c.review_count === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Added {formatDistanceToNow(c.created_at)}</p>
      </div>
    </div>
  );
}

function PageLink({ page, disabled, label }: { page: number; disabled: boolean; label: string }) {
  if (disabled) {
    return <span className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-300">{label}</span>;
  }
  return (
    <Link
      href={`/admin/duplicates?page=${page}`}
      className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 transition"
    >
      {label}
    </Link>
  );
}
