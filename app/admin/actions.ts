"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { setTherapistStatus } from "@/lib/therapists";
import { deleteReview } from "@/lib/reviews";
import { setUserRole } from "@/lib/admin-data";
import { logAudit } from "@/lib/audit";

export async function approveTherapistAction(id: string) {
  const admin = await requireAdmin();
  const therapist = await setTherapistStatus(id, "approved");
  if (!therapist) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.approved",
    entity_type: "therapist",
    entity_id: therapist.id,
    entity_label: therapist.name,
  });
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
  revalidatePath(`/therapist/${therapist.slug}`);
}

export async function rejectTherapistAction(id: string) {
  const admin = await requireAdmin();
  const therapist = await setTherapistStatus(id, "rejected");
  if (!therapist) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.rejected",
    entity_type: "therapist",
    entity_id: therapist.id,
    entity_label: therapist.name,
  });
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
}

export async function deleteReviewAction(id: string) {
  const admin = await requireAdmin();
  const review = await deleteReview(id);
  if (!review) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "review.deleted",
    entity_type: "review",
    entity_id: id,
    entity_label: `${review.rating}★ review`,
    metadata: { body: review.body?.slice(0, 200) },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

export async function setUserRoleAction(id: string, role: "user" | "admin") {
  const admin = await requireAdmin();
  const user = await setUserRole(id, role);
  if (!user) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: role === "admin" ? "user.promoted" : "user.demoted",
    entity_type: "user",
    entity_id: user.id,
    entity_label: user.email,
  });
  revalidatePath("/admin/users");
}
