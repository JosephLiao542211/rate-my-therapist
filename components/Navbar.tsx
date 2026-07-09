"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <nav className="bg-[#151515] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center">
          <Image src="/rmt.svg" alt="Rate My Therapist" width={86} height={49} priority className="h-8 w-auto" />
        </Link>

        {/* Tools / Blog — hidden on small screens */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <Link href="/tools" className="text-white text-sm font-medium hover:text-gray-300 transition">
            Tools
          </Link>
          <Link href="/blog" className="text-white text-sm font-medium hover:text-gray-300 transition">
            Blog
          </Link>
        </div>

        {/* Search bar — center */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Therapist name"
              className="w-full rounded-full bg-white pl-9 pr-4 py-2 text-sm text-[#151515] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-white text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                  {session.user?.name?.[0] ?? "U"}
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                  <p className="px-4 py-2 text-gray-400 text-xs truncate">{session.user?.email}</p>
                  {session.user?.role === "admin" && (
                    <>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-gray-50 font-semibold"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <hr />
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => signIn("google")}
                className="hidden sm:inline text-white text-sm font-medium hover:text-gray-300 transition"
              >
                Log In
              </button>
              <button
                onClick={() => signIn("google")}
                className="border border-white text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 rounded-full hover:bg-white hover:text-[#151515] transition whitespace-nowrap"
              >
                Sign Up
              </button>
            </>
          )}
          <Link
            href="/help"
            className="hidden sm:inline-block text-white text-sm font-medium bg-transparent border border-gray-600 px-3 py-1.5 rounded-full hover:border-gray-400 transition"
          >
            Help
          </Link>
        </div>
      </div>
    </nav>
  );
}
