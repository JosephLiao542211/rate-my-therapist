"use client";

import { useEffect, useState } from "react";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function NearMeFilter() {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    setCity(getCookie("rmt_city"));
  }, []);

  if (!city) return null;

  return (
    <a
      href={`/search?city=${encodeURIComponent(city)}`}
      className="border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] hover:bg-[#151515] hover:text-white hover:border-[#151515] transition whitespace-nowrap"
    >
      Near me ({city})
    </a>
  );
}
