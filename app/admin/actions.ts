"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { setTherapistStatus, updateTherapist, archiveTherapist, restoreTherapist } from "@/lib/therapists";
import { deleteReview } from "@/lib/reviews";
import { setUserRole } from "@/lib/admin-data";
import { resolveRequest } from "@/lib/requests";
import { createPost, updatePost, setPostStatus, deletePost } from "@/lib/posts";
import { mergeDuplicateTherapistGroup, mergeDuplicateTherapists, dismissDuplicatePair } from "@/lib/duplicates";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

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

export async function updateTherapistAction(id: string, formData: FormData) {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const num = (key: string): number | null => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const therapist = await updateTherapist(id, {
    name,
    practice_name: String(formData.get("practice_name") ?? "").trim() || null,
    specialties: parseTags(formData.get("specialties")),
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    state_abbr: String(formData.get("state_abbr") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    credentials: parseTags(formData.get("credentials")),
    languages: parseTags(formData.get("languages")),
    telehealth: formData.get("telehealth") === "on",
    in_person: formData.get("in_person") === "on",
    sliding_scale: formData.get("sliding_scale") === "on",
    individual_session_cost: num("individual_session_cost"),
    modalities: parseTags(formData.get("modalities")),
    issues: parseTags(formData.get("issues")),
    insurance_accepted: parseTags(formData.get("insurance_accepted")),
    years_in_practice: num("years_in_practice"),
    accepting_clients: formData.get("accepting_clients") === "on",
  });
  if (!therapist) return;

  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.updated",
    entity_type: "therapist",
    entity_id: therapist.id,
    entity_label: therapist.name,
  });

  revalidatePath("/admin/therapists");
  revalidatePath(`/therapist/${therapist.slug}`);
  redirect("/admin/therapists");
}

export async function archiveTherapistAction(id: string) {
  const admin = await requireAdmin();
  const therapist = await archiveTherapist(id);
  if (!therapist) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.archived",
    entity_type: "therapist",
    entity_id: id,
    entity_label: therapist.name,
    metadata: { review_count: therapist.review_count },
  });
  revalidatePath("/admin/therapists");
  revalidatePath("/admin/therapists/archived");
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath(`/therapist/${therapist.slug}`);
  redirect("/admin/therapists");
}

export async function restoreTherapistAction(id: string) {
  const admin = await requireAdmin();
  const therapist = await restoreTherapist(id);
  if (!therapist) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.restored",
    entity_type: "therapist",
    entity_id: id,
    entity_label: therapist.name,
  });
  revalidatePath("/admin/therapists");
  revalidatePath("/admin/therapists/archived");
  revalidatePath("/admin");
  revalidatePath(`/therapist/${therapist.slug}`);
  redirect("/admin/therapists/archived");
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

export async function resolveRequestAction(id: string) {
  const admin = await requireAdmin();
  const request = await resolveRequest(id);
  if (!request) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "request.resolved",
    entity_type: "request",
    entity_id: request.id,
    entity_label: request.therapist_name ? `Claim: ${request.therapist_name}` : "Feedback",
  });
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createPostAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  const post = await createPost({
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body,
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
    tags: parseTags(formData.get("tags")),
    author_name: admin.name ?? admin.email,
    author_id: admin.id,
    status: formData.get("publish") === "on" ? "published" : "draft",
  });

  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "post.created",
    entity_type: "post",
    entity_id: post.id,
    entity_label: post.title,
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updatePostAction(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  const post = await updatePost(id, {
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body,
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
    tags: parseTags(formData.get("tags")),
  });
  if (!post) return;

  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "post.updated",
    entity_type: "post",
    entity_id: post.id,
    entity_label: post.title,
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  redirect("/admin/blog");
}

export async function setPostStatusAction(id: string, status: "draft" | "published") {
  const admin = await requireAdmin();
  const post = await setPostStatus(id, status);
  if (!post) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: status === "published" ? "post.published" : "post.unpublished",
    entity_type: "post",
    entity_id: post.id,
    entity_label: post.title,
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}

export async function deletePostAction(id: string) {
  const admin = await requireAdmin();
  const post = await deletePost(id);
  if (!post) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "post.deleted",
    entity_type: "post",
    entity_id: id,
    entity_label: post.title,
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function mergeDuplicatesAction(keepId: string, mergeId: string) {
  const admin = await requireAdmin();
  const result = await mergeDuplicateTherapists(keepId, mergeId);
  if (!result) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.merged",
    entity_type: "therapist",
    entity_id: keepId,
    entity_label: result.keepName,
    metadata: { merged_from: mergeId, merged_name: result.mergeName },
  });
  revalidatePath("/admin/duplicates");
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
}

export async function mergeDuplicateGroupAction(keepId: string, mergeIds: string[]) {
  const admin = await requireAdmin();
  const result = await mergeDuplicateTherapistGroup(keepId, mergeIds);
  if (!result) return;
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "therapist.group_merged",
    entity_type: "therapist",
    entity_id: keepId,
    entity_label: result.keepName,
    metadata: {
      merged_from: result.merged.map((therapist) => therapist.id),
      merged_names: result.merged.map((therapist) => therapist.name),
    },
  });
  revalidatePath("/admin/duplicates");
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
}

export async function mergeSelectedDuplicateGroupsAction(formData: FormData) {
  const admin = await requireAdmin();
  const selectedGroups = formData.getAll("groups").map((value) => String(value));

  for (const selectedGroup of selectedGroups) {
    const [keepId, mergeIdsValue = ""] = selectedGroup.split(":");
    const mergeIds = mergeIdsValue.split(",").filter(Boolean);
    if (!keepId || mergeIds.length === 0) continue;

    const result = await mergeDuplicateTherapistGroup(keepId, mergeIds);
    if (!result) continue;

    await logAudit({
      actor_user_id: admin.id,
      actor_email: admin.email,
      action: "therapist.group_merged",
      entity_type: "therapist",
      entity_id: keepId,
      entity_label: result.keepName,
      metadata: {
        merged_from: result.merged.map((therapist) => therapist.id),
        merged_names: result.merged.map((therapist) => therapist.name),
      },
    });
  }

  revalidatePath("/admin/duplicates");
  revalidatePath("/admin/therapists");
  revalidatePath("/admin");
}

export async function dismissDuplicateAction(idA: string, idB: string) {
  const admin = await requireAdmin();
  await dismissDuplicatePair(idA, idB, admin.id);
  await logAudit({
    actor_user_id: admin.id,
    actor_email: admin.email,
    action: "duplicate.dismissed",
    entity_type: "therapist",
    entity_id: idA,
    metadata: { other_id: idB },
  });
  revalidatePath("/admin/duplicates");
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
