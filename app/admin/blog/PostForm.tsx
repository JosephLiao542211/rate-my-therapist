"use client";

import type { Post } from "@/lib/posts";

export default function PostForm({
  post,
  action,
}: {
  post?: Post;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold text-[#151515] mb-1">Title</label>
        <input
          name="title"
          type="text"
          defaultValue={post?.title}
          required
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#151515] mb-1">
          Excerpt <span className="text-gray-400 font-normal">(shown on the blog index)</span>
        </label>
        <input
          name="excerpt"
          type="text"
          defaultValue={post?.excerpt ?? ""}
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#151515] mb-1">Cover Image URL</label>
        <input
          name="cover_image_url"
          type="url"
          defaultValue={post?.cover_image_url ?? ""}
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#151515] mb-1">
          Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          name="tags"
          type="text"
          defaultValue={post?.tags.join(", ") ?? ""}
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#151515] mb-1">
          Body <span className="text-gray-400 font-normal">(blank line = new paragraph, &quot;# &quot; = heading, &quot;- &quot; = list item)</span>
        </label>
        <textarea
          name="body"
          defaultValue={post?.body}
          required
          rows={16}
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515] font-mono"
        />
      </div>
      {!post && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" name="publish" className="w-4 h-4 rounded border-gray-400" />
          <span className="text-sm text-[#151515]">Publish immediately</span>
        </label>
      )}
      <button
        type="submit"
        className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition text-sm self-start"
      >
        {post ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}
