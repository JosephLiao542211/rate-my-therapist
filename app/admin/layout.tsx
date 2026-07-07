import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-8 items-start">
      <div className="flex flex-col gap-1">
        <div className="pt-6 pr-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Admin</p>
          <p className="text-sm text-gray-500 truncate max-w-[13rem]">{admin.email}</p>
        </div>
        <AdminNav />
      </div>
      <div className="flex-1 min-w-0 py-6">{children}</div>
    </div>
  );
}
