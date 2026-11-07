import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ProblemCardData, ProblemRow } from "../api";
import { api } from "../api";
import { SUBJECT_SHORT, topicIcon } from "../catalog";
import { RootContext, SubjectContext } from "../context";
import type { ProblemTab } from "../practice-bench";
import {
  keepTab,
  problemTabHref,
  problemTabOf,
  readmeSources,
  runState,
  splitReadme,
} from "../practice-bench";
import { STATUS_ICON, groupProblems, navKey, neighbours, orderProblems } from "../reader";
import { parseRoute } from "../route";
import { runCommand } from "../sessions";
import { extractToc } from "../toc";
import { OnThisPage } from "./DesignReaderPanes";
import { Markdown } from "./Markdown";
import type { NavGroup } from "./panes";
import { NavList, useCenterScroller } from "./panes";
import { Copy } from "./PracticeBench";
import { ResourceList } from "./Resources";
import { Workbench } from "./Workbench";

/**
 * An algo problem. `open` (the problem page, `#/problem/<subject>/<slug>[/<tab>]`) renders the full
 * Workbench page; otherwise a compact card (lesson pages list these).
 */
export function ProblemCard({
  p,
  pattern,
  open = false,
}: {
  p: ProblemCardData;
  pattern?: string;
  open?: boolean;
}) {
  return open ? <ProblemPage p={p} /> : <ProblemCardCompact p={p} pattern={pattern} />;
}

function ProblemCardCompact({ p, pattern }: { p: ProblemCardData; pattern?: string }) {
  const [open, setOpen] = useState(false);
  const practice = p.attempts.filter((a) => !a.name.includes("_legacy"));
  const root = useContext(RootContext);
  const dir = `${root}/${p.readme_path.replace(/\/README\.md$/, "")}`;
  return (
    <div className="card">
      <div className="card-head" onClick={() => setOpen((o) => !o)}>
        <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
        <b>{p.title}</b>
        <span className="muted">
          {p.expected_complexity.time} · {p.patterns.join(", ")}
        </span>
        <span className="grow" />
        <span className="muted">{open ? "▾" : "▸"}</span>
      </div>
      <div className="attempts">
        {p.attempts.length === 0 && <span className="muted">no attempts yet</span>}
        {p.attempts.map((a) => {
          const r = a.last_run;
          const state = runState(r);
          return (
            <a
              key={a.name}
              className={`attempt ${state === "none" ? "" : state}`}
              href={`vscode://file${a.path}`}
              title={`open in VS Code${r ? ` · last run ${r.ts}${r.fit ? " · ≈" + r.fit : ""}` : " · not run"}`}
            >
              {a.name} {r ? `${r.passed}/${r.total}` : ""}
            </a>
          );
        })}
      </div>
      <div className="cmds">
        <Copy text={`./kb attempt ${p.slug} --lang go${pattern ? ` --pattern ${pattern}` : ""}`} />
        <Copy
          text={`./kb attempt ${p.slug} --lang python${pattern ? ` --pattern ${pattern}` : ""}`}
        />
        <Copy text={`./kb run ${p.slug}`} />
        <a className="open-editor" href={`vscode://file${dir}`}>
          ⧉ open in VS Code
        </a>
        {practice.length > 0 && (
          <span className="muted">{practice.length} practice attempt(s)</span>
        )}
      </div>
      {open &&
        p.attempts
          .filter((a) => a.review)
          .map((a) => (
            <details key={`review-${a.name}`} className="review">
              <summary>📝 Tutor review of {a.name}</summary>
              <Markdown text={a.review ?? ""} path={p.readme_path} />
            </details>
          ))}
      {open && <Markdown text={p.readme} path={p.readme_path} />}
      {open && p.refs && <ResourceList items={p.refs} title="Explanations elsewhere" />}
    </div>
  );
}

// ---------------------------------------------------------------- the problem page

// The page remounts on every hash change (App keys it): keep the problem list across problems.
const rowsCache = new Map<string, ProblemRow[]>();

function isTyping(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

const TAB_INFO: Record<ProblemTab, { icon: string; label: string }> = {
  problem: { icon: "📄", label: "Problem" },
  learn: { icon: "💡", label: "Hints & learning" },
  attempts: { icon: "🗂️", label: "Attempts" },
  resources: { icon: "📚", label: "Resources" },
};

function ProblemPage({ p }: { p: ProblemCardData }) {
  const root = useContext(RootContext);
  const { subject: subj } = useContext(SubjectContext);
  const subject = parseRoute(window.location.hash).subject;
  const [rows, setRows] = useState<ProblemRow[] | null>(() => rowsCache.get(subject) ?? null);
  const centerRef = useRef<HTMLDivElement>(null);
  const scroller = useCenterScroller(centerRef);

  useEffect(() => {
    let live = true;
    api.problems(subject).then(
      (r) => {
        rowsCache.set(subject, r);
        if (live) setRows(r);
      },
      () => live && setRows((x) => x ?? []),
    );
    return () => {
      live = false;
    };
  }, [subject]);

  const parts = useMemo(() => splitReadme(p.readme), [p.readme]);
  const sources = useMemo(() => readmeSources(p.readme), [p.readme]);
  const available = useMemo<ProblemTab[]>(
    () => [
      "problem",
      ...(parts.learn ? (["learn"] as const) : []),
      "attempts",
      ...(p.refs?.length ? (["resources"] as const) : []),
    ],
    [parts.learn, p.refs],
  );
  const tab = keepTab(problemTabOf(window.location.hash), available);
  const md = tab === "problem" ? parts.problem : tab === "learn" ? parts.learn : "";
  const toc = useMemo(() => extractToc(md), [md]);

  const row = rows?.find((r) => r.slug === p.slug);
  const status = row?.status ?? (p.attempts.length ? "failing" : "untried");
  const ordered = useMemo(() => orderProblems(rows ?? []), [rows]);
  const { prev, next } = neighbours(ordered, p.slug);
  // The tab carries over; a neighbour without it opens on Problem (it re-checks on load).
  const hrefFor = (slug: string) => problemTabHref(subject, slug, tab);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const dir = navKey(e);
      const target = dir === "prev" ? prev : dir === "next" ? next : null;
      if (!target) return;
      e.preventDefault();
      window.location.hash = problemTabHref(subject, target.slug, tab);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, subject, tab]);

  const nav = useMemo<NavGroup[]>(
    () =>
      groupProblems(rows ?? [], "").map((g) => ({
        key: g.difficulty,
        label: g.difficulty,
        color: `var(--rd-${g.difficulty})`,
        items: g.rows.map((r) => ({
          id: r.slug,
          title: r.title,
          href: problemTabHref(subject, r.slug, tab),
          icon: STATUS_ICON[r.status],
          badge: r.attempts || "",
          current: r.slug === p.slug,
          hint: r.topics.join(" "),
        })),
      })),
    [rows, subject, tab, p.slug],
  );

  const topics = useMemo(() => {
    const byId = new Map((subj?.topics ?? []).map((t) => [t.id, t]));
    return (row?.topics ?? []).map((id) => ({ id, topic: byId.get(id) }));
  }, [row, subj]);

  const dir = `${root}/${p.readme_path.replace(/\/README\.md$/, "")}`;
  const latest = p.attempts[p.attempts.length - 1];
  const startCmd = `./kb attempt ${p.slug} --lang go`;
  const passing = p.attempts.filter((a) => runState(a.last_run) === "ok").length;
  const reviews = p.attempts.filter((a) => a.review).length;

  const header = (
    <div className="rd-header pb-head">
      <div className={`rd-icon pb-icon-${status}`}>{STATUS_ICON[status]}</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
          <span className={`rd-state ${status}`}>{status}</span>
          <span className="muted small" title="expected complexity">
            ⏱ {p.expected_complexity.time} · 💾 {p.expected_complexity.space}
          </span>
          {sources.map((s) =>
            s.url ? (
              <a key={s.name} className="pb-source" href={s.url} target="_blank" rel="noreferrer">
                ↗ {s.name}
              </a>
            ) : (
              <span key={s.name} className="pb-source plain">
                {s.name}
              </span>
            ),
          )}
        </div>
        <h1>{p.title}</h1>
        {p.patterns.length > 0 && (
          <div className="chips">
            {p.patterns.map((x) => (
              <span key={x} className="rd-chip pattern">
                {x}
              </span>
            ))}
          </div>
        )}
      </div>
      {latest ? (
        <a className="rd-btn primary big" href={`vscode://file${latest.path}`}>
          ⧉ Continue in VS Code
          <span className="rd-btn-sub">{latest.name}</span>
        </a>
      ) : (
        <button
          className="rd-btn primary big"
          onClick={() => void navigator.clipboard.writeText(startCmd)}
          title={`copies: ${startCmd}`}
        >
          ▶ Start an attempt
          <span className="rd-btn-sub">copies {startCmd}</span>
        </button>
      )}
    </div>
  );

  const tabs = available.map((t) => {
    const badge =
      t === "attempts" ? p.attempts.length : t === "resources" ? p.refs?.length : undefined;
    return (
      <a
        key={t}
        className={`wb-tab pb-tab-${t} ${tab === t ? "on" : ""} ${t === "attempts" && passing ? "done" : ""}`}
        href={problemTabHref(subject, p.slug, t)}
        aria-current={tab === t ? "page" : undefined}
      >
        {TAB_INFO[t].icon} {TAB_INFO[t].label}
        {badge !== undefined && <span className="wb-tab-badge">{badge}</span>}
      </a>
    );
  });

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      <section className="rd-card rd-practice pb-practice">
        <h4>Practice</h4>
        <div className="rd-practice-stats">
          <span>
            <b>{p.attempts.length}</b> attempt{p.attempts.length === 1 ? "" : "s"}
          </span>
          <span>
            <b>{passing}</b> passing
          </span>
          <span>
            <b>{reviews}</b> review{reviews === 1 ? "" : "s"}
          </span>
        </div>
        <div className="pb-cmds">
          <Copy text={`./kb attempt ${p.slug} --lang go`} />
          <Copy text={`./kb attempt ${p.slug} --lang python`} />
          <Copy text={`./kb run ${p.slug}`} />
        </div>
        <a className="small" href={`vscode://file${dir}`}>
          ⧉ open the problem folder in VS Code
        </a>
      </section>
      {topics.length > 0 && (
        <section className="rd-card">
          <h4>Learn the patterns</h4>
          <div className="chips">
            {topics.map(({ id, topic }) => (
              <a
                key={id}
                className={`rd-chip ${topic?.has_lesson ? "" : "plain"}`}
                href={topic?.has_lesson ? `#/learn/${subject}/${id}` : `#/topic/${subject}/${id}`}
                title={topic?.has_lesson ? "open the lesson" : "topic page (no lesson yet)"}
              >
                {topic ? `${topicIcon(topic)} ${topic.name}` : id}
              </a>
            ))}
          </div>
        </section>
      )}
    </OnThisPage>
  );

  const footer = (
    <div className="rd-footer">
      {prev ? (
        <a className="rd-nav prev" href={hrefFor(prev.slug)}>
          ← <span>{prev.title}</span>
        </a>
      ) : (
        <span className="rd-nav prev muted">← first problem</span>
      )}
      <span className="rd-foot-mid">
        <b>{SUBJECT_SHORT[subject] ?? subject}</b>
        {ordered.length > 0 && (
          <span className="muted">
            {" "}
            · {ordered.findIndex((r) => r.slug === p.slug) + 1} / {ordered.length}
          </span>
        )}
        <span className="rd-keys muted">
          <kbd>[</kbd> <kbd>]</kbd> prev / next
        </span>
      </span>
      {next ? (
        <a className="rd-nav next" href={hrefFor(next.slug)}>
          <span>{next.title}</span> →
        </a>
      ) : (
        <span className="rd-nav next muted">last problem →</span>
      )}
    </div>
  );

  let center;
  if (tab === "problem" || tab === "learn") {
    center = (
      <article className="rd-article">
        {tab === "learn" && (
          <p className="pb-note">
            💡 Try the hints one at a time; the approach is a spoiler. Stuck for real? Practise the
            pattern's lesson first.
          </p>
        )}
        <Markdown text={md} path={p.readme_path} anchors />
      </article>
    );
  } else if (tab === "attempts") {
    center = (
      <div className="rd-attempts pb-attempts">
        <section className="rd-card rd-new-attempt">
          <h3>Start a new attempt</h3>
          <p className="muted small">
            Attempts live in your private workspace. Create one from the repo root, solve it in your
            editor, then run it; this page picks the result up.
          </p>
          <div className="pb-cmds">
            <Copy text={`./kb attempt ${p.slug} --lang go`} />
            <Copy text={`./kb attempt ${p.slug} --lang python`} />
          </div>
        </section>
        <h3>Your attempts</h3>
        {p.attempts.length === 0 && <p className="muted">None yet. Start one above.</p>}
        <ul className="rd-attempt-list pb-attempt-list">
          {[...p.attempts].reverse().map((a, i) => {
            const r = a.last_run;
            const state = runState(r);
            return (
              <li
                key={a.name}
                style={{ ["--i" as string]: i }}
                className={state === "ok" ? "done" : state}
              >
                <div className="pb-attempt-row">
                  <span className="rd-attempt-dot" />
                  <a
                    className="rd-attempt-name"
                    href={`vscode://file${a.path}`}
                    title="Open in VS Code"
                  >
                    {a.name}
                  </a>
                  <span className="rd-tag">{a.lang}</span>
                  {r ? (
                    <span
                      className={`rd-tag ${state === "ok" ? "ok" : "bad"}`}
                      title={`last run ${r.ts}`}
                    >
                      {state === "ok" ? "✓" : "✗"} {r.passed}/{r.total}
                      {r.fit ? ` · ≈${r.fit}` : ""}
                    </span>
                  ) : (
                    <span className="rd-tag">not run</span>
                  )}
                  <Copy text={runCommand(a.path, root)} label="▶ run" />
                  <a className="rd-vscode" href={`vscode://file${a.path}`} title="Open in VS Code">
                    ⧉ VS Code
                  </a>
                </div>
                {a.review && (
                  <details className="review pb-review" open={i === 0}>
                    <summary>📝 Tutor review</summary>
                    <Markdown text={a.review} path={p.readme_path} />
                  </details>
                )}
              </li>
            );
          })}
        </ul>
        <p className="muted small">
          Want feedback on an attempt? In Claude Code: <code>/review</code>; it lands here.
        </p>
      </div>
    );
  } else {
    center = <ResourceList items={p.refs ?? []} title="Explanations elsewhere" />;
  }

  return (
    <Workbench
      id="problem"
      header={header}
      tabs={tabs}
      left={{
        title: "Problems",
        icon: "🗂️",
        content: rows ? (
          <NavList groups={nav} placeholder="Filter problems…" />
        ) : (
          <div className="loader small-loader" aria-label="loading" />
        ),
      }}
      right={{ title: "On this page", icon: "🧭", content: right }}
      footer={footer}
    >
      <div className={`rd-center pb-center pb-view-${tab}`} ref={centerRef}>
        {center}
      </div>
    </Workbench>
  );
}
