import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import HeroSearch from "@/components/HeroSearch";
import LocationHero from "@/components/LocationHero";
import TherapistCard from "@/components/TherapistCard";
import { SPECIALTIES } from "@/lib/constants";
import { searchTherapists, getTopLocations } from "@/lib/therapists";
import { getTopClinics } from "@/lib/clinics";
import { LOCATION_COOKIE } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Rate My Therapist — Find & Review Therapists Near You",
  description:
    "Browse thousands of honest therapist reviews. Find the right mental health professional by specialty, city, and rating.",
};

// Personalizes "Top-Rated Therapists" once the visitor has granted browser
// geolocation (see LocationHero, which sets the rmt_city cookie) — reading
// a cookie forces this page to render per-request rather than via ISR.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const geoCity = cookieStore.get(LOCATION_COOKIE)?.value ?? null;

  const [geoResult, topLocations, topClinics] = await Promise.all([
    geoCity ? searchTherapists({ city: geoCity, limit: 6 }) : Promise.resolve({ therapists: [], total: 0 }),
    getTopLocations(12),
    getTopClinics(12),
  ]);

  let topTherapists = geoResult.therapists;
  let sectionCity = topTherapists.length > 0 ? geoCity : null;
  if (topTherapists.length === 0) {
    const fallback = await searchTherapists({ limit: 6 });
    topTherapists = fallback.therapists;
  }

  return (
    <>
      {/* Hero — dark overlay photo style like RMP */}
      <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden">
        {/* Banner photo */}
        <Image
          src="/pexels-rdne-9064679.webp"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center">
          {/* RMP-style logo text */}
          <div className="inline-flex items-center gap-0 mb-8">
            <span className="bg-white text-[#151515] text-xs font-black uppercase tracking-widest px-3 py-1.5">
              RATE MY
            </span>
            <span className="bg-transparent border border-white text-white text-xs font-black uppercase tracking-widest px-3 py-1.5">
              THERAPIST
            </span>
          </div>

          <LocationHero />

          <HeroSearch />

          <Link
            href="/search"
            className="mt-4 inline-block text-gray-300 text-sm underline underline-offset-2 hover:text-white transition"
          >
            I want to find a therapist in a different location
          </Link>
        </div>
      </section>

      {/* Top-rated therapists */}
      {topTherapists.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-black text-[#151515] mb-6">
            {sectionCity ? `Top-Rated Therapists in ${sectionCity}` : "Top-Rated Therapists"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topTherapists.map((t) => (
              <TherapistCard key={t.id} therapist={t} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/search" className="text-sm font-semibold underline underline-offset-2 hover:opacity-70 transition">
              View all therapists →
            </Link>
          </div>
        </section>
      )}

      {/* Specialty browse */}
      <section className="bg-white border-t border-b border-gray-200 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-black text-[#151515] mb-6">Browse by Specialty</h2>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => {
              const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              return (
                <Link
                  key={s}
                  href={`/specialty/${slug}`}
                  className="border border-[#151515] text-[#151515] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#151515] hover:text-white transition"
                >
                  {s}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location browse */}
      {topLocations.length > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-black text-[#151515] mb-6">Browse by Location</h2>
            <div className="flex flex-wrap gap-2">
              {topLocations.map((l) => {
                const stateSlug = l.state_abbr.toLowerCase();
                const citySlug = l.city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={`${l.state_abbr}-${l.city}`}
                    href={`/location/${stateSlug}/${citySlug}`}
                    className="border border-[#151515] text-[#151515] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#151515] hover:text-white transition"
                  >
                    {l.city}, {l.state_abbr}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Clinic browse */}
      {topClinics.length > 0 && (
        <section className="bg-white border-t border-b border-gray-200 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-black text-[#151515] mb-6">Browse by Clinic</h2>
            <div className="flex flex-wrap gap-2">
              {topClinics.map((c) => (
                <Link
                  key={c.id}
                  href={`/clinic/${c.slug}`}
                  className="border border-[#151515] text-[#151515] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#151515] hover:text-white transition"
                >
                  {c.name}
                  {c.city ? `, ${c.city}` : ""}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free tools */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#151515]">Free Tools</h2>
          <Link href="/tools" className="text-sm font-bold text-[#0057FF] hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/tools/therapist-match-quiz" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#151515] transition">
            <p className="font-black text-[#151515] mb-1">Therapist Match Quiz</p>
            <p className="text-xs text-gray-500">Get matched with therapists near you.</p>
          </Link>
          <Link href="/tools/therapy-style-quiz" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#151515] transition">
            <p className="font-black text-[#151515] mb-1">Therapy Style Quiz</p>
            <p className="text-xs text-gray-500">Find which approach fits how you think.</p>
          </Link>
          <Link href="/tools/is-cbt-right-for-you" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#151515] transition">
            <p className="font-black text-[#151515] mb-1">Is CBT Right for You?</p>
            <p className="text-xs text-gray-500">A quick fit check for CBT.</p>
          </Link>
          <Link href="/tools/questions-to-ask-your-therapist" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#151515] transition">
            <p className="font-black text-[#151515] mb-1">Questions to Ask</p>
            <p className="text-xs text-gray-500">Printable checklist for your first session.</p>
          </Link>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-black text-[#151515] mb-2">Join the RMT Family</h2>
        <p className="text-gray-500 text-lg mb-8">Love RMT? Let&apos;s make it official.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/add-therapist"
            className="bg-[#151515] text-white font-bold px-8 py-3 rounded-full hover:opacity-80 transition text-sm"
          >
            Add a Therapist
          </Link>
          <Link
            href="/search"
            className="border-2 border-[#151515] text-[#151515] font-bold px-8 py-3 rounded-full hover:bg-[#151515] hover:text-white transition text-sm"
          >
            Find a Therapist
          </Link>
        </div>
      </section>
    </>
  );
}
