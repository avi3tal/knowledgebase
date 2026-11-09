import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DesignProblemData, DesignReference, ProblemRow } from "../api";
import { api } from "../api";
import { STAGE_INFO, stageLabel } from "../design";
import {
  LABEL_RE,
  fencedVersions,
  latestAttempt,
  needsGate,
  neighbours,
  orderProblems,
  revealKey,
  stageSteps,
} from "../reader";
import { stripReadmeHead } from "../practice-bench";
import type { DesignView } from "../route";
import { designHref, designViewHref } from "../route";
import type { TocEntry } from "../toc";
import { extractToc } from "../toc";
import { Chips, OnThisPage, ProblemList } from "./DesignReaderPanes";
import { Markdown } from "./Markdown";
import { RevealGate, SolutionArticle, VERSIONS_ID } from "./SolutionArticle";
import { CENTER_SELECTOR, Workbench } from "./Workbench";
import { Icon } from "./Icon";
import { MetaTags, PageHeader, PrevNextFooter, StatusLabel, usePrevNextKeys } from "./PageHeader";
import { SimilarProblemsCard } from "./PracticeLinks";

// The page remounts on every hash change (App keys it), so keep fetched data across tabs.
const problemsCache = new Map<string, ProblemRow[]>();
const solutionCache = new Map<string, DesignReference>();

function readRevealed(subject: string, slug: string): boolean {
  try {
    return localStorage.getItem(revealKey(subject, slug)) === "1";
  } catch {
    return false;
  }
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** A design problem in Read mode: Problem / Solution / Attempts tabs in the shared workbench. */
export function DesignProblemPage({
  p,
  view,
  names,
}: {
  p: DesignProblemData;
  view: DesignView;
  names: Record<string, string>;
}) {
  const key = `${p.subject}/${p.slug}`;
  const [rows, setRows] = useState<ProblemRow[] | null>(() => problemsCache.get(p.subject) ?? null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [open, setOpen] = useState(() => !needsGate(p.attempts, readRevealed(p.subject, p.slug)));
  const [solution, setSolution] = useState<DesignReference | null>(
    () => solutionCache.get(key) ?? null,
  );
  const [solError, setSolError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const centerRef = useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setScroller(centerRef.current?.closest<HTMLElement>(CENTER_SELECTOR) ?? null);
  }, []);

  useEffect(() => {
    let live = true;
    api.problems(p.subject).then(
      (r) => {
        problemsCache.set(p.subject, r);
        if (live) setRows(r);
      },
      (e: unknown) => live && setRowsError(errText(e)),
    );
    return () => {
      live = false;
    };
  }, [p.subject]);

  useEffect(() => {
    if (view !== "solution" || !open || !p.has_solution || solution) return;
    let live = true;
    api.designSolution(p.subject, p.slug).then(
      (s) => {
        solutionCache.set(key, s);
        if (live) setSolution(s);
      },
      (e: unknown) => live && setSolError(errText(e)),
    );
    return () => {
      live = false;
    };
  }, [view, open, p.has_solution, p.subject, p.slug, key, solution]);

  const ordered = useMemo(() => orderProblems(rows ?? []), [rows]);
  const { prev, next } = neighbours(ordered, p.slug);

  usePrevNextKeys(
    prev ? designViewHref(p.subject, prev.slug, view) : null,
    next ? designViewHref(p.subject, next.slug, view) : null,
  );

  const latest = latestAttempt(p.attempts);
  const start = (withLabel?: string) => {
    setBusy(true);
    setStartError(null);
    api.newDesignAttempt(p.subject, p.slug, withLabel || undefined).then(
      (a) => {
        window.location.hash = designHref(p.subject, p.slug, a.name);
      },
      (e: unknown) => {
        setStartError(errText(e));
        setBusy(false);
      },
    );
  };
  const practise = () => {
    if (latest) window.location.hash = designHref(p.subject, p.slug, latest.name);
    else start();
  };
  const practiseLabel = latest ? "▶ Continue practising" : "▶ Practise first";

  // Log the view first (it removes the first-try bonus), then open; on failure keep the gate.
  const reveal = () => {
    setBusy(true);
    setStartError(null);
    api.solutionViewed(p.subject, p.slug).then(
      () => {
        try {
          localStorage.setItem(revealKey(p.subject, p.slug), "1");
        } catch {
          // private mode: asked again next time
        }
        setBusy(false);
        setOpen(true);
      },
      (e: unknown) => {
        setStartError(`Could not record the reveal: ${errText(e)}`);
        setBusy(false);
      },
    );
  };

  const readme = useMemo(() => stripReadmeHead(p.readme), [p.readme]);
  const toc = useMemo<TocEntry[]>(() => {
    if (view === "problem") return extractToc(readme);
    if (view === "solution" && solution) {
      const t = extractToc(solution.walkthrough);
      const gallery =
        solution.diagrams.length > 0 && fencedVersions(solution.walkthrough).size === 0;
      return gallery ? [...t, { level: 2, text: "Design versions", id: VERSIONS_ID }] : t;
    }
    return [];
  }, [view, readme, solution]);

  const submitted = p.attempts.filter((a) => a.submitted).length;
  const technologies = p.technologies.length ? p.technologies : (solution?.technologies ?? []);
  const patterns = p.patterns.length ? p.patterns : (solution?.patterns ?? []);
  const badLabel = label !== "" && !LABEL_RE.test(label);

  const header = (
    <PageHeader
      title={p.title}
      meta={[
        <span className={`pill ${p.difficulty}`}>{p.difficulty}</span>,
        <StatusLabel status={p.status.status} />,
        p.minutes ? (
          <span>
            <Icon name="clock" size={13} /> ~{p.minutes} min
          </span>
        ) : null,
        p.aka.length > 0 && <span>also {p.aka.join(", ")}</span>,
        p.topics.length > 0 && (
          <MetaTags
            tags={p.topics.map((id) => ({
              key: names[id] ?? id,
              label: names[id] ?? id,
              href: `#/topic/${p.subject}/${id}`,
            }))}
          />
        ),
      ]}
      actions={
        <button className="btn primary" onClick={practise} disabled={busy}>
          <Icon name="play" size={13} /> {latest ? "Continue practising" : "Practise"}
        </button>
      }
    />
  );

  const tab = (v: DesignView, text: string, badge?: number, done?: boolean) => (
    <a
      key={v}
      className={`wb-tab rd-tab-${v} ${view === v ? "on" : ""} ${done ? "done" : ""}`}
      href={designViewHref(p.subject, p.slug, v)}
      aria-current={view === v ? "page" : undefined}
    >
      {text}
      {badge !== undefined && <span className="wb-tab-badge">{badge}</span>}
    </a>
  );
  const tabs = (
    <>
      {tab("problem", "Description")}
      {tab("solution", "Solution")}
      {tab("attempts", "Attempts", p.attempts.length, submitted > 0)}
    </>
  );

  const practiceCard = (
    <section className="rd-card rd-practice">
      <h4>Practice</h4>
      <div className="rd-practice-stats">
        <span>
          <b>{p.attempts.length}</b> attempt{p.attempts.length === 1 ? "" : "s"}
        </span>
        <span>
          <b>{submitted}</b> submitted
        </span>
        <span>
          <b>{p.checks.length}</b> checks
        </span>
      </div>
      <a className="small" href={designViewHref(p.subject, p.slug, "attempts")}>
        ＋ new attempt with a label
      </a>
    </section>
  );

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      {practiceCard}
      {technologies.length > 0 && (
        <section className="rd-card">
          <h4>Technologies</h4>
          <Chips ids={technologies} subject={p.subject} names={names} kind="tech" />
        </section>
      )}
      {patterns.length > 0 && (
        <section className="rd-card">
          <h4>Patterns</h4>
          <Chips ids={patterns} subject={p.subject} names={names} kind="pattern" />
        </section>
      )}
      <SimilarProblemsCard subject={p.subject} items={p.similar} names={names} />
    </OnThisPage>
  );

  const footer = (
    <PrevNextFooter
      prev={prev ? { title: prev.title, href: designViewHref(p.subject, prev.slug, view) } : null}
      next={next ? { title: next.title, href: designViewHref(p.subject, next.slug, view) } : null}
      noun="problem"
    />
  );

  let center;
  if (view === "problem") {
    center = (
      <>
        <section className="rd-stages" aria-label="How you'll practise">
          <h3>How you'll practise</h3>
          <ol>
            {stageSteps(p.stages, p.checks).map((s, i) => (
              <li
                key={s.stage}
                className={`rd-step ${s.core ? "core" : ""}`}
                style={{ ["--i" as string]: i }}
              >
                <span className="rd-step-icon">{STAGE_INFO[s.stage].icon}</span>
                <span className="rd-step-label">{stageLabel(s.stage, p.stages)}</span>
                <span className="rd-step-n">
                  {s.checks ? `${s.checks} check${s.checks === 1 ? "" : "s"}` : "—"}
                </span>
              </li>
            ))}
          </ol>
          {p.stages.includes("parts") && (
            <p className="muted small">
              The core is <b>Decompose → Reduce</b>: split the problem into parts, solve each with
              its own options and sub-diagram, then merge them into one high-level design.
            </p>
          )}
        </section>
        <article className="rd-article">
          <Markdown text={readme} path={p.readme_path} anchors />
        </article>
      </>
    );
  } else if (view === "solution") {
    center = !p.has_solution ? (
      <section className="rd-gate">
        <div className="rd-gate-icon">🚧</div>
        <h2>No worked solution yet</h2>
        <p>This problem has no reference solution. Practise it and compare with the rubric.</p>
        <div className="rd-gate-actions">
          <button className="rd-btn primary" onClick={practise} disabled={busy}>
            {practiseLabel}
          </button>
        </div>
      </section>
    ) : !open ? (
      <RevealGate
        onReveal={reveal}
        onPractise={practise}
        busy={busy}
        practiseLabel={practiseLabel}
      />
    ) : solError ? (
      <div className="inline-error">⚠ Could not load the solution: {solError}</div>
    ) : !solution ? (
      <div className="loader" aria-label="loading" />
    ) : (
      <SolutionArticle
        solution={solution}
        subject={p.subject}
        names={names}
        path={`${p.subject}/problems/${p.slug}/reference.md`}
      />
    );
  } else {
    center = (
      <div className="rd-attempts">
        <section className="rd-card rd-new-attempt">
          <h3>Start a new attempt</h3>
          <div className="new-attempt">
            <input
              value={label}
              placeholder="label (optional, kebab-case)"
              aria-label="attempt label"
              onChange={(e) => setLabel(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && !badLabel && !busy && start(label)}
            />
            <button className="primary" disabled={busy || badLabel} onClick={() => start(label)}>
              ＋ Start
            </button>
          </div>
          {badLabel && (
            <div className="inline-error">Use lowercase letters, digits and dashes.</div>
          )}
        </section>
        <h3>Your attempts</h3>
        {p.attempts.length === 0 && (
          <p className="muted">None yet. Start one above, or press ▶ Practice.</p>
        )}
        <ul className="rd-attempt-list">
          {[...p.attempts].reverse().map((a, i) => (
            <li key={a.name} style={{ ["--i" as string]: i }} className={a.submitted ? "done" : ""}>
              <span className="rd-attempt-dot" />
              <a className="rd-attempt-name" href={designHref(p.subject, p.slug, a.name)}>
                {a.name}
              </a>
              {a.submitted ? (
                <span className="rd-tag ok">✓ submitted</span>
              ) : (
                <span className="rd-tag">in progress</span>
              )}
              <a className="rd-vscode" href={`vscode://file${a.path}`} title="Open in VS Code">
                ⧉ VS Code
              </a>
              <a className="rd-open" href={designHref(p.subject, p.slug, a.name)}>
                Open →
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Workbench
      id="reader"
      leftCollapsed
      header={header}
      tabs={tabs}
      left={{
        title: "Problems",
        icon: "🗂️",
        content: (
          <ProblemList
            subject={p.subject}
            slug={p.slug}
            view={view}
            rows={rows}
            error={rowsError}
          />
        ),
      }}
      right={{ title: "On this page", icon: "🧭", content: right }}
      footer={footer}
    >
      <div className={`rd-center rd-view-${view}`} ref={centerRef}>
        {startError && <div className="inline-error">⚠ {startError}</div>}
        {center}
      </div>
    </Workbench>
  );
}
