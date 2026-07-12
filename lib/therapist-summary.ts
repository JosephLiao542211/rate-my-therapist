import type { Therapist } from "./therapists";

/**
 * Builds a factual profile summary from a therapist's *structured* fields.
 *
 * This is deliberately composed from data (credentials, issues, modalities,
 * insurance, languages, fees, format) rather than from any imported bio prose:
 * facts vary genuinely per therapist and carry no derivative-content risk,
 * whereas reworded third-party bios stay semantically identical to the source.
 *
 * Sentences are omitted entirely when the underlying data is missing, so a
 * sparsely-populated therapist yields a short summary rather than a filler one.
 */

/** Placeholder values in the imported data that carry no meaning for a reader. */
const JUNK = new Set(["other", "none", "n/a", "na", "unspecified", "unknown"]);

function isMeaningful(value: string): boolean {
  return value.trim().length > 0 && !JUNK.has(value.trim().toLowerCase());
}

/** "REGISTERED_PSYCHOTHERAPIST" → "Registered Psychotherapist" */
export function humanize(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "a", "a and b", "a, b, and c" */
function list(items: string[]): string {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

/**
 * Cap long lists so the summary stays readable, dropping placeholder values —
 * surfacing "Other" as though it were a therapy approach is exactly what makes
 * a page read as machine-generated. The full set is still rendered on the page.
 */
function take(items: string[] | null | undefined, n: number): string[] {
  return (items ?? []).filter(isMeaningful).slice(0, n);
}

export function buildTherapistSummary(t: Therapist): string[] {
  const sentences: string[] = [];

  const location = [t.city, t.state_abbr].filter(Boolean).join(", ");
  const credentials = take(t.credentials, 3);
  const role = t.health_role && isMeaningful(t.health_role)
    ? humanize(t.health_role)
    : "therapist";

  // 1. Who / what / where
  const named = credentials.length > 0 ? `${t.name}, ${credentials.join(", ")},` : t.name;
  let opener = `${named} is a ${role}`;
  if (t.practice_name) opener += ` at ${t.practice_name}`;
  if (location) opener += ` in ${location}`;
  sentences.push(`${opener}.`);

  // 2. What they treat — prefer the richer `issues` list, fall back to specialties.
  const focus = take(t.issues.length > 0 ? t.issues : t.specialties, 6);
  if (focus.length > 0) {
    sentences.push(`Areas of focus include ${list(focus)}.`);
  }

  // 3. How they work
  const modalities = take(t.modalities, 5);
  if (modalities.length > 0) {
    sentences.push(`Therapy approaches include ${list(modalities)}.`);
  }

  // 4. Session format
  const formats: string[] = [];
  if (t.in_person) formats.push("in person");
  if (t.telehealth) formats.push("online via telehealth");
  if (formats.length > 0) {
    sentences.push(`Sessions are available ${list(formats)}.`);
  }

  // 5. Cost / insurance
  const insurance = take(t.insurance_accepted, 5);
  const costParts: string[] = [];
  if (t.individual_session_cost) {
    costParts.push(`Individual sessions are listed at $${t.individual_session_cost}`);
  }
  if (t.sliding_scale) {
    costParts.push(
      costParts.length > 0 ? "with sliding-scale fees available" : "Sliding-scale fees are available",
    );
  }
  if (costParts.length > 0) sentences.push(`${costParts.join(" ")}.`);
  if (insurance.length > 0) {
    sentences.push(`Accepted insurance includes ${list(insurance)}.`);
  }

  // 6. Languages
  const languages = take(t.languages, 4);
  if (languages.length > 0) {
    sentences.push(`Sessions are offered in ${list(languages)}.`);
  }

  // 7. Experience / education — each clause carries its own verb so they read
  // correctly whether one or both are present.
  const background: string[] = [];
  if (t.years_in_practice) {
    background.push(`has ${t.years_in_practice} years in practice`);
  }
  const education = [t.education_degree, t.education_institution].filter(Boolean).join(", ");
  if (education) {
    background.push(`was educated at ${education}`);
  }
  if (background.length > 0) {
    sentences.push(`${t.name.split(" ")[0]} ${list(background)}.`);
  }

  return sentences;
}

/** Single-paragraph form, used for meta descriptions (trimmed to ~155 chars). */
export function buildTherapistMetaDescription(t: Therapist): string {
  const location = [t.city, t.state_abbr].filter(Boolean).join(", ");
  const focus = take(t.issues.length > 0 ? t.issues : t.specialties, 3);

  const parts: string[] = [];
  parts.push(
    t.review_count > 0
      ? `${t.name} — ${Number(t.avg_rating).toFixed(1)}/5 from ${t.review_count} client review${t.review_count === 1 ? "" : "s"}`
      : `${t.name}${location ? `, therapist in ${location}` : ""}`,
  );
  if (focus.length > 0) parts.push(`Specializes in ${list(focus)}`);
  if (t.telehealth) parts.push("Telehealth available");

  const desc = `${parts.join(". ")}.`;
  return desc.length > 158 ? `${desc.slice(0, 155).trimEnd()}...` : desc;
}
