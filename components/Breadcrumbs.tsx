import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo";

export default function Breadcrumbs({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(items)) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={item.url} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">/</span>}
            {i === items.length - 1 ? (
              <span className="text-gray-700">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-[#0057FF] transition">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
