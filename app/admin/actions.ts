"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { setTherapistStatus } from "@/lib/therapists";
import { deleteReview } from "@/lib/reviews";
import { setUserRole } from "@/lib/admin-data";
import { resolveRequest } from "@/lib/requests";
import { createPost, updatePost, setPostStatus, deletePost } from "@/lib/posts";
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
