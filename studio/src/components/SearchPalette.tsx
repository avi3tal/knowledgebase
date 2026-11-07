import { useEffect, useMemo, useRef, useState } from "react";
import type { ProblemRow, Subject } from "../api";
import { api } from "../api";
import { SUBJECT_SHORT } from "../catalog";
import { buildIndex, search } from "../search";

/** ⌘K / Ctrl+K palette: jump to any topic or problem in any subject. */
export function SearchPalette({ subjects, onClose }: { subjects: Subject[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [problems, setProblems] = useState<Record<string, ProblemRow[]>>({});
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    for (const s of subjects.filter((x) => x.status !== "locked")) {
      api.problems(s.id).then(
        (rows) => setProblems((p) => ({ ...p, [s.id]: rows })),
        () => undefined,
      );
    }
  }, [subjects]);

  const index = useMemo(() => buildIndex(subjects, problems), [subjects, problems]);
  const results = useMemo(() => search(index, query), [index, query]);

  const go = (href: string) => {
    window.location.hash = href;
    onClose();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
    else if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
    else if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
    else return;
    e.preventDefault();
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          placeholder="Search topics and problems across all subjects…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKey}
        />
        <ul>
          {results.map((r, i) => (
            <li
              key={`${r.subject}:${r.kind}:${r.id}`}
              className={i === cursor ? "on" : ""}
              onMouseEnter={() => setCursor(i)}
              onClick={() => go(r.href)}
            >
              <span className="p-icon">{r.icon}</span>
              <span className="p-title">{r.title}</span>
              <span className="p-detail">{r.detail}</span>
              <span className={`p-subject ${r.locked ? "locked" : ""}`}>
                {r.kind} · {SUBJECT_SHORT[r.subject] ?? r.subject}
              </span>
            </li>
          ))}
          {query && results.length === 0 && <li className="muted">No matches</li>}
          {!query && (
            <li className="muted">
              Try “window”, “cache”, “two sum”, “heap”… ↑↓ to move, ⏎ to open, esc to close
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
