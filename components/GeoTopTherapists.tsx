"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TherapistCard from "./TherapistCard";
import { LOCATION_COOKIE } from "@/lib/geo";
import type { Therapist } from "@/lib/therapists";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Client island so the homepage server component can stay static (ISR) while
// still personalizing "Top-Rated Therapists in <city>" for returning visitors
// who have granted geolocation (see LocationHero, which sets the cookie).
// Bots and first-time visitors never trigger this, so it doesn't affect the
// crawled/indexed page.
export default function GeoTopTherapists() {
  const [data, setData] = useState<{ city: string; therapists: Therapist[] } | null>(null);

  useEffect(() => {
    const cached = getCookie(LOCATION_COOKIE);
    if (!cached) return;
    let active = true;
    fetch(`/api/therapists?city=${encodeURIComponent(cached)}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setData({ city: cached, therapists: d.therapists ?? [] });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!data || data.therapists.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-black text-[#151515] mb-6">
        Top-Rated Therapists in {data.city}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.therapists.map((t) => (
          <TherapistCard key={t.id} therapist={t} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/search"
          className="text-sm font-semibold underline underline-offset-2 hover:opacity-70 transition"
        >
          View all therapists →
        </Link>
      </div>
    </section>
  );
}
