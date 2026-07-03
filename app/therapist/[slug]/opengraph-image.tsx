import { ImageResponse } from "next/og";
import { getTherapistBySlug } from "@/lib/therapists";

export const alt = "Therapist rating";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function ratingColor(rating: number): string {
  if (rating >= 4) return "#41F9C0";
  if (rating >= 3) return "#FFF155";
  return "#FF969A";
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const therapist = await getTherapistBySlug(slug);

  const name = therapist?.name ?? "Therapist";
  const hasRating = (therapist?.review_count ?? 0) > 0;
  const rating = hasRating ? Number(therapist!.avg_rating).toFixed(1) : "0.0";
  const location = [therapist?.city, therapist?.state_abbr].filter(Boolean).join(", ");
  const specialty = therapist?.specialties?.[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#F7F7F7",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 200,
            height: 200,
            alignItems: "center",
            justifyContent: "center",
            background: hasRating ? ratingColor(Number(rating)) : "#E8E8E8",
            fontSize: 84,
            fontWeight: 900,
            color: "#151515",
            marginRight: 56,
          }}
        >
          {rating}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#151515" }}>{name}</div>
          {specialty && (
            <div style={{ fontSize: 32, color: "#151515", marginTop: 12 }}>{specialty}</div>
          )}
          {location && (
            <div style={{ fontSize: 28, color: "#767676", marginTop: 8 }}>{location}</div>
          )}
          <div style={{ fontSize: 24, color: "#0057FF", marginTop: 24, fontWeight: 700 }}>
            Rate My Therapist
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
