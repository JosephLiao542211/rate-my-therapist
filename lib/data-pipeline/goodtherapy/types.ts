/** A titled key from GoodTherapy's taxonomy responses, e.g. { key: 13, title: "Psychotherapy" } */
export interface GtTitled {
  key: number | string;
  title?: string;
}

/** One member card from POST /next/api/search/location-based */
export interface GtListingMember {
  id: number;
  firstName: string;
  lastName: string;
  credentials?: string;
  image?: string | null;
  approachToHelping?: string | null;
  office_phone?: string | null;
  seo_friendly: string;
  newProfessionsList?: GtTitled[];
  servicesProvided?: GtTitled[];
  fluentLanguages?: GtTitled[];
  insuranceCompanies?: GtTitled[];
  pricingOptions?: GtTitled[];
  newClientsOptions?: GtTitled[];
  Location1City?: string;
  distance?: number;
}

export interface GtLocation {
  address?: string | null;
  address2?: string | null;
  cityName?: string;
  stateCode?: string;
  stateName?: string;
  zipCode?: string;
  countryName?: string;
  lat?: number | null;
  lon?: number | null;
  businessName?: string | null;
}

/** Response from GET /next/api/therapist-profile/{seo_friendly}?prefetch=true */
export interface GtProfileDetail {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  credentials?: string;
  image?: string | null;
  approachToHelping?: string | null;
  seoFriendly: string;
  professions?: string[];
  servicesProvided?: string[];
  servicesModes?: GtTitled[];
  ageGroups?: string[];
  concernsTreated?: string[];
  modelsPracticed?: GtTitled[];
  fluentLanguages?: string[];
  languages?: string[];
  insuranceCompaniesList?: GtTitled[];
  location1?: GtLocation;
  sessionFees?: string | null;
  slidingScale?: boolean;
  freeInitialConsultation?: boolean;
  acceptingNewClients?: boolean;
  notAcceptingNewClients?: boolean;
  weekendAvailability?: boolean;
  eveningAvailability?: boolean;
  website?: string | null;
  email?: string | null;
  officePhone?: string | null;
}

/** Normalized shape used for DB seeding, independent of GoodTherapy's raw JSON layout */
export interface GtTherapistRecord {
  gt_id: number;
  gt_seo_friendly: string;
  first_name: string;
  last_name: string;
  credentials: string[];
  health_role: string;
  photo_url: string | null;
  phone: string | null;
  bio: string | null;
  city: string;
  state: string;
  state_abbr: string;
  postal_code: string | null;
  lat: number | null;
  lon: number | null;
  address_line: string | null;
  languages: string[];
  specialties: string[];
  modalities: string[];
  insurance_accepted: string[];
  sliding_scale: boolean;
  individual_session_cost: number | null;
  telehealth: boolean;
  in_person: boolean;
  accepting_clients: boolean;
  website: string | null;
  email: string | null;
}

/** Captures enough of the first search's request/response to fetch subsequent pages directly. */
export interface GtSearchState {
  body: Record<string, unknown>; // the original request body (lat, lng, miles, filters, city, state, ...)
  searchid: string;
  sessionCookie: string;
  totalcount: number;
}

export interface ScrapeOptions {
  location: string;
  miles: number;
  limit: number;
  pages: number;
  concurrency: number;
  dryRun: boolean;
  profiles: boolean;
  headless: boolean;
}
