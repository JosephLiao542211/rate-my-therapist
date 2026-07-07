import Link from "next/link";
import { getAuditLog } from "@/lib/audit";

const ENTITY_TYPES = ["therapist", "request", "review", "user"];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { page: pageParam, type } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 50;
  const { entries, total } = await getAuditLog({
    entity_type: type,
    limit,
    offset: (page - 1) * limit,
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Audit Log</h1>
        <p className="text-sm text-gray-500">{total} logged actions.</p>
      </div>

      <div className="flex gap-2 text-xs font-bold">
        <FilterChip label="All" href="/admin/logs" active={!type} />
        {ENTITY_TYPES.map((t) => (
          <FilterChip key={t} label={t} href={`/admin/logs?type=${t}`} active={type === t} />
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-bold">When</th>
              <th className="text-left px-4 py-3 font-bold">Actor</th>
              <th className="text-left px-4 py-3 font-bold">Action</th>
              <th className="text-left px-4 py-3 font-bold">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{e.actor_email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5">{e.action}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {e.entity_type}
                  {e.entity_label && <>: {e.entity_label}</>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-gray-400 p-8 text-center">No log entries.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/admin/logs?page=${page - 1}${type ? `&type=${type}` : ""}`} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Previous
            </Link>
          )}
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/logs?page=${page + 1}${type ? `&type=${type}` : ""}`} className="px-3 py-1.5 border border-gray-300 rounded font-semibold">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full border capitalize transition ${
        active ? "bg-[#151515] text-white border-[#151515]" : "border-gray-300 text-gray-600 hover:border-gray-400"
      }`}
    >
      {label}
    </Link>
  );
}
