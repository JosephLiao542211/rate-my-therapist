"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCheck, MessageSquare, Users, ScrollText, Inbox, Newspaper, Copy } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/therapists", label: "Therapists", icon: UserCheck },
  { href: "/admin/duplicates", label: "Duplicate Flags", icon: Copy },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/logs", label: "Audit Log", icon: ScrollText },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 flex flex-col gap-1 py-6 pr-4">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              active
                ? "bg-[#151515] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
