"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "rmt_city";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

export default function LocationHero() {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCookie(COOKIE_NAME);
    if (cached) {
      setCity(cached);
      return;
    }

    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const found = data.city || data.locality || data.principalSubdivision;
          if (found) {
            setCity(found);
            setCookie(COOKIE_NAME, found);
          }
        } catch {
          // ignore — fall back to placeholder
        }
      },
      () => {
        // permission denied or unavailable — fall back to placeholder
      }
    );
  }, []);

  return (
    <p className="text-white text-2xl font-bold mb-8">
      Find a <strong>therapist</strong> near{" "}
      <span className={city ? undefined : "text-gray-300 italic font-normal"}>
        {city ?? "your city"}
      </span>
    </p>
  );
}
