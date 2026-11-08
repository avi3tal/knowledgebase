import type { Json, Trace } from "./trace";

export interface Topic {
  id: string;
  name: string;
  kind: string;
  group?: string;
  order?: number;
  usage: string;
  ds: string[];
  samples: string[];
  has_lesson: boolean;
  /** problems that practise it (from /api/subjects) */
  problems?: number;
  state?: TopicState;
}
/** lesson | practice-only (problems or refs, no lesson yet) | planned (nothing to show yet) */
export type TopicState = "lesson" | "practice-only" | "planned";
/** How a problem uses a topic: design meta key (topic / technology / pattern); algo is "pattern". */
export type TopicRole = "topic" | "technology" | "pattern";
export interface TopicLink {
  id: string;
  role: TopicRole;
  name: string;
  has_lesson: boolean;
}
export interface SimilarProblem {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: "solved" | "failing" | "untried";
  score: number;
  shared: string[];
}
/** Practice -> Learn links every problem page carries. */
export interface ProblemContext {
  topic_links?: TopicLink[];
  similar?: SimilarProblem[];
}
export interface TopicProblem {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  role?: TopicRole;
  status?: "solved" | "failing" | "untried";
  other_topics?: string[];
}
export interface Subject {
  id: string;
  title: string;
  status: "open" | "locked";
  topics: Topic[];
}

export interface Resource {
  id: string;
  title: string;
  url: string | null;
  page: number | null;
  kind: string;
  access: "free" | "trial" | "paid" | "local";
  summary: string;
  quality: number;
  source: string;
  source_name: string;
  verdict: string;
  spoiler?: boolean;
}

export interface GraphNode {
  id: string;
  type: "topic" | "problem" | "ref" | "source";
  label: string;
  kind?: string;
  status?: string;
  has_lesson?: boolean;
  difficulty?: string;
  access?: string;
  url?: string | null;
  page?: number | null;
}
export interface GraphEdge {
  from: string;
  to: string;
  type: "prereq" | "related" | "practice" | "covers" | "explains" | "from";
}
export interface Graph {
  subject: string;
  center?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TopicPageData {
  subject: string;
  subject_status: "open" | "locked";
  topic: Topic & { prereqs: string[]; related: string[]; group?: string; status?: string };
  names: Record<string, string>;
  has_lesson: boolean;
  state?: TopicState;
  problems: TopicProblem[];
  co_topics?: { id: string; count: number }[];
  resources: Resource[];
  graph: Graph;
}
/** A case-study id that is a problem, not a topic: the studio opens the problem instead. */
export interface TopicRedirect {
  subject: string;
  redirect_problem: string;
}
export interface SubjectsResponse {
  root: string;
  subjects: Subject[];
}

export interface RunRecord {
  ts: string;
  passed: number;
  total: number;
  error: boolean;
  fit: string | null;
  verdict: boolean | null;
}
export interface ProblemCardData extends ProblemContext {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  patterns: string[];
  expected_complexity: { time: string; space: string };
  readme: string;
  readme_path: string;
  attempts: {
    name: string;
    lang: string;
    last_run: RunRecord | null;
    path: string;
    review: string | null;
  }[];
  refs?: Resource[];
}
export interface QuizItem {
  id: string;
  prompt: string;
  options: string[];
}
export type Block =
  | { type: "markdown"; text: string; path: string }
  | { type: "trace"; id: string; trace: Trace }
  | { type: "quiz"; items: QuizItem[] }
  | { type: "problems"; problems: ProblemCardData[] }
  | { type: "resources"; resources: Resource[] }
  | { type: "design-problems"; problems: DesignProblemCard[] };

export interface Lesson {
  subject: string;
  topic: string;
  title: string;
  names: Record<string, string>;
  prereqs?: string[];
  related?: string[];
  blocks: Block[];
}

export interface QuizResult {
  correct: boolean;
  answer: string;
  why: string;
}

export interface ProblemStatus {
  slug: string;
  title: string;
  difficulty: string;
  status: "solved" | "failing" | "untried";
  complexity_miss: boolean;
  legacy_failing: boolean;
  last_practiced: string | null;
}
export interface TopicFeedback {
  id: string;
  name: string;
  kind: string;
  has_lesson: boolean;
  problems: ProblemStatus[];
  counts: Record<"solved" | "failing" | "untried", number>;
  quiz_accuracy: number | null;
  last_practiced: string | null;
  review_due: string | null;
  advice: string[];
}
export interface Feedback {
  subject: string;
  today: string;
  topics: TopicFeedback[];
  unmapped_tags: string[];
}

export interface ProblemRow {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  patterns: string[];
  topics: string[];
  sources: string[];
  attempts: number;
  status: "solved" | "failing" | "untried";
  legacy_failing: boolean;
  complexity_miss: boolean;
}

// ---------------------------------------------------------------- design console (system-design/FORMAT.md)

export type DesignStage =
  "scope" | "estimates" | "api" | "parts" | "high-level" | "deep-dives" | "wrap-up" | "signatures";
export type TipLevel = "nudge" | "hint" | "show";
export interface DesignProblemCard {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  minutes: number | null;
  attempts: string[];
}
export interface DesignCheckItem {
  id: string;
  type: string;
  stage: DesignStage;
  label: string;
}
export interface DesignProblemData extends ProblemContext {
  subject: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  minutes: number | null;
  readme: string;
  readme_path: string;
  palette: string[];
  stages: DesignStage[];
  wrapup_keys: string[];
  units: string[];
  constants: Record<string, number>;
  checks: DesignCheckItem[];
  /** catalog ids (groups "technologies" / "patterns"); empty for OOD */
  technologies: string[];
  patterns: string[];
  /** other names, e.g. ["WhatsApp"] */
  aka: string[];
  has_solution: boolean;
  attempts: { name: string; path: string; submitted: boolean }[];
  status: { status: "solved" | "failing" | "untried" };
}
export interface ScopeItem {
  id: string;
  text: string;
}
export interface DesignOption {
  name: string;
  pros: string;
  cons: string;
}
/**
 * Decompose → reduce: one piece of the problem with its own alternatives, choice and sub-diagram.
 * Sub-diagram node ids are the same ids used in the high-level design; "compose" merges by id and the
 * `part-not-composed` smell flags part nodes missing from the final version.
 */
export interface DesignPart {
  id: string;
  title: string;
  /** requirement ids this part serves, e.g. ["F2", "N1"] */
  covers: string[];
  problem: string;
  options: DesignOption[];
  choice: string;
  why: string;
  technologies: string[];
  patterns: string[];
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
}
export interface DesignDoc {
  version: 1;
  scope: {
    functional: ScopeItem[];
    non_functional: ScopeItem[];
    assumptions: ScopeItem[];
    out_of_scope: ScopeItem[];
  };
  api: {
    id: string;
    method: string;
    path: string;
    request: string;
    response: string;
    notes: string;
  }[];
  data: { id: string; name: string; fields: string; store: string; why: string }[];
  /** optional in v1 files: treat a missing list as [] */
  parts?: DesignPart[];
  deep_dives: {
    id: string;
    title: string;
    options: { name: string; pros: string; cons: string }[];
    choice: string;
    why: string;
    version?: number;
  }[];
  wrapup: Record<string, string>;
}
export interface EstimateRow {
  name: string;
  formula: string;
  unit: string;
}
export interface EstimateResult extends EstimateRow {
  value: number | null;
  error: string | null;
}
export interface DiagramNode {
  id: string;
  kind: string;
  label?: string;
  x?: number;
  y?: number;
}
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}
export interface Diagram {
  version: number;
  why: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  flows?: { name: string; path: string[] }[];
}
export interface Smell {
  rule: string;
  message: string;
  nodes: string[];
  version: number;
}
export interface DesignCheck {
  version: 1;
  subject: string;
  slug: string;
  attempt: string;
  checks: (DesignCheckItem & { passed: boolean; detail: string })[];
  stages: Record<DesignStage, { passed: number; total: number }>;
  passed: number;
  total: number;
  smells: Smell[];
  final_smells: Smell[];
  versions: {
    version: number;
    why: string;
    nodes: number;
    edges: number;
    diff: {
      added_nodes: string[];
      removed_nodes: string[];
      added_edges: string[];
      removed_edges: string[];
    };
    smells: string[];
  }[];
  versions_missing_why: number[];
  estimates: EstimateResult[];
  errors: string[];
  submitted: boolean;
}
export interface DesignAttempt {
  name: string;
  path: string;
  design: DesignDoc;
  estimates: { version: 1; rows: EstimateRow[] };
  diagrams: Diagram[];
  signatures: string;
  check: DesignCheck;
}
/** Worked solution: reference attempt + walkthrough (reference.md; ```diagram v2``` / ```diagram part:P1``` fences). */
export interface DesignReference {
  technologies: string[];
  patterns: string[];
  walkthrough: string;
  pattern: string;
  diagrams: Diagram[];
  design: DesignDoc;
  estimates: EstimateResult[];
  tips: Record<string, string>;
}
export type DesignSaveFile =
  | { file: "design"; content: DesignDoc }
  | { file: "estimates"; content: { version: 1; rows: EstimateRow[] } }
  | { file: "diagram"; content: Diagram; version: number }
  | { file: "signatures"; content: string };

export type SessionStatus = "planned" | "active" | "done" | "abandoned";
export type Focus = "weak" | "new" | "review" | "mixed";
export interface SessionItem {
  id: string;
  kind: string;
  subject: string;
  slug: string;
  title?: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string | null;
  why?: string | null;
  attempts: string[];
  attempt_paths: string[];
  score: number | null;
  state: "todo" | "started" | "attempted" | "solved";
  last_run: RunRecord | null;
}
export interface Session {
  id: string;
  title: string;
  created: string;
  generator: "kb" | "claude";
  scope: {
    subject?: string;
    topics?: string[];
    difficulty?: string[];
    count?: number;
    minutes?: number | null;
  };
  target: { focus: Focus; goal?: string | null };
  rationale: string[];
  status: SessionStatus;
  history: { ts: string; status: SessionStatus }[];
  materials: { subject: string; topic: string; why?: string; name: string; has_lesson: boolean }[];
  items: SessionItem[];
  completion: number;
  score: number | null;
  overall: number;
}
export interface SessionSpec {
  subject: string;
  topics: string[];
  difficulty: string[];
  count: number;
  focus: Focus;
  goal: string;
  title: string;
  minutes: number | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `${path}: ${res.status}`);
  return data;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const api = {
  subjects: () => get<SubjectsResponse>("/api/subjects"),
  lesson: (subject: string, topic: string) => get<Lesson>(`/api/lesson/${subject}/${topic}`),
  problem: (subject: string, slug: string) =>
    get<ProblemCardData>(`/api/problem/${subject}/${slug}`),
  feedback: (subject: string) => get<Feedback>(`/api/feedback/${subject}`),
  problems: (subject: string) => get<ProblemRow[]>(`/api/problems/${subject}`),
  topic: (subject: string, topic: string) =>
    get<TopicPageData | TopicRedirect>(`/api/topic/${subject}/${topic}`),
  graph: (subject: string) => get<Graph>(`/api/graph/${subject}`),
  design: (subject: string, slug: string) =>
    get<DesignProblemData>(`/api/design/${subject}/${slug}`),
  designAttempt: (subject: string, slug: string, attempt: string) =>
    get<DesignAttempt>(`/api/design/${subject}/${slug}/${attempt}`),
  designReference: (subject: string, slug: string, attempt: string) =>
    get<DesignReference>(`/api/design/${subject}/${slug}/${attempt}/reference`),
  /** Read mode: always available; call solutionViewed when the learner chooses to reveal it. */
  designSolution: (subject: string, slug: string) =>
    get<DesignReference>(`/api/design/${subject}/${slug}/solution`),
  solutionViewed: (subject: string, slug: string) =>
    post<{ ok: boolean }>(`/api/design/${subject}/${slug}/solution-viewed`, {}),
  newDesignAttempt: (subject: string, slug: string, label?: string) =>
    post<DesignAttempt>(`/api/design/${subject}/${slug}/attempt`, label ? { label } : {}),
  designTip: (subject: string, slug: string, check: string, level: TipLevel, attempt?: string) =>
    post<{ check: string; level: TipLevel; text: string }>(`/api/design/${subject}/${slug}/tip`, {
      check,
      level,
      attempt,
    }),
  saveDesign: (subject: string, slug: string, attempt: string, body: DesignSaveFile) =>
    post<DesignCheck>(`/api/design/${subject}/${slug}/${attempt}/save`, body),
  deleteDiagram: (subject: string, slug: string, attempt: string, version: number) =>
    post<DesignCheck>(`/api/design/${subject}/${slug}/${attempt}/delete-diagram`, { version }),
  checkDesign: (subject: string, slug: string, attempt: string) =>
    post<DesignCheck>(`/api/design/${subject}/${slug}/${attempt}/check`, {}),
  submitDesign: (subject: string, slug: string, attempt: string) =>
    post<DesignCheck>(`/api/design/${subject}/${slug}/${attempt}/submit`, {}),
  sessions: () => get<Session[]>("/api/sessions"),
  session: (id: string) => get<Session>(`/api/session/${id}`),
  newSession: (spec: SessionSpec) => post<Session>("/api/sessions", spec),
  setStatus: (id: string, status: SessionStatus) =>
    post<Session>(`/api/session/${id}/status`, { status }),
  startAttempt: (id: string, item: string, lang: "python" | "go" | "design") =>
    post<Session>(`/api/session/${id}/attempt`, { item, lang }),
  async answer(subject: string, topic: string, item: string, choice: string): Promise<QuizResult> {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic, item, choice }),
    });
    if (!res.ok) throw new Error(`quiz: ${res.status}`);
    return (await res.json()) as QuizResult;
  },
};

export type { Json };
