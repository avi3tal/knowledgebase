import { useEffect, useMemo, useRef, useState } from "react";
import type { ProblemRow, Subject } from "../api";
import { api } from "../api";
import { SUBJECT_SHORT } from "../catalog";
import * as S from "./SearchPalette.style";
import { buildIndex, search } from "../search";

/** ⌘K / Ctrl+K palette: jump to any topic or problem in any subject. */
export function SearchPalette({ subjects, onClose }: { subjects: Subject[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [problems, setProblems] = useState<Record<string, ProblemRow[]>>({});
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    // Every subject: locked ones (e.g. system-design before its lessons) can still have problems.
    for (const s of subjects) {
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
    <S.Backdrop onClick={onClose}>
      <S.Palette onClick={(e) => e.stopPropagation()}>
        <S.Input
          ref={input}
          placeholder="Search topics and problems across all subjects…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKey}
        />
        <S.Results>
          {results.map((r, i) => (
            <S.Result
              key={`${r.subject}:${r.kind}:${r.id}`}
              $on={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => go(r.href)}
            >
              <S.ResultIcon>{r.icon}</S.ResultIcon>
              <S.ResultTitle>{r.title}</S.ResultTitle>
              <S.Detail>{r.detail}</S.Detail>
              <S.Subject $locked={!!r.locked}>
                {r.kind} · {SUBJECT_SHORT[r.subject] ?? r.subject}
              </S.Subject>
            </S.Result>
          ))}
          {query && results.length === 0 && <S.Hint>No matches</S.Hint>}
          {!query && (
            <S.Hint>
              Try “window”, “cache”, “two sum”, “heap”… ↑↓ to move, ⏎ to open, esc to close
            </S.Hint>
          )}
        </S.Results>
      </S.Palette>
    </S.Backdrop>
  );
}
