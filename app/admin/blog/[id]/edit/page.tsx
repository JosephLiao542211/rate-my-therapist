import { notFound } from "next/navigation";
import { getPostById } from "@/lib/posts";
import PostForm from "@/app/admin/blog/PostForm";
import { updatePostAction } from "@/app/admin/actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">Edit Post</h1>
      <PostForm post={post} action={updatePostAction.bind(null, id)} />
    </div>
  );
}
