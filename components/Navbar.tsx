"use client";

import Link from "next/link";
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
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 border border-white text-white font-black text-xs tracking-widest px-2 py-1 hover:bg-white hover:text-[#151515] transition"
        >
          RMT
        </Link>

        {/* Therapists dropdown stub */}
        <button className="flex items-center gap-1 text-white text-sm font-medium hover:text-gray-300 transition shrink-0">
          <span>🍎</span>
          <span>Therapists</span>
          <svg className="w-3.5 h-3.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Search bar — center */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🍎</span>
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
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-white text-sm"
              >
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                    {session.user?.name?.[0] ?? "U"}
                  </div>
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm z-50">
                  <p className="px-4 py-2 text-gray-400 text-xs truncate">{session.user?.email}</p>
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
                className="text-white text-sm font-medium hover:text-gray-300 transition"
              >
                Log In
              </button>
              <button
                onClick={() => signIn("google")}
                className="border border-white text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-white hover:text-[#151515] transition"
              >
                Sign Up
              </button>
            </>
          )}
          <Link
            href="/add-therapist"
            className="text-white text-sm font-medium bg-transparent border border-gray-600 px-3 py-1.5 rounded-full hover:border-gray-400 transition"
          >
            Help
          </Link>
        </div>
      </div>
    </nav>
  );
}
