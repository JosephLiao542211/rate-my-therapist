import { SPECIALTIES } from "./constants";

export function specialtyToSlug(specialty: string): string {
  return specialty.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function slugToSpecialty(slug: string): string {
  const match = SPECIALTIES.find((s) => specialtyToSlug(s) === slug);
  return match ?? slug.replace(/-/g, " ");
}
