/**
 * Parses a Psychology Today individual therapist profile page for rich detail:
 * languages, issues, modalities, insurance, education, credentials, telehealth, etc.
 */

import { extractNuxtData, resolveNuxt } from "./nuxt-resolver.js";
import type { PtListingEntry, PtProfileDetail, PtEducation, PtCredentialDetail } from "./types.js";

interface NuxtSuffix {
  label?: string;
  type?: string;
}

interface NuxtCredential {
  type?: string;
  organization?: string;
  organizationIdentifier?: string;
  verificationStatus?: string;
  expiration?: string;
}

interface NuxtAttribute {
  category_name?: string;
  name?: string;
  title?: string;
}

interface NuxtEducation {
  institution?: string;
  diplomaDegree?: string;
  yearEducationCompleted?: number;
  yearsInPractice?: number;
  yearPracticeStarted?: number;
}

interface NuxtProfileDetail {
  id?: number;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  healthRole?: string;
  companyName?: string;
  useCompanyName?: boolean;
  phoneNumber?: string;
  email?: string;
  website?: string;
  onlineTherapy?: boolean;
  suffixes?: NuxtSuffix[];
  personalStatements?: Array<{ paragraph1?: string; languageCode?: string }>;
  photoUrls?: { thumbnail?: string };
  urlPath?: string;
  fees?: {
    individual_session_cost?: number | null;
    couples_session_cost?: number | null;
    sliding_scale?: boolean;
  };
  appointmentTypes?: { online?: boolean; inPerson?: boolean };
  appointments?: { online?: string; inPerson?: string };
  accepting_appointments?: string;
  attributes?: NuxtAttribute[];
  credentials?: NuxtCredential[];
  education?: NuxtEducation;
  // Direct language field (some profiles)
  languages?: Array<string | { label?: string; languageCode?: string }>;
}

function ptIdFromUrl(url: string): number | null {
  const m = url.match(/\/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

function extractLabel(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const o = item as Record<string, unknown>;
    return (o.label ?? o.name ?? null) as string | null;
  }
  return null;
}

export function parseProfilePage(
  html: string,
  base: PtListingEntry
): PtProfileDetail {
  const fallback: PtProfileDetail = {
    ...base,
    languages: [],
    specialties: [],
    modalities: [],
    insurance_accepted: [],
    telehealth: false,
    in_person: true,
    accepting_clients: true,
    email: null,
    website: null,
    education: null,
    credentials_detail: [],
    years_in_practice: null,
  };

  const data = extractNuxtData(html);
  if (!data) return fallback;

  // Match the profile in NUXT data by numeric ID from URL (internal use only, not stored)
  const ptId = ptIdFromUrl(base.pt_url);
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let profile: NuxtProfileDetail | null = null;

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      "uuid" in entry &&
      "firstName" in entry &&
      "id" in entry
    ) {
      try {
        const resolved = resolveNuxt(data, i) as NuxtProfileDetail;
        const idMatch = ptId ? resolved.id === ptId : resolved.uuid === base.pt_uuid;
        if (
          idMatch &&
          typeof resolved.uuid === "string" &&
          uuidRe.test(resolved.uuid)
        ) {
          profile = resolved;
          break;
        }
      } catch {
        // skip
      }
    }
  }

  if (!profile) {
    console.warn(`  [profile-parser] No matching NUXT object found for ${base.pt_url} (ptId=${ptId})`);
    return fallback;
  }

  // ── Appointment types ──
  const appt = profile.appointmentTypes ?? {};
  const apptStr = profile.appointments ?? {};
  const telehealth = Boolean(
    (appt as Record<string, unknown>).online ||
    (apptStr as Record<string, unknown>).online === "YES" ||
    profile.onlineTherapy
  );
  const in_person = Boolean(
    (appt as Record<string, unknown>).inPerson ||
    (apptStr as Record<string, unknown>).inPerson === "YES"
  );
  const accepting_clients = profile.accepting_appointments !== "NO";

  // ── Suffixes → credentials (academic only) ──
  const credentials = (profile.suffixes ?? [])
    .filter((s) => s.type === "academic" || (!s.type && s.label && !s.label.startsWith("HealthRoles.")))
    .map((s) => s.label)
    .filter((l): l is string => Boolean(l));

  // ── Formal credentials detail ──
  const credentials_detail: PtCredentialDetail[] = (profile.credentials ?? [])
    .filter((c) => c.organization)
    .map((c) => ({
      type: c.type ?? "unknown",
      organization: c.organization!,
      organizationIdentifier: c.organizationIdentifier,
      verificationStatus: c.verificationStatus ?? "UNKNOWN",
      expiration: c.expiration || undefined,
    }));

  // ── Attributes (flat array, keyed by category_name) ──
  const attrs = Array.isArray(profile.attributes) ? profile.attributes : [];
  const specialties: string[] = [];
  const modalities: string[] = [];
  const insurance_accepted: string[] = [];
  const languages: string[] = [];

  for (const attr of attrs) {
    if (!attr || typeof attr !== "object") continue;
    const a = attr as NuxtAttribute;
    const cat = a.category_name ?? "";
    const label = (a.name ?? a.title ?? "").trim();
    if (!label) continue;

    switch (cat) {
      case "issues":
      case "mental-health":
      case "sexuality":
      case "categories":
      case "age-focus":
        specialties.push(label);
        break;
      case "treatment-orientation":
        modalities.push(label);
        break;
      case "insurance":
      case "insurance-accepted":
        insurance_accepted.push(label);
        break;
      case "language":
      case "languages":
        languages.push(label);
        break;
    }
  }

  // Fallback: top-level `languages` field if present
  if (!languages.length && Array.isArray(profile.languages)) {
    for (const l of profile.languages) {
      const label = extractLabel(l);
      if (label) languages.push(label);
    }
  }

  // ── Education ──
  let education: PtEducation | null = null;
  if (profile.education) {
    const e = profile.education;
    education = {
      institution: e.institution,
      degree: e.diplomaDegree,
      yearCompleted: e.yearEducationCompleted,
      yearsInPractice: e.yearsInPractice,
      yearPracticeStarted: e.yearPracticeStarted,
    };
  }

  const years_in_practice =
    profile.education?.yearsInPractice ??
    (profile.education?.yearPracticeStarted
      ? new Date().getFullYear() - profile.education.yearPracticeStarted
      : null);

  // ── Bio ──
  const bio =
    (profile.personalStatements ?? []).find((s) => s.languageCode === "en")?.paragraph1 ??
    base.bio;

  // ── Practice name ──
  let practice_name = base.practice_name;
  if (profile.useCompanyName && profile.companyName) {
    practice_name = profile.companyName;
  }

  const result: PtProfileDetail = {
    ...base,
    credentials: credentials.length ? credentials : base.credentials,
    credentials_detail,
    photo_url: profile.photoUrls?.thumbnail ?? base.photo_url,
    phone: profile.phoneNumber ?? base.phone,
    bio,
    practice_name,
    languages,
    specialties,
    modalities,
    insurance_accepted,
    telehealth,
    in_person,
    accepting_clients,
    email: profile.email ?? null,
    website: profile.website ?? null,
    education,
    years_in_practice: years_in_practice ?? null,
  };

  const attrCount = (profile.attributes ?? []).length;
  process.stdout.write(
    `  [profile] ${base.first_name} ${base.last_name}: ` +
    `${specialties.length} specialties, ${modalities.length} modalities, ` +
    `${attrCount} raw attrs, edu=${education?.institution ?? "none"}\n`
  );

  return result;
}
