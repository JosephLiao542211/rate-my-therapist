import Link from "next/link";
import { getDashboardMetrics } from "@/lib/admin-data";
import { getAuditLog } from "@/lib/audit";
import { formatDistanceToNow } from "@/lib/format-time";

export default async function AdminOverviewPage() {
  const [metrics, { entries }] = await Promise.all([
    getDashboardMetrics(),
    getAuditLog({ limit: 12 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black">Overview</h1>
        <p className="text-sm text-gray-500">Live metrics across the site.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending Approvals" value={metrics.pendingTherapists} href="/admin/therapists?status=pending" highlight={metrics.pendingTherapists > 0} />
        <StatCard label="Open Requests" value={metrics.openRequests} href="/admin/requests" highlight={metrics.openRequests > 0} />
        <StatCard label="Total Therapists" value={metrics.totalTherapists} sub={`${metrics.therapistsLast7Days} new (7d)`} />
        <StatCard label="Total Reviews" value={metrics.totalReviews} sub={`${metrics.reviewsLast7Days} new (7d)`} href="/admin/reviews" />
        <StatCard label="Total Users" value={metrics.totalUsers} href="/admin/users" />
        <StatCard label="Approved Therapists" value={metrics.approvedTherapists} />
        <StatCard label="Rejected Therapists" value={metrics.rejectedTherapists} />
        <StatCard label="Archived Therapists" value={metrics.archivedTherapists} href="/admin/therapists/archived" />
        <StatCard label="Avg. Rating" value={metrics.avgRating ?? "—"} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">Recent Activity</h2>
          <Link href="/admin/logs" className="text-sm font-semibold text-gray-600 hover:text-[#151515]">
            View full log →
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          {entries.length === 0 && (
            <p className="p-6 text-sm text-gray-400 text-center">No activity yet.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="min-w-0">
                <span className="font-semibold">{e.actor_email ?? "Anonymous"}</span>{" "}
                <span className="text-gray-500">{humanizeAction(e.action)}</span>{" "}
                {e.entity_label && <span className="font-medium truncate">{e.entity_label}</span>}
              </div>
              <span className="text-gray-400 shrink-0 ml-4 text-xs">{formatDistanceToNow(e.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function humanizeAction(action: string): string {
  return action.replace(/\./g, " ").replace("_", " ");
}

function StatCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`border rounded-lg p-4 h-full ${
        highlight ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition">
      {content}
    </Link>
  ) : (
    content
  );
}
