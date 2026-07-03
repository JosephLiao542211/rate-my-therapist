import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";
import TherapistCard from "@/components/TherapistCard";
import { SPECIALTIES } from "@/lib/constants";
import { searchTherapists } from "@/lib/therapists";

export const metadata: Metadata = {
  title: "Rate My Therapist — Find & Review Therapists Near You",
  description:
    "Browse thousands of honest therapist reviews. Find the right mental health professional by specialty, city, and rating.",
};

export const revalidate = 3600;

export default async function HomePage() {
  const { therapists: topTherapists } = await searchTherapists({ limit: 6 });

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

          <p className="text-white text-2xl font-bold mb-8">
            Find a <strong>therapist</strong> near you
          </p>

          <HeroSearch />

          <p className="mt-4 text-gray-300 text-sm underline underline-offset-2 cursor-pointer hover:text-white transition">
            I want to find a therapist in a different location
          </p>
        </div>
      </section>

      {/* Top-rated therapists */}
      {topTherapists.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-black text-[#151515] mb-6">Top-Rated Therapists</h2>
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
