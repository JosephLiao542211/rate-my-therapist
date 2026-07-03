import type { MetadataRoute } from "next";
import { getAllTherapistSlugs, getAllLocations, getAllSpecialties } from "@/lib/therapists";
import { SPECIALTIES } from "@/lib/constants";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://rate-my-therapist.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, locations, dbSpecialties] = await Promise.all([
    getAllTherapistSlugs(),
    getAllLocations(),
    getAllSpecialties(),
  ]);

  const allSpecialtySlugs = new Set([
    ...SPECIALTIES.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    ...dbSpecialties.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  ]);

  const stateSlugs = [...new Set(locations.map((l) => l.state_abbr.toLowerCase()))];

  return [
    { url: BASE, lastModified: new Date(), priority: 1 },
    { url: `${BASE}/search`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/add-therapist`, lastModified: new Date(), priority: 0.6 },

    ...slugs.map((slug) => ({
      url: `${BASE}/therapist/${slug}`,
      lastModified: new Date(),
      priority: 0.9,
      changeFrequency: "weekly" as const,
    })),

    ...stateSlugs.map((state) => ({
      url: `${BASE}/location/${state}`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    })),

    ...locations.map((l) => ({
      url: `${BASE}/location/${l.state_abbr.toLowerCase()}/${l.city.toLowerCase().replace(/\s+/g, "-")}`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "weekly" as const,
    })),

    ...[...allSpecialtySlugs].map((slug) => ({
      url: `${BASE}/specialty/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "weekly" as const,
    })),
  ];
}
