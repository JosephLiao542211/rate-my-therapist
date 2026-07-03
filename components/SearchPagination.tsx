function buildPageList(page: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function SearchPagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 mt-10 max-w-full">
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <a
            key={p}
            href={buildHref(p)}
            className={`px-4 py-2 rounded text-sm font-bold border transition ${
              p === page
                ? "bg-[#151515] text-white border-[#151515]"
                : "border-gray-300 text-[#151515] hover:bg-[#151515] hover:text-white hover:border-[#151515]"
            }`}
          >
            {p}
          </a>
        )
      )}
    </nav>
  );
}
