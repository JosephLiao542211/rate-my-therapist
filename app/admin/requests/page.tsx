import Link from "next/link";
import { getRequests } from "@/lib/requests";
import { resolveRequestAction } from "@/app/admin/actions";
import { formatDistanceToNow } from "@/lib/format-time";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = statusParam === "resolved" ? "resolved" : "open";
  const { requests, total } = await getRequests({ status, limit: 100 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Requests</h1>
        <p className="text-sm text-gray-500">Claim requests and site feedback from visitors.</p>
      </div>

      <div className="flex gap-2 text-xs font-bold">
        <FilterChip label="Open" href="/admin/requests?status=open" active={status === "open"} />
        <FilterChip label="Resolved" href="/admin/requests?status=resolved" active={status === "resolved"} />
      </div>

      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm mb-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    r.type === "claim" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.type === "claim" ? "Claim" : "Feedback"}
                </span>
                {r.therapist_id && (
                  <Link href={`/admin/therapists/${r.therapist_id}/edit`} className="font-semibold hover:underline">
                    {r.therapist_name}
                  </Link>
                )}
                <span className="text-gray-400 text-xs">{formatDistanceToNow(r.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {r.name && <>{r.name} · </>}
                {r.email ?? "no email provided"}
              </p>
            </div>
            {status === "open" && (
              <form action={resolveRequestAction.bind(null, r.id)} className="shrink-0">
                <button className="border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded hover:border-[#151515] hover:text-[#151515] transition">
                  Mark Resolved
                </button>
              </form>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
            No {status} requests.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">{total} {status} request{total === 1 ? "" : "s"}.</p>
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full border transition ${
        active ? "bg-[#151515] text-white border-[#151515]" : "border-gray-300 text-gray-600 hover:border-gray-400"
      }`}
    >
      {label}
    </Link>
  );
}
