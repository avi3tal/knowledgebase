import type { Json, Trace } from "./trace";

export interface Topic {
  id: string;
  name: string;
  kind: "pattern" | "fundamental";
  order?: number;
  usage: string;
  ds: string[];
  samples: string[];
  has_lesson: boolean;
}
export interface Subject {
  id: string;
  title: string;
  topics: Topic[];
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
export interface ProblemCardData {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  patterns: string[];
  expected_complexity: { time: string; space: string };
  readme: string;
  readme_path: string;
  attempts: { name: string; lang: string; last_run: RunRecord | null }[];
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
  | { type: "problems"; problems: ProblemCardData[] };

export interface Lesson {
  subject: string;
  topic: string;
  title: string;
  names: Record<string, string>;
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
  kind: "pattern" | "fundamental";
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
