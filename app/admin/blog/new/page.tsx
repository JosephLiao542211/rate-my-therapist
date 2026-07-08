import PostForm from "@/app/admin/blog/PostForm";
import { createPostAction } from "@/app/admin/actions";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">New Post</h1>
      <PostForm action={createPostAction} />
    </div>
  );
}
