"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPECIALTIES, US_STATES } from "@/lib/constants";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [specialty, setSpecialty] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    if (specialty) params.set("specialty", specialty);
    router.push(`/search?${params.toString()}`);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Therapist name..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Therapist or practice name..."
        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      >
        <option value="">All states</option>
        {US_STATES.map((s) => (
          <option key={s.abbr} value={s.abbr}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      >
        <option value="">All specialties</option>
        {SPECIALTIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="bg-teal-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-teal-700 transition text-sm"
      >
        Search
      </button>
    </form>
  );
}
