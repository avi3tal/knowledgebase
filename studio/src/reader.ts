/** Pure helpers of the design problem reader (components/DesignProblemPage.tsx); tested in reader.test.ts. */
import type {
  DesignCheckItem,
  DesignPart,
  DesignStage,
  Diagram,
  DiagramEdge,
  ProblemRow,
} from "./api";

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DIFF_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

// ---------------------------------------------------------------- left pane: problem list

/** The left-list order: difficulty, then the shown (short) title. Prev/next follow it too. */
export function orderProblems<T extends Pick<ProblemRow, "difficulty" | "title">>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] ||
      shortTitle(a.title).localeCompare(shortTitle(b.title)),
  );
}

/** Case-insensitive match on title, slug and topic ids; every word of the query must match. */
export function matchesQuery(
  row: Pick<ProblemRow, "title" | "slug" | "topics">,
  query: string,
): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = [row.title, row.slug, ...row.topics].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

export interface ProblemGroup<T> {
  difficulty: Difficulty;
  rows: T[];
  /** rows in this difficulty before filtering */
  total: number;
}

/** Filtered rows grouped by difficulty (empty groups dropped), each sorted by title. */
export function groupProblems<
  T extends Pick<ProblemRow, "difficulty" | "title" | "slug" | "topics">,
>(rows: T[], query: string): ProblemGroup<T>[] {
  const ordered = orderProblems(rows);
  return DIFFICULTIES.map((d) => {
    const all = ordered.filter((r) => r.difficulty === d);
    return { difficulty: d, total: all.length, rows: all.filter((r) => matchesQuery(r, query)) };
  }).filter((g) => g.rows.length > 0);
}

/** Previous / next slug in list order; null at the ends or when `slug` is not listed. */
export function neighbours<T extends { slug: string }>(
  ordered: T[],
  slug: string,
): { prev: T | null; next: T | null } {
  const i = ordered.findIndex((r) => r.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: ordered[i - 1] ?? null, next: ordered[i + 1] ?? null };
}

/** "Design a rate limiter" → "Rate limiter": the list is all design problems anyway. */
export function shortTitle(title: string): string {
  const s = title.replace(/^design\s+(an?\s+|the\s+)?/i, "");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : title;
}

export const STATUS_ICON: Record<ProblemRow["status"], string> = {
  solved: "✓",
  failing: "✗",
  untried: "○",
};

// ---------------------------------------------------------------- problem tab: stage strip

export interface StageStep {
  stage: DesignStage;
  checks: number;
  /** the decompose → reduce core of the method */
  core: boolean;
}

export function stageSteps(
  stages: DesignStage[],
  checks: Pick<DesignCheckItem, "stage">[],
): StageStep[] {
  const decomposes = stages.includes("parts");
  return stages.map((stage) => ({
    stage,
    checks: checks.filter((c) => c.stage === stage).length,
    core: decomposes && (stage === "parts" || stage === "high-level"),
  }));
}

// ---------------------------------------------------------------- solution tab: reveal gate

export const revealKey = (subject: string, slug: string) => `kb.reader.revealed.${subject}.${slug}`;

/** Ask before showing the solution unless it was revealed before or an attempt is submitted. */
export function needsGate(attempts: { submitted: boolean }[], revealed: boolean): boolean {
  return !revealed && !attempts.some((a) => a.submitted);
}

/** "▶ Practice" continues the latest attempt (attempts are listed oldest first), else starts one. */
export function latestAttempt<T extends { name: string }>(attempts: T[]): T | null {
  return attempts[attempts.length - 1] ?? null;
}

// ---------------------------------------------------------------- solution tab: ```diagram fences

export type FenceRef = { kind: "version"; version: number } | { kind: "part"; id: string };

/** Body of a ```diagram fence: `v2` or `part:P1`; anything else is not ours. */
export function parseDiagramFence(body: string): FenceRef | null {
  const s = body.trim();
  const v = /^v(\d+)$/i.exec(s);
  if (v?.[1]) return { kind: "version", version: Number(v[1]) };
  const p = /^part:\s*([A-Za-z0-9_-]+)$/.exec(s);
  if (p?.[1]) return { kind: "part", id: p[1] };
  return null;
}

/** Versions named by ```diagram vN fences of a walkthrough. */
export function fencedVersions(md: string): Set<number> {
  const out = new Set<number>();
  const re = /^```diagram[ \t]*\n\s*v(\d+)\s*\n```/gim;
  for (const m of md.matchAll(re)) out.add(Number(m[1]));
  return out;
}

const edgeId = (e: Pick<DiagramEdge, "from" | "to">) => `${e.from}->${e.to}`;

export interface Added {
  nodes: Set<string>;
  edges: Set<string>;
}

/**
 * Nodes and edges of `version` that the previous version (by number) lacked. The first version
 * gets nothing marked: everything is new there.
 */
export function addedInVersion(diagrams: Diagram[], version: number): Added {
  const sorted = [...diagrams].sort((a, b) => a.version - b.version);
  const i = sorted.findIndex((d) => d.version === version);
  const cur = sorted[i];
  const prev = sorted[i - 1];
  if (!cur || !prev) return { nodes: new Set(), edges: new Set() };
  const pn = new Set(prev.nodes.map((n) => n.id));
  const pe = new Set(prev.edges.map(edgeId));
  return {
    nodes: new Set(cur.nodes.filter((n) => !pn.has(n.id)).map((n) => n.id)),
    edges: new Set(cur.edges.map(edgeId).filter((k) => !pe.has(k))),
  };
}

/** A part's sub-diagram as a renderable Diagram. */
export function partDiagram(part: Pick<DesignPart, "diagram">): Diagram {
  return { version: 1, why: "", nodes: part.diagram.nodes, edges: part.diagram.edges };
}

// ---------------------------------------------------------------- chips

/** Catalog link for a topic/technology/pattern id, or null when the catalog doesn't know it. */
export function topicHref(
  subject: string,
  id: string,
  names: Record<string, string>,
): string | null {
  return Object.hasOwn(names, id) ? `#/topic/${subject}/${id}` : null;
}

/** "zookeeper-etcd" → "Zookeeper etcd" when the catalog has no name for it. */
export function chipLabel(id: string, names: Record<string, string>): string {
  const n = names[id];
  if (n) return n;
  const s = id.replace(/[-_]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------- right pane: scroll-spy & progress

/** 0..1 of the scroller read. A page that fits counts as read. */
export function readingProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const max = scrollHeight - clientHeight;
  if (max <= 1) return 1;
  return Math.min(1, Math.max(0, scrollTop / max));
}

/**
 * Index of the heading being read: the last one whose top (relative to the scroller's content)
 * is above scrollTop + offset; at the very bottom, the last heading. -1 before the first.
 */
export function activeHeading(
  tops: number[],
  scrollTop: number,
  offset: number,
  atBottom = false,
): number {
  if (tops.length === 0) return -1;
  if (atBottom) return tops.length - 1;
  let active = -1;
  for (let i = 0; i < tops.length; i++) {
    if ((tops[i] ?? Infinity) <= scrollTop + offset) active = i;
  }
  return active;
}

// ---------------------------------------------------------------- keys

/** `[` / `]` to the previous / next problem; null for anything else (modifiers excluded). */
export function navKey(e: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}): "prev" | "next" | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  return e.key === "[" ? "prev" : e.key === "]" ? "next" : null;
}

export const LABEL_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
