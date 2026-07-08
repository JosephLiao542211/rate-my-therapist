import Link from "next/link";
import { getAllPostsAdmin } from "@/lib/posts";
import { setPostStatusAction, deletePostAction } from "@/app/admin/actions";

export default async function AdminBlogPage() {
  const posts = await getAllPostsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Blog</h1>
          <p className="text-sm text-gray-500">{posts.length} post{posts.length === 1 ? "" : "s"}.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-[#151515] text-white text-sm font-bold px-4 py-2 rounded hover:opacity-80 transition"
        >
          New Post
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold truncate">{p.title}</p>
                <span
                  className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                    p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                /blog/{p.slug} · updated {new Date(p.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/blog/${p.id}/edit`}
                className="text-xs font-bold text-gray-600 hover:text-[#151515] underline"
              >
                Edit
              </Link>
              <form action={setPostStatusAction.bind(null, p.id, p.status === "published" ? "draft" : "published")}>
                <button className="text-xs font-bold text-gray-600 hover:text-[#151515] underline">
                  {p.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </form>
              <form action={deletePostAction.bind(null, p.id)}>
                <button className="text-xs font-bold text-gray-600 hover:text-red-600 underline">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
            No posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
