// Renders plain-text post bodies as paragraphs/headings without any HTML
// parsing — admin-authored content still goes through React's escaping, so
// this stays safe without needing a markdown/HTML sanitizer dependency.
export default function PostBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 text-[#151515] leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-black mt-4">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h2 key={i} className="text-2xl font-black mt-6">
              {block.slice(2)}
            </h2>
          );
        }
        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6 flex flex-col gap-1">
              {block.split("\n").map((line, j) => (
                <li key={j}>{line.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}
