/**
 * Parses a Psychology Today therapist listing page HTML.
 *
 * The __NUXT_DATA__ flat array already contains full profile data
 * (attributes with issues/treatment-orientation, education, credentials)
 * for every therapist on the page — no separate profile fetch needed.
 */

import { extractJsonLd, extractNuxtData, resolveNuxt } from "./nuxt-resolver.js";
import type { PtProfileDetail, PtLocation, PtFees, PtEducation, PtCredentialDetail } from "./types.js";

// ── JSON-LD extraction ──────────────────────────────────────────────────────

interface LdEntry {
  "@type": string;
  "@id": string;
  url: string;
  name: string;
  telephone?: string;
  workLocation?: {
    address?: {
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: { name?: string } | string;
    };
    geo?: { latitude?: number; longitude?: number };
  };
  location?: LdEntry["workLocation"];
}

function extractPersonsFromLd(html: string): LdEntry[] {
  const blocks = extractJsonLd(html);
  const persons: LdEntry[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    const topType = b["@type"] as string;

    if (topType === "Person" || topType === "Organization") {
      persons.push(b as unknown as LdEntry);
      continue;
    }

    // SearchResultsPage — mainEntity is a direct array
    const mainEntity = b["mainEntity"];
    const memberList = Array.isArray(mainEntity)
      ? mainEntity
      : Array.isArray((mainEntity as Record<string, unknown>)?.["itemListElement"])
        ? ((mainEntity as Record<string, unknown>)["itemListElement"] as unknown[]).map(
            (m) => (m as Record<string, unknown>)?.["item"] ?? m
          )
        : [];

    for (const item of memberList) {
      const e = item as Record<string, unknown>;
      const t = e["@type"] as string;
      if (t !== "Person" && t !== "Organization") continue;
      if (!e["workLocation"] && e["location"]) e["workLocation"] = e["location"];
      persons.push(e as unknown as LdEntry);
    }
  }
  return persons;
}

function ptIdFromUrl(url: string): number | null {
  const m = url.match(/\/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function countryFromLd(ld: LdEntry): string {
  const c = ld.workLocation?.address?.addressCountry;
  if (typeof c === "string") return c.toUpperCase();
  if (typeof c === "object" && c?.name) return (c.name as string).toUpperCase();
  return "US";
}

// ── NUXT_DATA extraction ────────────────────────────────────────────────────

interface NuxtLocation {
  uuid?: string;
  locationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  phoneNumber?: string;
  formattedPhoneNumber?: string;
  cityName?: string;
  regionName?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
}

interface NuxtSuffix {
  label?: string;
  type?: string;
}

interface NuxtAttribute {
  category_name?: string;
  name?: string;
  title?: string;
}

interface NuxtCredential {
  type?: string;
  organization?: string;
  organizationIdentifier?: string;
  verificationStatus?: string;
  expiration?: string;
}

interface NuxtEducation {
  institution?: string;
  diplomaDegree?: string;
  yearEducationCompleted?: number;
  yearsInPractice?: number;
  yearPracticeStarted?: number;
}

interface NuxtProfile {
  id?: number;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  healthRole?: string;
  companyName?: string;
  useCompanyName?: boolean;
  urlPath?: string;
  photoUrls?: { thumbnail?: string };
  phoneNumber?: string;
  email?: string;
  website?: string;
  suffixes?: NuxtSuffix[];
  personalStatements?: Array<{ paragraph1?: string; languageCode?: string }>;
  primaryLocation?: NuxtLocation;
  secondaryLocation?: NuxtLocation;
  groupPractice?: { companyName?: string };
  fees?: {
    individual_session_cost?: number | null;
    couples_session_cost?: number | null;
    sliding_scale?: boolean;
  };
  // Rich profile data (present in listing page NUXT too)
  attributes?: NuxtAttribute[];
  education?: NuxtEducation;
  credentials?: NuxtCredential[];
  appointmentTypes?: { online?: boolean; inPerson?: boolean };
  appointments?: { online?: string; inPerson?: string };
  onlineTherapy?: boolean;
  accepting_appointments?: string;
  languages?: Array<string | { label?: string; languageCode?: string }>;
}

function extractNuxtProfiles(html: string): Map<number, NuxtProfile> {
  const data = extractNuxtData(html);
  if (!data) return new Map();

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const map = new Map<number, NuxtProfile>();

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      "uuid" in entry &&
      "firstName" in entry &&
      "lastName" in entry &&
      "id" in entry
    ) {
      try {
        const resolved = resolveNuxt(data, i) as NuxtProfile;
        if (
          typeof resolved.id === "number" &&
          typeof resolved.uuid === "string" &&
          uuidRe.test(resolved.uuid) &&
          typeof resolved.firstName === "string"
        ) {
          map.set(resolved.id, resolved);
        }
      } catch {
        // skip malformed entries
      }
    }
  }

  return map;
}

function nuxtLocationToPt(loc: NuxtLocation): PtLocation {
  return {
    uuid: loc.uuid,
    locationName: loc.locationName,
    addressLine1: loc.addressLine1,
    addressLine2: loc.addressLine2,
    phone: loc.formattedPhoneNumber ?? loc.phoneNumber,
    cityName: loc.cityName ?? "",
    regionName: loc.regionName ?? "",
    regionCode: loc.regionCode ?? "",
    postalCode: loc.postalCode ?? "",
    countryCode: loc.countryCode ?? "CA",
    lat: loc.lat ?? 0,
    lon: loc.lon ?? 0,
  };
}

function extractLabel(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const o = item as Record<string, unknown>;
    return (o.label ?? o.name ?? null) as string | null;
  }
  return null;
}

function parseAttributes(attrs: NuxtAttribute[] | undefined): {
  specialties: string[];
  modalities: string[];
  insurance_accepted: string[];
  languages: string[];
} {
  const specialties: string[] = [];
  const modalities: string[] = [];
  const insurance_accepted: string[] = [];
  const languages: string[] = [];

  for (const attr of attrs ?? []) {
    const cat = attr.category_name ?? "";
    const label = (attr.name ?? attr.title ?? "").trim();
    if (!label) continue;

    // Issues: pull in issues, mental-health, sexuality, and general categories
    if (cat === "issues" || cat === "mental-health" || cat === "sexuality" || cat === "categories") {
      specialties.push(label);
    }
    // Treatment orientation → modalities
    else if (cat === "treatment-orientation") {
      modalities.push(label);
    }
    else if (cat === "insurance" || cat === "insurance-accepted") {
      insurance_accepted.push(label);
    }
    else if (cat === "language" || cat === "languages") {
      languages.push(label);
    }
  }

  return { specialties, modalities, insurance_accepted, languages };
}

// ── Combined parse — returns full PtProfileDetail ──────────────────────────

export function parseListingPage(html: string, _baseUrl: string): PtProfileDetail[] {
  const persons = extractPersonsFromLd(html);
  const nuxtMap = extractNuxtProfiles(html);

  const entries: PtProfileDetail[] = [];

  for (const person of persons) {
    const profileUrl = person.url || person["@id"] || "";
    const ptId = ptIdFromUrl(profileUrl);
    if (!ptId) continue;

    const addr = person.workLocation?.address ?? {};
    const geo  = person.workLocation?.geo ?? {};
    const country = countryFromLd(person);
    const nuxt = nuxtMap.get(ptId);

    // ── Credentials: academic suffixes only ──
    const credentials = (nuxt?.suffixes ?? [])
      .filter((s) => s.type === "academic" || (!s.type && s.label && !s.label.startsWith("HealthRoles.")))
      .map((s) => s.label)
      .filter((l): l is string => Boolean(l));

    // ── Formal credential details ──
    const credentials_detail: PtCredentialDetail[] = (nuxt?.credentials ?? [])
      .filter((c) => c.organization)
      .map((c) => ({
        type: c.type ?? "unknown",
        organization: c.organization!,
        organizationIdentifier: c.organizationIdentifier,
        verificationStatus: c.verificationStatus ?? "UNKNOWN",
        expiration: c.expiration || undefined,
      }));

    // ── Practice name ──
    let practice_name: string | null = null;
    if (nuxt?.useCompanyName && nuxt?.companyName) {
      practice_name = nuxt.companyName;
    } else if (nuxt?.groupPractice?.companyName) {
      practice_name = nuxt.groupPractice.companyName;
    }

    // ── Locations ──
    const location: PtLocation = nuxt?.primaryLocation
      ? nuxtLocationToPt(nuxt.primaryLocation)
      : {
          cityName:    (addr as Record<string, unknown>).addressLocality as string ?? "",
          regionName:  (addr as Record<string, unknown>).addressRegion  as string ?? "",
          regionCode:  "",
          postalCode:  (addr as Record<string, unknown>).postalCode     as string ?? "",
          countryCode: country,
          lat: (geo as Record<string, unknown>).latitude  as number ?? 0,
          lon: (geo as Record<string, unknown>).longitude as number ?? 0,
        };

    const secondary_location = nuxt?.secondaryLocation
      ? nuxtLocationToPt(nuxt.secondaryLocation)
      : null;

    // ── Fees ──
    const fees: PtFees = {
      individual_session_cost: nuxt?.fees?.individual_session_cost ?? null,
      couples_session_cost:    nuxt?.fees?.couples_session_cost    ?? null,
      sliding_scale:           nuxt?.fees?.sliding_scale           ?? false,
    };

    // ── Bio ──
    const bio =
      (nuxt?.personalStatements ?? []).find((s) => s.languageCode === "en")?.paragraph1 ??
      (nuxt?.personalStatements ?? [])[0]?.paragraph1 ??
      null;

    // ── Phone ──
    const rawPhone = person.telephone || nuxt?.phoneNumber || null;
    const phone = rawPhone?.replace(/\s+/g, "").trim() || null;

    // ── Photo ──
    const photoUrl = nuxt?.photoUrls?.thumbnail ?? null;

    // ── Profile URL ──
    const urlPath = nuxt?.urlPath ?? "";
    const cleanPath = urlPath
      .replace("[COUNTRY_CODE]", country.toLowerCase())
      .replace("[PROFILE_CLASS]", "therapists");
    const fullUrl = cleanPath
      ? `https://www.psychologytoday.com/${cleanPath}`
      : profileUrl;

    // ── Attributes → specialties + modalities + insurance + languages ──
    const { specialties, modalities, insurance_accepted, languages: attrLanguages } =
      parseAttributes(nuxt?.attributes);

    // Fallback: top-level languages field
    const languages = attrLanguages.length
      ? attrLanguages
      : (nuxt?.languages ?? []).map(extractLabel).filter((l): l is string => Boolean(l));

    // ── Appointment types ──
    const appt    = nuxt?.appointmentTypes ?? {};
    const apptStr = nuxt?.appointments ?? {};
    const telehealth = Boolean(
      (appt as Record<string, unknown>).online ||
      (apptStr as Record<string, unknown>).online === "YES" ||
      nuxt?.onlineTherapy
    );
    const in_person = Boolean(
      (appt as Record<string, unknown>).inPerson ||
      (apptStr as Record<string, unknown>).inPerson === "YES"
    );
    const accepting_clients = nuxt?.accepting_appointments !== "NO";

    // ── Education ──
    let education: PtEducation | null = null;
    if (nuxt?.education) {
      const e = nuxt.education;
      education = {
        institution:       e.institution,
        degree:            e.diplomaDegree,
        yearCompleted:     e.yearEducationCompleted,
        yearsInPractice:   e.yearsInPractice,
        yearPracticeStarted: e.yearPracticeStarted,
      };
    }

    const years_in_practice =
      nuxt?.education?.yearsInPractice ??
      (nuxt?.education?.yearPracticeStarted
        ? new Date().getFullYear() - nuxt.education.yearPracticeStarted
        : null) ??
      null;

    entries.push({
      pt_uuid:           nuxt?.uuid ?? "",
      pt_url:            fullUrl || profileUrl,
      first_name:        nuxt?.firstName ?? person.name.split(" ")[0],
      last_name:         nuxt?.lastName  ?? person.name.split(" ").slice(1).join(" "),
      health_role:       nuxt?.healthRole ?? "",
      credentials,
      credentials_detail,
      photo_url:         photoUrl,
      phone,
      bio,
      practice_name,
      location,
      secondary_location,
      fees,
      specialties,
      modalities,
      insurance_accepted,
      languages,
      telehealth,
      in_person,
      accepting_clients,
      email:             nuxt?.email   ?? null,
      website:           nuxt?.website ?? null,
      education,
      years_in_practice,
    });
  }

  return entries;
}

/** Extract the next-page URL from the listing HTML, or null if none */
export function extractNextPageUrl(html: string, currentUrl: string): string | null {
  const m = html.match(/href="([^"]*\?page=(\d+))[^"]*"/g);
  if (!m) return null;

  const currentPage = parseInt(new URL(currentUrl).searchParams.get("page") ?? "1", 10);
  const nextPage = currentPage + 1;

  for (const tag of m) {
    const urlMatch = tag.match(/href="([^"]*)"/);
    if (urlMatch?.[1]?.includes(`page=${nextPage}`)) {
      const href = urlMatch[1];
      try {
        return new URL(href, "https://www.psychologytoday.com").toString();
      } catch {
        return href;
      }
    }
  }
  return null;
}
