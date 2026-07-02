export interface PtLocation {
  uuid?: string;
  locationName?: string;   // clinic/practice name at this location
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;          // location-specific phone
  cityName: string;
  regionName: string;
  regionCode: string;
  postalCode: string;
  countryCode: string;
  lat: number;
  lon: number;
}

export interface PtFees {
  individual_session_cost: number | null;
  couples_session_cost: number | null;
  sliding_scale: boolean;
}

export interface PtEducation {
  institution?: string;
  degree?: string;
  yearCompleted?: number;
  yearsInPractice?: number;
  yearPracticeStarted?: number;
}

export interface PtCredentialDetail {
  type: string;                   // "license" | "membership" | "certificate"
  organization: string;
  organizationIdentifier?: string;
  verificationStatus: string;
  expiration?: string;
}

/** Data extracted from a listing-page entry (one card on search results) */
export interface PtListingEntry {
  pt_uuid: string;
  pt_url: string;
  first_name: string;
  last_name: string;
  health_role: string;
  credentials: string[];         // academic suffix labels e.g. ["RP", "MSW"]
  photo_url: string | null;
  phone: string | null;
  bio: string | null;
  practice_name: string | null;
  location: PtLocation;
  secondary_location: PtLocation | null;
  fees: PtFees;
}

/** Data from an individual profile page (richer detail) */
export interface PtProfileDetail extends PtListingEntry {
  languages: string[];
  specialties: string[];
  modalities: string[];
  insurance_accepted: string[];
  telehealth: boolean;
  in_person: boolean;
  accepting_clients: boolean;
  email: string | null;
  website: string | null;
  education: PtEducation | null;
  credentials_detail: PtCredentialDetail[];
  years_in_practice: number | null;
}

export interface ScrapeOptions {
  country: string;
  region: string;
  pages: number;
  limit: number;
  dryRun: boolean;
  concurrency: number;
}
