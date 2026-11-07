/** Table of contents for long markdown (design solutions): heading ids shared with <Markdown anchors>. */

export interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** H2/H3 headings outside code fences, in order; duplicate ids get -2, -3… like the renderer. */
export function extractToc(md: string): TocEntry[] {
  const out: TocEntry[] = [];
  const seen = new Map<string, number>();
  let fenced = false;
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^(##|###) (.+?)\s*#*\s*$/.exec(line);
    if (!m?.[1] || !m[2]) continue;
    const text = m[2].replace(/[`*_]/g, "");
    out.push({ level: m[1].length as 2 | 3, text, id: uniqueId(slugify(text), seen) });
  }
  return out;
}

export function uniqueId(base: string, seen: Map<string, number>): string {
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}
