import type { ProblemRow, Subject } from "./api";
import { topicIcon } from "./catalog";
import { DESIGN_SUBJECTS, problemHref } from "./route";

/** Global (⌘K) search over topics and problems of every subject. Pure; tested in search.test.ts. */

export interface SearchItem {
  kind: "topic" | "problem";
  subject: string;
  id: string;
  title: string;
  detail: string;
  icon: string;
  href: string;
  locked: boolean;
}

export function buildIndex(
  subjects: Subject[],
  problems: Record<string, ProblemRow[]>,
): SearchItem[] {
  const items: SearchItem[] = [];
  for (const s of subjects) {
    const locked = s.status === "locked";
    for (const t of s.topics) {
      items.push({
        kind: "topic",
        subject: s.id,
        id: t.id,
        title: t.name,
        detail: t.usage,
        icon: topicIcon(t),
        href: t.has_lesson ? `#/learn/${s.id}/${t.id}` : `#/topic/${s.id}/${t.id}`,
        locked,
      });
    }
    for (const p of problems[s.id] ?? []) {
      items.push({
        kind: "problem",
        subject: s.id,
        id: p.slug,
        title: p.title,
        detail: `${p.difficulty} · ${p.topics.join(", ")}`,
        icon:
          p.status === "solved"
            ? "✅"
            : p.status === "failing"
              ? "❌"
              : DESIGN_SUBJECTS.has(s.id)
                ? "🏗️"
                : "📝",
        href: problemHref(s.id, p.slug),
        locked,
      });
    }
  }
  return items;
}

/** Score: title prefix > word prefix > title substring > detail substring; every term must match. */
function score(item: SearchItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const hay = `${title} ${item.id} ${item.detail.toLowerCase()}`;
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 8;
    else if (title.split(/[\s-]+/).some((w) => w.startsWith(term))) total += 5;
    else if (title.includes(term) || item.id.includes(term)) total += 3;
    else if (hay.includes(term)) total += 1;
    else return 0;
  }
  return total + (item.kind === "topic" ? 0.5 : 0);
}

export function search(index: SearchItem[], query: string, limit = 12): SearchItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return index
    .map((item) => ({ item, s: score(item, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((x) => x.item);
}
