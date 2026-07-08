import Link from "next/link";
import { Fragment } from "react";

// Renders inline **bold** and [text](url) markdown within a line of plain text,
// without any HTML parsing — content is authored in lib/help.ts, not user input.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={key} className="font-semibold text-[#151515]">
          {boldMatch[1]}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <Link key={key} href={linkMatch[2]} className="underline hover:text-[#151515]">
          {linkMatch[1]}
        </Link>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function HelpArticleBody({ body }: { body: string[] }) {
  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed text-gray-700">
      {body.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1 && lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(block, `${i}`)}</p>;
      })}
    </div>
  );
}
