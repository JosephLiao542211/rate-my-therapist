import type { GtListingMember, GtProfileDetail, GtTherapistRecord, GtTitled } from "./types.js";

function titles(items: GtTitled[] | undefined): string[] {
  return (items ?? []).map((i) => i.title).filter((t): t is string => Boolean(t && t.trim()));
}

function photoUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return image.startsWith("http") ? image : `https://www.goodtherapy.org/${image.replace(/^\/+/, "")}`;
}

/**
 * "Toronto, ON M5S3A7" -> { city, stateAbbr, postal } — best-effort fallback when no
 * profile fetch happened. The postal code is optional ("Toronto, ON" alone is also
 * valid) — treating it as required used to silently drop stateAbbr to "", which broke
 * cross-source therapist matching (see findExistingTherapistId in seed.ts) for any
 * listing entry whose Location1City had no trailing postal code.
 */
function parseLocation1City(s: string | undefined): { city: string; stateAbbr: string; postal: string | null } {
  if (!s) return { city: "", stateAbbr: "", postal: null };
  const m = s.match(/^(.+?),\s*([A-Za-z]{2})(?:\s+(\S+))?\s*$/);
  if (!m) return { city: s, stateAbbr: "", postal: null };
  return { city: m[1].trim(), stateAbbr: m[2].toUpperCase(), postal: m[3] ?? null };
}

/** First dollar amount in a fee string like "&#34;$70-120&#34; per session" -> 70 */
function parseSessionCost(fee: string | null | undefined): number | null {
  if (!fee) return null;
  const m = fee.match(/\$(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function normalizeListingMember(m: GtListingMember): GtTherapistRecord {
  const { city, stateAbbr, postal } = parseLocation1City(m.Location1City);
  const pricing = titles(m.pricingOptions);
  const clientOptions = titles(m.newClientsOptions);
  const services = titles(m.servicesProvided);

  return {
    gt_id: m.id,
    gt_seo_friendly: m.seo_friendly,
    first_name: m.firstName,
    last_name: m.lastName,
    credentials: m.credentials ? [m.credentials] : [],
    health_role: titles(m.newProfessionsList)[0] ?? "",
    photo_url: photoUrl(m.image),
    phone: m.office_phone || null,
    bio: m.approachToHelping || null,
    city,
    state: "",
    state_abbr: stateAbbr,
    postal_code: postal,
    lat: null,
    lon: null,
    address_line: null,
    languages: titles(m.fluentLanguages),
    specialties: [],
    modalities: [],
    insurance_accepted: titles(m.insuranceCompanies),
    sliding_scale: pricing.some((p) => /sliding scale/i.test(p)),
    individual_session_cost: null,
    telehealth: services.some((s) => /telehealth/i.test(s)),
    in_person: true,
    accepting_clients: clientOptions.length === 0 || clientOptions.some((c) => /accepting/i.test(c)),
    website: null,
    email: null,
  };
}

/** Merges richer /therapist-profile data onto a listing-derived record. */
export function mergeProfileDetail(base: GtTherapistRecord, p: GtProfileDetail): GtTherapistRecord {
  const loc = p.location1;
  const services = p.servicesProvided ?? titles(p.servicesModes);

  return {
    ...base,
    credentials: p.credentials ? [p.credentials] : base.credentials,
    health_role: p.professions?.[0] ?? base.health_role,
    photo_url: photoUrl(p.image) ?? base.photo_url,
    phone: p.officePhone || base.phone,
    bio: p.approachToHelping || base.bio,
    city: loc?.cityName || base.city,
    state: loc?.stateName || base.state,
    state_abbr: loc?.stateCode || base.state_abbr,
    postal_code: loc?.zipCode || base.postal_code,
    lat: loc?.lat ?? base.lat,
    lon: loc?.lon ?? base.lon,
    address_line: [loc?.address, loc?.address2].filter(Boolean).join(", ") || base.address_line,
    languages: p.fluentLanguages ?? p.languages ?? base.languages,
    specialties: p.concernsTreated ?? base.specialties,
    modalities: titles(p.modelsPracticed).length ? titles(p.modelsPracticed) : base.modalities,
    insurance_accepted: titles(p.insuranceCompaniesList).length
      ? titles(p.insuranceCompaniesList)
      : base.insurance_accepted,
    sliding_scale: p.slidingScale ?? base.sliding_scale,
    individual_session_cost: parseSessionCost(p.sessionFees) ?? base.individual_session_cost,
    telehealth: services.some((s) => /telehealth/i.test(s)) || base.telehealth,
    in_person: base.in_person,
    accepting_clients:
      p.acceptingNewClients ?? (p.notAcceptingNewClients !== undefined ? !p.notAcceptingNewClients : base.accepting_clients),
    website: p.website || base.website,
    email: p.email || base.email,
  };
}
