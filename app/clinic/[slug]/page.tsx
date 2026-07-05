import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClinicBySlug, getAllClinicSlugs, getTherapistsForClinic, getTherapistCountForClinic } from "@/lib/clinics";
import TherapistCard from "@/components/TherapistCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BASE } from "@/lib/seo";

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllClinicSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) return { title: "Clinic Not Found" };
  const location = [clinic.city, clinic.state_abbr].filter(Boolean).join(", ");
  const therapistCount = await getTherapistCountForClinic(clinic.id);
  // A clinic with no linked therapists carries no unique content yet — keep
  // it out of the index until at least one therapist page points here.
  const isThin = therapistCount === 0;
  return {
    title: `${clinic.name} — ${location}`,
    description: `Find therapists at ${clinic.name}${location ? ` in ${location}` : ""}. Read reviews and compare therapists at this practice.`,
    alternates: { canonical: `${BASE}/clinic/${slug}` },
    robots: isThin ? { index: false, follow: true } : undefined,
  };
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) notFound();

  const therapists = await getTherapistsForClinic(clinic.id);
  const location = [clinic.city, clinic.state_abbr].filter(Boolean).join(", ");
  const stateSlug = clinic.state_abbr?.toLowerCase();
  const citySlug = clinic.city?.toLowerCase().replace(/\s+/g, "-");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: clinic.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.address_line ?? undefined,
      addressLocality: clinic.city ?? undefined,
      addressRegion: clinic.state_abbr ?? undefined,
      postalCode: clinic.postal_code ?? undefined,
      addressCountry: clinic.country_code,
    },
    telephone: clinic.phone ?? undefined,
    url: clinic.website ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { name: "Home", url: "/" },
            ...(stateSlug ? [{ name: clinic.state_abbr!, url: `/location/${stateSlug}` }] : []),
            ...(stateSlug && citySlug
              ? [{ name: clinic.city!, url: `/location/${stateSlug}/${citySlug}` }]
              : []),
            { name: clinic.name ?? "Clinic", url: `/clinic/${slug}` },
          ]}
        />

        <h1 className="text-3xl font-black text-[#151515] mb-1">{clinic.name}</h1>
        {clinic.address_line && (
          <p className="text-sm text-gray-500">{clinic.address_line}</p>
        )}
        {location && <p className="text-sm text-gray-500 mb-2">{location}</p>}
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          {clinic.phone && (
            <a href={`tel:${clinic.phone}`} className="font-semibold hover:underline">
              📞 {clinic.phone}
            </a>
          )}
          {clinic.website && (
            <a
              href={clinic.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              🌐 Website
            </a>
          )}
        </div>

        <h2 className="text-sm font-bold text-[#151515] border-b-2 border-[#151515] inline-block pb-1 mb-6">
          {therapists.length} Therapist{therapists.length === 1 ? "" : "s"} at this Practice
        </h2>

        {therapists.length === 0 ? (
          <p className="text-gray-400 py-10 text-center">No therapists listed at this practice yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {therapists.map((t) => (
              <TherapistCard key={t.id} therapist={t} />
            ))}
          </div>
        )}

        {citySlug && stateSlug && (
          <p className="mt-8 text-sm text-gray-500">
            Looking for other options?{" "}
            <Link href={`/location/${stateSlug}/${citySlug}`} className="font-semibold underline hover:opacity-70">
              See all therapists in {clinic.city}
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
