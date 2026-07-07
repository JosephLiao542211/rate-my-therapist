import { getAllUsers } from "@/lib/admin-data";
import { setUserRoleAction } from "@/app/admin/actions";

export default async function AdminUsersPage() {
  const { users, total } = await getAllUsers({ limit: 100 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Users</h1>
        <p className="text-sm text-gray-500">{total} registered users.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Name</th>
              <th className="text-left px-4 py-3 font-bold">Email</th>
              <th className="text-left px-4 py-3 font-bold">Reviews</th>
              <th className="text-left px-4 py-3 font-bold">Joined</th>
              <th className="text-left px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">{u.review_count}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      u.role === "admin" ? "bg-[#151515] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={setUserRoleAction.bind(null, u.id, u.role === "admin" ? "user" : "admin")}>
                    <button className="text-xs font-bold text-gray-600 hover:text-[#151515] underline">
                      {u.role === "admin" ? "Revoke admin" : "Make admin"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-sm text-gray-400 p-8 text-center">No users yet.</p>}
      </div>
    </div>
  );
}
