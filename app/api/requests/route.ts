import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRequest } from "@/lib/requests";
import { getTherapistBySlug } from "@/lib/therapists";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const { type, therapist_slug, name, email, message } = body;

  if (type !== "claim" && type !== "feedback") {
    return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  let therapist = null;
  if (type === "claim") {
    if (typeof therapist_slug !== "string") {
      return NextResponse.json({ error: "therapist_slug is required for claim requests." }, { status: 400 });
    }
    therapist = await getTherapistBySlug(therapist_slug);
    if (!therapist) {
      return NextResponse.json({ error: "Therapist not found." }, { status: 404 });
    }
  }

  const request = await createRequest({
    type,
    therapist_id: therapist?.id ?? null,
    therapist_name: therapist?.name ?? null,
    name: typeof name === "string" ? name.trim() || null : session?.user?.name ?? null,
    email: typeof email === "string" ? email.trim() || null : session?.user?.email ?? null,
    message: message.trim(),
    user_id: session?.user?.id ?? null,
  });

  await logAudit({
    actor_user_id: session?.user?.id ?? null,
    actor_email: session?.user?.email ?? request.email,
    action: type === "claim" ? "request.claim_submitted" : "request.feedback_submitted",
    entity_type: "request",
    entity_id: request.id,
    entity_label: therapist ? `Claim: ${therapist.name}` : "Feedback",
  });

  return NextResponse.json(request, { status: 201 });
}
