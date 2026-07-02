import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { voteOnReview } from "@/lib/reviews";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const { id: review_id } = await params;
  const { is_helpful } = await req.json();

  if (typeof is_helpful !== "boolean") {
    return NextResponse.json({ error: "is_helpful must be boolean." }, { status: 400 });
  }

  await voteOnReview(review_id, session.user.id, is_helpful);

  const { rows } = await pool.query<{ helpful_count: number; not_helpful_count: number }>(
    "SELECT helpful_count, not_helpful_count FROM reviews WHERE id = $1",
    [review_id]
  );

  return NextResponse.json(rows[0]);
}
