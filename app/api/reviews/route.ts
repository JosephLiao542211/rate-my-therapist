import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTherapistBySlug } from "@/lib/therapists";
import { createReview } from "@/lib/reviews";

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  const {
    therapist_slug,
    rating,
    would_recommend,
    felt_heard,
    helped_with_goals,
    num_sessions,
    tags,
    body: reviewBody,
    is_anonymous,
  } = body;

  if (!therapist_slug || !rating) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }

  if (reviewBody != null && typeof reviewBody !== "string") {
    return NextResponse.json({ error: "Invalid review body." }, { status: 400 });
  }

  const therapist = await getTherapistBySlug(therapist_slug);
  if (!therapist) {
    return NextResponse.json({ error: "Therapist not found." }, { status: 404 });
  }

  const review = await createReview({
    therapist_id: therapist.id,
    user_id: session?.user?.id ?? null,
    is_anonymous: is_anonymous ?? !session?.user,
    rating,
    would_recommend: would_recommend ?? undefined,
    felt_heard: felt_heard ?? undefined,
    helped_with_goals: helped_with_goals ?? undefined,
    num_sessions: num_sessions ?? undefined,
    tags: tags ?? [],
    body: typeof reviewBody === "string" ? reviewBody.trim() : "",
  });

  return NextResponse.json(review, { status: 201 });
}
