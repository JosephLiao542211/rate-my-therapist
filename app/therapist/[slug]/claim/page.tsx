import { notFound } from "next/navigation";
import { getTherapistBySlug } from "@/lib/therapists";
import ClaimForm from "./ClaimForm";

export default async function ClaimTherapistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const therapist = await getTherapistBySlug(slug);
  if (!therapist) notFound();

  return <ClaimForm slug={slug} therapistName={therapist.name} />;
}
