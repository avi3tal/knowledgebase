import { useMemo, useState } from "react";
import type { ProblemRow } from "../api";
import { problemHref } from "../route";

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 } as const;
const STATUS_LABEL = { solved: "✓ solved", failing: "✗ failing", untried: "· untried" } as const;

export interface ProblemFilters {
  topic: string;
  difficulty: string;
  status: string;
  query: string;
}

/** Pure filter + sort used by the page (tested in problems.test.ts). */
export function filterProblems(rows: ProblemRow[], f: ProblemFilters): ProblemRow[] {
  const q = f.query.trim().toLowerCase();
  return rows
    .filter((r) => !f.topic || r.topics.includes(f.topic))
    .filter((r) => !f.difficulty || r.difficulty === f.difficulty)
    .filter((r) => !f.status || r.status === f.status)
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.slug.includes(q))
    .sort(
      (a, b) =>
        DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] || a.title.localeCompare(b.title),
    );
}

export function ProblemsPage(props: {
  subject: string;
  rows: ProblemRow[];
  names: Record<string, string>;
}) {
  const { subject, rows, names } = props;
  const [f, setF] = useState<ProblemFilters>({ topic: "", difficulty: "", status: "", query: "" });
  const shown = useMemo(() => filterProblems(rows, f), [rows, f]);
  const topics = useMemo(() => [...new Set(rows.flatMap((r) => r.topics))].sort(), [rows]);
  const set = (k: keyof ProblemFilters) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <h1>All problems</h1>
      <p className="muted">
        Mirrors <code>{subject}/problems/</code> — one folder per problem, attempts inside. Status
        comes from your runs (<code>progress/runs.jsonl</code>).
      </p>
      <div className="filters">
        <input placeholder="search…" value={f.query} onChange={set("query")} />
        <select value={f.topic} onChange={set("topic")} aria-label="pattern">
          <option value="">all patterns</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {names[t] ?? t}
            </option>
          ))}
        </select>
        <select value={f.difficulty} onChange={set("difficulty")} aria-label="difficulty">
          <option value="">any difficulty</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <select value={f.status} onChange={set("status")} aria-label="status">
          <option value="">any status</option>
          <option value="untried">untried</option>
          <option value="failing">failing</option>
          <option value="solved">solved</option>
        </select>
        <span className="muted">
          {shown.length} / {rows.length}
        </span>
      </div>
      <table className="problems-table">
        <thead>
          <tr>
            <th>Problem</th>
            <th>Difficulty</th>
            <th>Patterns</th>
            <th>Status</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.slug}>
              <td>
                <a href={problemHref(subject, r.slug)}>{r.title}</a>
                {r.legacy_failing && (
                  <span className="tag warn" title="an old solution of yours has a known bug">
                    legacy bug
                  </span>
                )}
                {r.complexity_miss && <span className="tag warn">complexity ✗</span>}
              </td>
              <td>
                <span className={`badge ${r.difficulty}`}>{r.difficulty}</span>
              </td>
              <td className="muted small">
                {r.topics.map((t) => (
                  <a key={t} href={`#/learn/${subject}/${t}`} className="topic-link">
                    {names[t] ?? t}
                  </a>
                ))}
              </td>
              <td className={`status ${r.status}`}>{STATUS_LABEL[r.status]}</td>
              <td className="muted">{r.attempts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
