"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    else router.push("/search");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
          🍎
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Therapist name"
          className="w-full rounded-full bg-white pl-12 pr-6 py-4 text-[#151515] text-lg placeholder-gray-400 focus:outline-none shadow-lg"
        />
      </div>
    </form>
  );
}
