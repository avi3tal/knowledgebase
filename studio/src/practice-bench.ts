/**
 * Pure helpers of the Practice pages on the Workbench (problems list, algo problem, progress,
 * sessions); tested in practice-bench.test.ts.
 *
 * Filters and tabs live in extra hash segments that route.ts ignores, e.g.
 * `#/problems/algo/two-pointers/easy`, `#/problem/algo/two-sum/attempts`,
 * `#/progress/algo/pattern/sliding-window`, so they can be linked without a route change.
 */
import type { Feedback, ProblemRow, Session, TopicFeedback } from "./api";
import type { Difficulty } from "./reader";
import { DIFFICULTIES } from "./reader";

const ID = /^[a-z0-9-]+$/;

/** Hash path segments: "#/problems/algo/x" → ["problems", "algo", "x"]. */
export function hashSegments(hash: string): string[] {
  return hash
    .replace(/^#\/?/, "")
    .split("/")
    .map((s) => decodeURIComponent(s));
}

const segment = (hash: string, i: number): string => {
  const s = hashSegments(hash)[i] ?? "";
  return ID.test(s) ? s : "";
};

export type Status = ProblemRow["status"];
export const STATUSES: Status[] = ["solved", "failing", "untried"];

// ---------------------------------------------------------------- problems list

export interface ProblemsFilter {
  /** topic id, "" = every topic */
  topic: string;
  /** "" = every difficulty */
  difficulty: Difficulty | "";
}

export function problemsFilterOf(hash: string): ProblemsFilter {
  const topic = segment(hash, 2);
  const d = segment(hash, 3);
  return {
    topic: topic === "all" ? "" : topic,
    difficulty: (DIFFICULTIES as string[]).includes(d) ? (d as Difficulty) : "",
  };
}

export function problemsHref(subject: string, f: ProblemsFilter): string {
  const base = `#/problems/${subject}`;
  if (f.difficulty) return `${base}/${f.topic || "all"}/${f.difficulty}`;
  return f.topic ? `${base}/${f.topic}` : base;
}

export interface Counts {
  total: number;
  solved: number;
  failing: number;
  untried: number;
}

export const emptyCounts = (): Counts => ({ total: 0, solved: 0, failing: 0, untried: 0 });

export function countStatus(rows: Pick<ProblemRow, "status">[]): Counts {
  const c = emptyCounts();
  for (const r of rows) {
    c.total++;
    c[r.status]++;
  }
  return c;
}

export function countByDifficulty(
  rows: Pick<ProblemRow, "status" | "difficulty">[],
): Record<Difficulty, Counts> {
  return {
    easy: countStatus(rows.filter((r) => r.difficulty === "easy")),
    medium: countStatus(rows.filter((r) => r.difficulty === "medium")),
    hard: countStatus(rows.filter((r) => r.difficulty === "hard")),
  };
}

/** Status counts per topic id. */
export function countByTopic(rows: Pick<ProblemRow, "status" | "topics">[]): Map<string, Counts> {
  const out = new Map<string, Counts>();
  for (const r of rows)
    for (const t of r.topics) {
      const c = out.get(t) ?? emptyCounts();
      c.total++;
      c[r.status]++;
      out.set(t, c);
    }
  return out;
}

/**
 * Weakness of a topic: practised topics with failures first, then the lowest solved share.
 * Topics never practised (all untried) are not weak, just new: they rank after every practised one.
 */
function weakness(c: Counts): number {
  const practised = c.solved + c.failing;
  if (practised === 0) return -1;
  return c.failing / c.total + (1 - c.solved / c.total);
}

const DIFF_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * Untried problems in the learner's weakest topics, easiest first within a topic; when nothing
 * is practised yet, the easiest untried problems. At most `n`.
 */
export function nextToPractise<
  T extends Pick<ProblemRow, "slug" | "title" | "status" | "topics" | "difficulty">,
>(rows: T[], n = 5): { row: T; topic: string | null }[] {
  const byTopic = countByTopic(rows);
  const weak = [...byTopic]
    .filter(([, c]) => weakness(c) > 0 && c.untried > 0)
    .sort(([a, ca], [b, cb]) => weakness(cb) - weakness(ca) || a.localeCompare(b))
    .map(([t]) => t);
  const untried = rows
    .filter((r) => r.status === "untried")
    .sort(
      (a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || a.title.localeCompare(b.title),
    );
  const out: { row: T; topic: string | null }[] = [];
  const seen = new Set<string>();
  for (const t of weak)
    for (const r of untried)
      if (r.topics.includes(t) && !seen.has(r.slug) && out.length < n) {
        seen.add(r.slug);
        out.push({ row: r, topic: t });
      }
  for (const r of untried)
    if (!seen.has(r.slug) && out.length < n) {
      seen.add(r.slug);
      out.push({ row: r, topic: null });
    }
  return out;
}

/** 0..100, rounded; 0 when total is 0. */
export const pct = (n: number, total: number): number =>
  total > 0 ? Math.round((100 * n) / total) : 0;

// ---------------------------------------------------------------- algo problem page

export type ProblemTab = "problem" | "learn" | "attempts" | "resources";
export const PROBLEM_TABS: ProblemTab[] = ["problem", "learn", "attempts", "resources"];

export function problemTabOf(hash: string): ProblemTab {
  const t = segment(hash, 3);
  return (PROBLEM_TABS as string[]).includes(t) ? (t as ProblemTab) : "problem";
}

export function problemTabHref(subject: string, slug: string, tab: ProblemTab): string {
  return `#/problem/${subject}/${slug}${tab === "problem" ? "" : `/${tab}`}`;
}

/** The tab to keep when moving to another problem: fall back to Problem when it has no such tab. */
export function keepTab(tab: ProblemTab, available: ProblemTab[]): ProblemTab {
  return available.includes(tab) ? tab : "problem";
}

/** Sections that teach rather than state the problem: they go to the Hints & learning tab. */
const LEARN_RE = /^(pattern|learning|hints?|approach|solution|intuition|walkthrough)\b/i;

export interface ReadmeParts {
  /** the statement: everything but the title, the meta line and the learning sections */
  problem: string;
  /** pattern, learning material, hints, approach; "" when the README has none */
  learn: string;
}

/**
 * Split a problem README into the statement and its learning sections, by H2 heading (outside
 * code fences). The `# Title` and the `> Difficulty: …` meta line are dropped: the header shows them.
 */
export function splitReadme(md: string): ReadmeParts {
  const problem: string[] = [];
  const learn: string[] = [];
  let into = problem;
  let fenced = false;
  let started = false;
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) fenced = !fenced;
    if (!fenced && !started) {
      if (/^# /.test(line) || /^>\s*Difficulty:/i.test(line)) continue;
      if (line.trim() === "") continue;
      started = true;
    }
    if (!fenced) {
      const h = /^## (.+)$/.exec(line);
      if (h?.[1]) into = LEARN_RE.test(h[1].replace(/[`*_]/g, "").trim()) ? learn : problem;
    }
    into.push(line);
  }
  return { problem: problem.join("\n").trim(), learn: learn.join("\n").trim() };
}

export interface SourceLink {
  name: string;
  url: string | null;
}

/** `Sources: [leetcode](url), interview:acme` from the README's meta line. */
export function readmeSources(md: string): SourceLink[] {
  const meta = md.split("\n").find((l) => /^>\s*Difficulty:/i.test(l));
  const m = meta ? /Sources:\s*(.+)$/i.exec(meta) : null;
  if (!m?.[1]) return [];
  const out: SourceLink[] = [];
  for (const part of m[1].split(/\s*[,·]\s*/)) {
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(part.trim());
    if (link?.[1]) out.push({ name: link[1], url: link[2] ?? null });
    else if (part.trim()) out.push({ name: part.trim().replace(/[*_]/g, ""), url: null });
  }
  return out;
}

export interface RunLike {
  passed: number;
  total: number;
  error: boolean;
}

/** "ok" when every case passed, "fail" when a run failed, "none" when never run. */
export function runState(r: RunLike | null): "ok" | "fail" | "none" {
  if (!r) return "none";
  return !r.error && r.total > 0 && r.passed === r.total ? "ok" : "fail";
}

// ---------------------------------------------------------------- progress

export interface ProgressView {
  /** catalog group, "" = every group */
  group: string;
  /** topic id to bring into view, "" = none */
  topic: string;
}

export function progressViewOf(hash: string): ProgressView {
  const group = segment(hash, 2);
  return { group: group === "all" ? "" : group, topic: segment(hash, 3) };
}

export function progressHref(subject: string, v: ProgressView): string {
  const base = `#/progress/${subject}`;
  if (v.topic) return `${base}/${v.group || "all"}/${v.topic}`;
  return v.group ? `${base}/${v.group}` : base;
}

/** Solved share of a topic's problems, 0..1 (0 without problems). */
export function mastery(t: Pick<TopicFeedback, "counts" | "problems">): number {
  return t.problems.length ? t.counts.solved / t.problems.length : 0;
}

/** ● mastered (≥ 80 %), ◐ under way, ○ not started. */
export function masteryIcon(t: Pick<TopicFeedback, "counts" | "problems">): string {
  const m = mastery(t);
  if (t.problems.length > 0 && m >= 0.8) return "●";
  return t.counts.solved + t.counts.failing > 0 ? "◐" : "○";
}

export interface ProgressTotals extends Counts {
  topics: number;
  lessons: number;
  /** mean quiz accuracy over topics with a quiz score, 0..1, or null */
  quiz: number | null;
  due: number;
}

/** Totals over every distinct problem of the feedback (a problem can be in several topics). */
export function progressTotals(data: Feedback): ProgressTotals {
  const bySlug = new Map<string, Status>();
  for (const t of data.topics) for (const p of t.problems) bySlug.set(p.slug, p.status);
  const c = countStatus([...bySlug.values()].map((status) => ({ status })));
  const quizzes = data.topics.flatMap((t) => (t.quiz_accuracy === null ? [] : [t.quiz_accuracy]));
  return {
    ...c,
    topics: data.topics.filter((t) => t.problems.length > 0 || t.has_lesson).length,
    lessons: data.topics.filter((t) => t.has_lesson).length,
    quiz: quizzes.length ? quizzes.reduce((a, b) => a + b, 0) / quizzes.length : null,
    due: data.topics.filter((t) => t.review_due && t.review_due <= data.today).length,
  };
}

/** Practised topics (any solved or failing problem), strongest and weakest first; at most n each. */
export function rankTopics<T extends Pick<TopicFeedback, "id" | "counts" | "problems">>(
  topics: T[],
  n = 5,
): { strongest: T[]; weakest: T[] } {
  const practised = topics.filter((t) => t.counts.solved + t.counts.failing > 0);
  const score = (t: T) => mastery(t) - t.counts.failing / Math.max(1, t.problems.length);
  const sorted = [...practised].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const strongest = sorted.filter((t) => t.counts.solved > 0).slice(0, n);
  // A topic with everything solved has nothing weak about it.
  const weakest = [...sorted]
    .reverse()
    .filter((t) => t.counts.solved < t.problems.length)
    .slice(0, n);
  return { strongest, weakest };
}

/** Distinct problems by last practice, newest first. */
export function recentlyPractised(data: Feedback, n = 6) {
  const bySlug = new Map<string, TopicFeedback["problems"][number]>();
  for (const t of data.topics)
    for (const p of t.problems) if (p.last_practiced) bySlug.set(p.slug, p);
  return [...bySlug.values()]
    .sort((a, b) => (b.last_practiced ?? "").localeCompare(a.last_practiced ?? ""))
    .slice(0, n);
}

// ---------------------------------------------------------------- sessions

/** The session list with `s` replacing (or added to) its stored copy, e.g. after a status POST. */
export function withSession(list: Session[], s: Session): Session[] {
  return list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [s, ...list];
}

export interface SessionsSummary {
  total: number;
  active: number;
  done: number;
  /** mean score of scored sessions, or null */
  average: number | null;
  /** mean completion 0..1 of non-abandoned sessions, or 0 */
  completion: number;
}

export function sessionsSummary(
  sessions: Pick<Session, "status" | "score" | "completion">[],
): SessionsSummary {
  const scored = sessions.flatMap((s) => (s.score === null ? [] : [s.score]));
  const live = sessions.filter((s) => s.status !== "abandoned");
  return {
    total: sessions.length,
    active: sessions.filter((s) => s.status === "active").length,
    done: sessions.filter((s) => s.status === "done").length,
    average: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
    completion: live.length ? live.reduce((a, s) => a + s.completion, 0) / live.length : 0,
  };
}
