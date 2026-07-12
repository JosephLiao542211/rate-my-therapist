import { NextRequest, NextResponse } from "next/server";
import { createTherapist, searchTherapists } from "@/lib/therapists";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";

// Powers the homepage's geo-personalized "Top-Rated Therapists in <city>"
// island, so the page itself can stay static (ISR) instead of force-dynamic.
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city) return NextResponse.json({ therapists: [] });
  const { therapists } = await searchTherapists({ city, limit: 6 });
  return NextResponse.json({ therapists });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name, practice_name, city, state, state_abbr, specialties,
    bio, phone, email, website, credentials, languages,
    telehealth, in_person, sliding_scale, individual_session_cost,
    modalities, issues, insurance_accepted, years_in_practice, accepting_clients,
  } = body;

  if (!name?.trim() || !city?.trim() || !state_abbr?.trim()) {
    return NextResponse.json(
      { error: "name, city, and state_abbr are required." },
      { status: 400 }
    );
  }

  const session = await auth();
  const therapist = await createTherapist({
    name: name.trim(),
    specialties: Array.isArray(specialties) ? specialties : [],
    city: city.trim(),
    state: state?.trim() ?? state_abbr.toUpperCase(),
    state_abbr: state_abbr.trim().toUpperCase(),
    practice_name: practice_name?.trim() || undefined,
    bio: bio?.trim() || undefined,
    phone: phone?.trim() || undefined,
    email: email?.trim() || undefined,
    website: website?.trim() || undefined,
    credentials: Array.isArray(credentials) ? credentials : [],
    languages: Array.isArray(languages) ? languages : [],
    telehealth: typeof telehealth === "boolean" ? telehealth : false,
    in_person: typeof in_person === "boolean" ? in_person : true,
    sliding_scale: typeof sliding_scale === "boolean" ? sliding_scale : undefined,
    individual_session_cost: typeof individual_session_cost === "number" ? individual_session_cost : undefined,
    modalities: Array.isArray(modalities) ? modalities : [],
    issues: Array.isArray(issues) ? issues : [],
    insurance_accepted: Array.isArray(insurance_accepted) ? insurance_accepted : [],
    years_in_practice: typeof years_in_practice === "number" ? years_in_practice : undefined,
    accepting_clients: typeof accepting_clients === "boolean" ? accepting_clients : true,
  });

  await logAudit({
    actor_user_id: session?.user?.id ?? null,
    actor_email: session?.user?.email ?? null,
    action: "therapist.submitted",
    entity_type: "therapist",
    entity_id: therapist.id,
    entity_label: therapist.name,
  });

  return NextResponse.json(therapist, { status: 201 });
}
