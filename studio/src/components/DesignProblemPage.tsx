import { useState } from "react";
import type { DesignProblemData } from "../api";
import { api } from "../api";
import { STAGE_INFO } from "../design";
import { designHref } from "../route";
import { Markdown } from "./Markdown";

const LABEL_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A design problem: prompt, stages, attempts, and "start a new attempt". */
export function DesignProblemPage({
  p,
  names,
}: {
  p: DesignProblemData;
  names: Record<string, string>;
}) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badLabel = label !== "" && !LABEL_RE.test(label);

  const start = () => {
    setBusy(true);
    setError(null);
    api.newDesignAttempt(p.subject, p.slug, label || undefined).then(
      (a) => {
        window.location.hash = designHref(p.subject, p.slug, a.name);
      },
      (e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      },
    );
  };

  const latest = p.attempts[p.attempts.length - 1];
  return (
    <div className="design-page">
      <section className="hero design-hero">
        <div className="hero-icon">{p.subject === "ood" ? "🧩" : "🏗️"}</div>
        <div className="grow">
          <div className="hero-kicker">
            <span className={`status-badge ${p.status.status}`}>{p.status.status}</span>
            {p.subject === "ood" ? "Object-oriented design" : "System design"} · design console
          </div>
          <h1>{p.title}</h1>
          <div className="stats">
            <span className="stat">{p.difficulty}</span>
            {p.minutes ? <span className="stat">⏱ ~{p.minutes} min</span> : null}
            <span className="stat">
              <b>{p.checks.length}</b> rubric checks
            </span>
            <span className="stat">
              <b>{p.attempts.length}</b> attempt{p.attempts.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="hero-actions">
          {latest && (
            <a className="hero-btn" href={designHref(p.subject, p.slug, latest.name)}>
              ▶ Continue latest
            </a>
          )}
        </div>
      </section>

      <div className="design-page-grid">
        <article>
          <Markdown text={p.readme} path={p.readme_path} />
        </article>
        <aside className="design-side">
          <section className="side-card">
            <h3>Start a new attempt</h3>
            <div className="new-attempt">
              <input
                value={label}
                placeholder="label (optional, kebab-case)"
                onChange={(e) => setLabel(e.target.value.toLowerCase())}
                onKeyDown={(e) => e.key === "Enter" && !badLabel && !busy && start()}
              />
              <button className="primary" disabled={busy || badLabel} onClick={start}>
                ＋ Start
              </button>
            </div>
            {badLabel && (
              <div className="inline-error">Use lowercase letters, digits and dashes.</div>
            )}
            {error && <div className="inline-error">⚠ {error}</div>}
          </section>

          <section className="side-card">
            <h3>Your attempts</h3>
            {p.attempts.length === 0 && <p className="muted small">None yet.</p>}
            <ul className="attempt-list">
              {[...p.attempts].reverse().map((a) => (
                <li key={a.name}>
                  <a href={designHref(p.subject, p.slug, a.name)}>{a.name}</a>
                  {a.submitted ? (
                    <span className="tag ok-tag">✓ submitted</span>
                  ) : (
                    <span className="tag">in progress</span>
                  )}
                  <a
                    className="muted small"
                    href={`vscode://file${a.path}`}
                    title="open in VS Code"
                  >
                    ⧉
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="side-card">
            <h3>Stages</h3>
            <ol className="stage-list">
              {p.stages.map((s) => (
                <li key={s}>
                  {STAGE_INFO[s].icon} {STAGE_INFO[s].label}{" "}
                  <span className="muted small">
                    {p.checks.filter((c) => c.stage === s).length || "–"} checks
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {p.topics.length > 0 && (
            <section className="side-card">
              <h3>Topics</h3>
              <div className="chips">
                {p.topics.map((t) => (
                  <a key={t} className="chip-link" href={`#/topic/${p.subject}/${t}`}>
                    {names[t] ?? t}
                  </a>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
