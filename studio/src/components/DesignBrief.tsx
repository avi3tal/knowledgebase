import { useMemo } from "react";
import type { DesignDoc, DesignProblemData } from "../api";
import { extractBrief } from "../design";
import { Markdown } from "./Markdown";

/**
 * Left pane on the form stages: what the interviewer says when asked (from the README), plus the
 * requirements written so far, so API, parts and deep dives can cite F/N ids without switching tabs.
 */
export function DesignBrief({
  problem,
  scope,
  onScope,
}: {
  problem: DesignProblemData;
  scope: DesignDoc["scope"];
  onScope: () => void;
}) {
  const brief = useMemo(() => extractBrief(problem.readme), [problem.readme]);
  const lists = [
    { title: "Functional", cls: "f", items: scope.functional ?? [] },
    { title: "Non-functional", cls: "n", items: scope.non_functional ?? [] },
  ];
  const empty = lists.every((l) => l.items.every((x) => !x.text.trim()));
  return (
    <div className="brief">
      <section className="brief-card">
        <h4>🗣️ The interviewer says</h4>
        {brief ? (
          <Markdown text={brief} path={problem.readme_path} />
        ) : (
          <p className="muted small">This problem’s README has no interviewer notes.</p>
        )}
      </section>
      <section className="brief-card">
        <h4>🎯 Your requirements</h4>
        {empty && (
          <p className="muted small">
            None yet.{" "}
            <button className="link-btn" onClick={onScope}>
              Write them in Scope →
            </button>
          </p>
        )}
        {lists.map((l) =>
          l.items.some((x) => x.text.trim()) ? (
            <div key={l.cls} className="brief-reqs">
              <div className="muted small">{l.title}</div>
              <ul>
                {l.items
                  .filter((x) => x.text.trim())
                  .map((x) => (
                    <li key={x.id}>
                      <span className={`id-chip req-${l.cls}`}>{x.id}</span> {x.text}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null,
        )}
      </section>
    </div>
  );
}
