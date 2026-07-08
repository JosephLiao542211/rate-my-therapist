import type { MetadataRoute } from "next";
import { getAllTherapistSlugs, getAllLocations, getAllSpecialties } from "@/lib/therapists";
import { getAllClinicSlugs } from "@/lib/clinics";
import { getAllPostSlugs } from "@/lib/posts";
import { SPECIALTIES } from "@/lib/constants";
import { HELP_ARTICLES } from "@/lib/help";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://rate-my-therapist.com";

const TOOL_SLUGS = [
  "therapist-match-quiz",
  "therapy-style-quiz",
  "is-cbt-right-for-you",
  "questions-to-ask-your-therapist",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, locations, dbSpecialties, clinicSlugs, postSlugs] = await Promise.all([
    getAllTherapistSlugs(),
    getAllLocations(),
    getAllSpecialties(),
    getAllClinicSlugs(),
    getAllPostSlugs(),
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
    { url: `${BASE}/tools`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/help`, lastModified: new Date(), priority: 0.7 },

    ...HELP_ARTICLES.map((a) => ({
      url: `${BASE}/help/${a.slug}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),

    ...TOOL_SLUGS.map((slug) => ({
      url: `${BASE}/tools/${slug}`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),

    ...postSlugs.map((slug) => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),

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

    ...clinicSlugs.map((slug) => ({
      url: `${BASE}/clinic/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
      changeFrequency: "weekly" as const,
    })),
  ];
}
