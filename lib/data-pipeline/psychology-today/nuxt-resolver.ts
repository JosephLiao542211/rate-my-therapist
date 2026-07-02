/**
 * Resolves the flattened __NUXT_DATA__ reference table format.
 *
 * Psychology Today (Nuxt 3) serialises page state as a single flat array
 * where every object/array stores indices into that array instead of values.
 * Special two-element arrays like ["ShallowReactive", 1] are reactive wrappers.
 *
 * resolve(data, idx) dereferences index idx and recursively resolves children.
 */

type NuxtDataEntry = string | number | boolean | null | NuxtDataEntry[] | Record<string, number>;

export function resolveNuxt(data: NuxtDataEntry[], idx: number): unknown {
  return _resolve(data, idx, new Set<number>());
}

function _resolve(data: NuxtDataEntry[], idx: number, seen: Set<number>): unknown {
  if (idx < 0 || idx >= data.length) return undefined;

  // Guard circular references
  if (seen.has(idx)) return null;
  const next = new Set(seen);
  next.add(idx);

  const val = data[idx];

  // Primitive — return directly
  if (val === null || typeof val !== "object") return val;

  // Array
  if (Array.isArray(val)) {
    // Reactive/ref wrappers: ["ShallowReactive" | "Reactive" | "ShallowRef", targetIdx]
    if (
      val.length === 2 &&
      typeof val[0] === "string" &&
      (val[0] === "ShallowReactive" || val[0] === "Reactive" || val[0] === "ShallowRef" || val[0] === "Ref")
    ) {
      return _resolve(data, val[1] as number, next);
    }

    // Regular array: each element is an index or a primitive
    return val.map((item) =>
      typeof item === "number" ? _resolve(data, item, next) : item
    );
  }

  // Plain object: values are indices into data
  const result: Record<string, unknown> = {};
  for (const [key, refIdx] of Object.entries(val)) {
    result[key] = typeof refIdx === "number" ? _resolve(data, refIdx, next) : refIdx;
  }
  return result;
}

/** Extract the __NUXT_DATA__ JSON array from raw HTML */
export function extractNuxtData(html: string): NuxtDataEntry[] | null {
  const match = html.match(
    /<script[^>]+id="__NUXT_DATA__"[^>]*>\s*([\s\S]*?)\s*<\/script>/i
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as NuxtDataEntry[];
  } catch {
    return null;
  }
}

/** Extract all application/ld+json blocks from raw HTML */
export function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      results.push(JSON.parse(m[1]));
    } catch {
      // ignore malformed blocks
    }
  }
  return results;
}
