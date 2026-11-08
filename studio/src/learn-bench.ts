/** Pure helpers of the Learn pages on the Workbench (home, lesson, topic, map); tested in learn-bench.test.ts. */
import type { Block, Feedback, Graph, Topic, TopicFeedback, TopicRole, TopicState } from "./api";
import { groupLabel, groupTopics, topicIcon } from "./catalog";
import type { NavGroup } from "./components/panes";
import type { TocEntry } from "./toc";
import { extractToc } from "./toc";

export const lessonHref = (subject: string, id: string) => `#/learn/${subject}/${id}`;
export const topicPageHref = (subject: string, id: string) => `#/topic/${subject}/${id}`;
/** Lesson when there is one, else the topic page. */
export const bestHref = (subject: string, t: Pick<Topic, "id" | "has_lesson">) =>
  t.has_lesson ? lessonHref(subject, t.id) : topicPageHref(subject, t.id);

// ---------------------------------------------------------------- left pane + prev / next

/**
 * The subject's topics as NavList groups, in teaching order (groupTopics). `lessonsOnly` keeps
 * topics with a lesson (the lesson page's list); `href` says where each item links.
 */
export function topicNavGroups(
  topics: Topic[],
  opts: {
    current?: string;
    lessonsOnly?: boolean;
    href: (t: Topic) => string;
    badge?: (t: Topic) => string | number | undefined;
  },
): NavGroup[] {
  return groupTopics(opts.lessonsOnly ? topics.filter((t) => t.has_lesson) : topics)
    .filter((g) => g.topics.length > 0)
    .map((g) => ({
      key: g.group,
      label: groupLabel(g.group),
      color: g.color,
      items: g.topics.map((t) => {
        const state = topicStateOf(t);
        return {
          id: t.id,
          title: t.name,
          href: opts.href(t),
          icon: opts.lessonsOnly ? topicIcon(t) : STATE_ICON[state],
          hint: `${t.usage} ${g.group}${state === "planned" ? " planned" : ""}`,
          current: t.id === opts.current,
          muted: !opts.lessonsOnly && !t.has_lesson,
          disabled: state === "planned" && t.id !== opts.current,
          badge: opts.badge?.(t),
        };
      }),
    }));
}

export const STATE_ICON: Record<TopicState, string> = {
  lesson: "📖",
  "practice-only": "🧪",
  planned: "○",
};

/** A topic's state; older payloads without `state` fall back to has_lesson. */
export function topicStateOf(t: Pick<Topic, "has_lesson" | "state">): TopicState {
  return t.state ?? (t.has_lesson ? "lesson" : "practice-only");
}

export const ROLE_ORDER: TopicRole[] = ["topic", "technology", "pattern"];
export const ROLE_LABEL: Record<TopicRole, string> = {
  topic: "As a core topic",
  technology: "As a technology",
  pattern: "As a pattern",
};

/** Items grouped by role in ROLE_ORDER (items without a role count as "pattern"); empty groups dropped. */
export function groupByRole<T extends { role?: TopicRole }>(
  items: T[],
): { role: TopicRole; items: T[] }[] {
  return ROLE_ORDER.map((role) => ({
    role,
    items: items.filter((x) => (x.role ?? "pattern") === role),
  })).filter((g) => g.items.length > 0);
}

/** Previous / next item of the flattened groups (left-list order); null at the ends or if absent. */
export function prevNext<T extends { id: string }>(
  groups: { items: T[] }[],
  id: string,
): { prev: T | null; next: T | null; index: number; total: number } {
  const flat = groups.flatMap((g) => g.items);
  const i = flat.findIndex((x) => x.id === id);
  if (i < 0) return { prev: null, next: null, index: -1, total: flat.length };
  return { prev: flat[i - 1] ?? null, next: flat[i + 1] ?? null, index: i, total: flat.length };
}

// ---------------------------------------------------------------- lesson sections

export type SectionKey = "learn" | "quiz" | "practice" | "resources";
export interface LessonSection {
  key: SectionKey;
  label: string;
  icon: string;
  /** indexes into lesson.blocks, in order */
  blocks: number[];
  /** a small count for the tab badge (traces, questions, problems, resources) */
  count: number;
}

const SECTION_META: Record<SectionKey, { label: string; icon: string }> = {
  learn: { label: "Learn", icon: "📖" },
  quiz: { label: "Quiz", icon: "🧠" },
  practice: { label: "Practice", icon: "🧪" },
  resources: { label: "Resources", icon: "📚" },
};

export function sectionOf(b: Block): SectionKey {
  switch (b.type) {
    case "markdown":
    case "trace":
      return "learn"; // traces stay next to the prose that explains them
    case "quiz":
      return "quiz";
    case "problems":
    case "design-problems":
      return "practice";
    case "resources":
      return "resources";
  }
}

function blockCount(b: Block): number {
  switch (b.type) {
    case "markdown":
      return 0;
    case "trace":
      return 1;
    case "quiz":
      return b.items.length;
    case "problems":
    case "design-problems":
      return b.problems.length;
    case "resources":
      return b.resources.length;
  }
}

/** The lesson's non-empty sections in a fixed order: Learn | Quiz | Practice | Resources. */
export function lessonSections(blocks: Block[]): LessonSection[] {
  const order: SectionKey[] = ["learn", "quiz", "practice", "resources"];
  return order
    .map((key) => {
      const idx = blocks.flatMap((b, i) => (sectionOf(b) === key ? [i] : []));
      const count = idx.reduce((n, i) => n + blockCount(blocks[i]!), 0);
      return { key, ...SECTION_META[key], blocks: idx, count };
    })
    .filter((s) => s.blocks.length > 0 && (s.key === "learn" || s.count > 0));
}

/** Id of the wrapper element around a non-markdown block (synthetic TOC target). */
export const blockId = (i: number) => `lb-block-${i}`;

/**
 * TOC of the given blocks: markdown h2/h3 per block (each <Markdown anchors> dedupes its own ids),
 * plus one entry per trace / quiz / practice / resources block pointing at its wrapper.
 */
export function lessonToc(blocks: Block[], only?: number[]): TocEntry[] {
  const out: TocEntry[] = [];
  for (const i of only ?? blocks.map((_, k) => k)) {
    const b = blocks[i];
    if (!b) continue;
    if (b.type === "markdown") out.push(...extractToc(b.text));
    else if (b.type === "trace")
      out.push({ level: 3, text: `▶ ${b.trace.title || "Trace"}`, id: blockId(i) });
    else if (b.type === "quiz") out.push({ level: 2, text: "Quiz", id: blockId(i) });
    else if (b.type === "resources") out.push({ level: 2, text: "Go deeper", id: blockId(i) });
    else out.push({ level: 2, text: "Practice", id: blockId(i) });
  }
  return out;
}

// ---------------------------------------------------------------- home: next up / weakest

export interface Suggestion {
  id: string;
  name: string;
  reason: string;
  tone: "due" | "weak" | "start";
}

const isDue = (t: TopicFeedback, today: string) => !!t.review_due && t.review_due <= today;

/**
 * Deterministic study suggestions from `kb feedback`:
 * - next: spaced reviews due (oldest first), then the first lessons in teaching order that were never
 *   touched (no runs, no quiz), up to `limit`;
 * - weakest: practised topics with failing problems or a quiz below 70 %, worst first.
 */
export function suggestions(
  feedback: Feedback | null,
  topics: Topic[],
  limit = 4,
): { next: Suggestion[]; weakest: Suggestion[] } {
  if (!feedback) return { next: [], weakest: [] };
  const fb = new Map(feedback.topics.map((t) => [t.id, t]));
  const due = feedback.topics
    .filter((t) => isDue(t, feedback.today))
    .sort((a, b) => (a.review_due ?? "").localeCompare(b.review_due ?? ""))
    .map((t): Suggestion => ({ id: t.id, name: t.name, reason: "review due", tone: "due" }));
  const fresh = groupTopics(topics)
    .flatMap((g) => g.topics)
    .filter((t) => {
      const f = fb.get(t.id);
      return (
        t.has_lesson &&
        !due.some((d) => d.id === t.id) &&
        (!f || (f.last_practiced === null && f.quiz_accuracy === null))
      );
    })
    .map((t): Suggestion => ({ id: t.id, name: t.name, reason: "not started", tone: "start" }));
  const weakScore = (t: TopicFeedback) => {
    const tried = t.counts.solved + t.counts.failing;
    const fail = tried ? t.counts.failing / tried : 0;
    const quiz = t.quiz_accuracy === null ? 0 : 1 - t.quiz_accuracy;
    return Math.max(fail, quiz);
  };
  const weakest = feedback.topics
    .filter((t) => t.counts.failing > 0 || (t.quiz_accuracy !== null && t.quiz_accuracy < 0.7))
    .map((t) => ({ t, s: weakScore(t) }))
    .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))
    .slice(0, limit)
    .map(({ t }): Suggestion => {
      const bits = [];
      if (t.counts.failing) bits.push(`${t.counts.failing} failing`);
      if (t.quiz_accuracy !== null && t.quiz_accuracy < 0.7)
        bits.push(`quiz ${Math.round(t.quiz_accuracy * 100)}%`);
      return { id: t.id, name: t.name, reason: bits.join(" · "), tone: "weak" };
    });
  return { next: [...due, ...fresh].slice(0, limit), weakest };
}

/** Stats for the home header / footer. */
export function homeStats(topics: Topic[], feedback: Feedback | null) {
  const problems = new Set(feedback?.topics.flatMap((t) => t.problems.map((p) => p.slug)));
  const solved = new Set(
    feedback?.topics.flatMap((t) =>
      t.problems.filter((p) => p.status === "solved").map((p) => p.slug),
    ),
  );
  const failing = new Set(
    feedback?.topics.flatMap((t) =>
      t.problems.filter((p) => p.status === "failing").map((p) => p.slug),
    ),
  );
  return {
    topics: topics.length,
    lessons: topics.filter((t) => t.has_lesson).length,
    problems: problems.size,
    solved: solved.size,
    failing: failing.size,
  };
}

// ---------------------------------------------------------------- knowledge map

export interface MapNode {
  id: string;
  topic: Topic;
  group: string;
  color: string;
  x: number;
  y: number;
  /** radians, for label rotation */
  angle: number;
  problems: number;
  refs: number;
}
export interface MapEdge {
  from: string;
  to: string;
  type: "prereq" | "related";
}

const tid = (nodeId: string) => (nodeId.startsWith("topic:") ? nodeId.slice(6) : null);

/** Problems (practice) and resources (covers / explains) per topic, counting edges both ways. */
export function topicCounts(graph: Graph): Map<string, { problems: number; refs: number }> {
  const out = new Map<string, { problems: number; refs: number }>();
  const bump = (id: string, k: "problems" | "refs") => {
    const c = out.get(id) ?? { problems: 0, refs: 0 };
    c[k]++;
    out.set(id, c);
  };
  for (const e of graph.edges) {
    const a = tid(e.from);
    const b = tid(e.to);
    const other = a ? e.to : e.from;
    const t = a ?? b;
    if (!t || (a && b)) continue;
    if (other.startsWith("problem:")) bump(t, "problems");
    else if (other.startsWith("ref:")) bump(t, "refs");
  }
  return out;
}

/** Topic↔topic edges (prereq: from is learnt first; related: undirected, deduped). */
export function topicEdges(graph: Graph): MapEdge[] {
  const seen = new Set<string>();
  const out: MapEdge[] = [];
  for (const e of graph.edges) {
    if (e.type !== "prereq" && e.type !== "related") continue;
    const a = tid(e.from);
    const b = tid(e.to);
    if (!a || !b || a === b) continue;
    const key = e.type === "related" ? [a, b].sort().join("|") + "|r" : `${a}|${b}|p`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from: a, to: b, type: e.type });
  }
  return out;
}

/** Room outside the ring for labels (viewBox units); labels are cut to fit (see mapLabel). */
export const LABEL_ROOM = 190;
export const mapLabel = (s: string) => (s.length > 22 ? `${s.slice(0, 21)}…` : s);

export interface RingLayout {
  nodes: MapNode[];
  radius: number;
  /** square viewBox side; the centre is size / 2 */
  size: number;
  arcs: { group: string; color: string; a0: number; a1: number }[];
}

/**
 * Deterministic ring layout: topics in teaching order around a circle, each group an arc separated
 * by a gap, so groups read as coloured sectors and edges cross the middle. The radius grows with the
 * topic count so every label keeps ~24 units of arc; the viewBox adds room for the labels outside.
 */
export function ringLayout(
  topics: Topic[],
  counts: Map<string, { problems: number; refs: number }> = new Map(),
): RingLayout {
  const groups = groupTopics(topics);
  const n = topics.length;
  const radius = Math.round(Math.max(150, (n * 24) / (2 * Math.PI)));
  const size = 2 * (radius + LABEL_ROOM);
  const c = size / 2;
  if (n === 0) return { nodes: [], radius, size, arcs: [] };
  const gap = groups.length > 1 ? Math.min(0.14, (Math.PI * 0.5) / groups.length) : 0;
  const step = (2 * Math.PI - gap * groups.length) / n;
  let a = -Math.PI / 2 + gap / 2;
  const nodes: MapNode[] = [];
  const arcs: RingLayout["arcs"] = [];
  for (const g of groups) {
    const a0 = a;
    for (const t of g.topics) {
      const angle = a + step / 2;
      nodes.push({
        id: t.id,
        topic: t,
        group: g.group,
        color: g.color,
        angle,
        x: c + radius * Math.cos(angle),
        y: c + radius * Math.sin(angle),
        ...(counts.get(t.id) ?? { problems: 0, refs: 0 }),
      });
      a += step;
    }
    arcs.push({ group: g.group, color: g.color, a0, a1: a });
    a += gap;
  }
  return { nodes, radius, size, arcs };
}

/** Curved edge between two ring nodes, bowed towards the centre (SVG path data). */
export function edgePath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: number,
): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const qx = c + (mx - c) * 0.35;
  const qy = c + (my - c) * 0.35;
  const r = (v: number) => Math.round(v * 10) / 10;
  return `M${r(a.x)},${r(a.y)} Q${r(qx)},${r(qy)} ${r(b.x)},${r(b.y)}`;
}

/** Node radius: 5 px plus a little per problem, capped. */
export const nodeRadius = (problems: number) => Math.min(13, 5 + Math.sqrt(problems) * 1.6);

/** Ids linked to `id` (either direction) by the given edges. */
export function linkedTo(id: string, edges: MapEdge[]): Set<string> {
  const out = new Set<string>();
  for (const e of edges) {
    if (e.from === id) out.add(e.to);
    if (e.to === id) out.add(e.from);
  }
  return out;
}
