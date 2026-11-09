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
import { Button, Card, InlineError, Loader, MutedP, Pill } from "../theme/primitives";
import { t } from "../theme/theme";
import { Chips, OnThisPage, ProblemList } from "./DesignReaderPanes";
import * as R from "./DesignReaderPanes.style";
import * as S from "./DesignProblemPage.style";
import * as G from "./SolutionArticle.style";
import { ActionButton, PracticeStats } from "./PracticeBench.style";
import { Markdown } from "./Markdown";
import { RevealGate, SolutionArticle, VERSIONS_ID } from "./SolutionArticle";
import { CENTER_SELECTOR, Workbench, WorkbenchTab } from "./Workbench";
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
        <Pill $difficulty={p.difficulty}>{p.difficulty}</Pill>,
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
        <Button $variant="primary" onClick={practise} disabled={busy}>
          <Icon name="play" size={13} /> {latest ? "Continue practising" : "Practise"}
        </Button>
      }
    />
  );

  const tabColor: Record<DesignView, string> = {
    problem: t.accent,
    solution: t.pattern,
    attempts: t.ok,
  };
  const tab = (v: DesignView, text: string, badge?: number, done?: boolean) => (
    <WorkbenchTab
      key={v}
      on={view === v}
      href={designViewHref(p.subject, p.slug, v)}
      color={tabColor[v]}
      badge={badge}
      done={done}
    >
      {text}
    </WorkbenchTab>
  );
  const tabs = (
    <>
      {tab("problem", "Description")}
      {tab("solution", "Solution")}
      {tab("attempts", "Attempts", p.attempts.length, submitted > 0)}
    </>
  );

  const practiceCard = (
    <S.PracticeCard>
      <h4>Practice</h4>
      <PracticeStats>
        <span>
          <b>{p.attempts.length}</b> attempt{p.attempts.length === 1 ? "" : "s"}
        </span>
        <span>
          <b>{submitted}</b> submitted
        </span>
        <span>
          <b>{p.checks.length}</b> checks
        </span>
      </PracticeStats>
      <S.SmallLink href={designViewHref(p.subject, p.slug, "attempts")}>
        ＋ new attempt with a label
      </S.SmallLink>
    </S.PracticeCard>
  );

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      {practiceCard}
      {technologies.length > 0 && (
        <Card>
          <h4>Technologies</h4>
          <Chips ids={technologies} subject={p.subject} names={names} kind="tech" />
        </Card>
      )}
      {patterns.length > 0 && (
        <Card>
          <h4>Patterns</h4>
          <Chips ids={patterns} subject={p.subject} names={names} kind="pattern" />
        </Card>
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
        <S.Stages aria-label="How you'll practise">
          <h3>How you'll practise</h3>
          <ol>
            {stageSteps(p.stages, p.checks).map((s, i) => (
              <S.Step key={s.stage} $core={Boolean(s.core)} $i={i}>
                <S.StepIcon>{STAGE_INFO[s.stage].icon}</S.StepIcon>
                <S.StepLabel>{stageLabel(s.stage, p.stages)}</S.StepLabel>
                <S.StepCount>
                  {s.checks ? `${s.checks} check${s.checks === 1 ? "" : "s"}` : "—"}
                </S.StepCount>
              </S.Step>
            ))}
          </ol>
          {p.stages.includes("parts") && (
            <MutedP $small>
              The core is <b>Decompose → Reduce</b>: split the problem into parts, solve each with
              its own options and sub-diagram, then merge them into one high-level design.
            </MutedP>
          )}
        </S.Stages>
        <R.Article>
          <Markdown text={readme} path={p.readme_path} anchors />
        </R.Article>
      </>
    );
  } else if (view === "solution") {
    center = !p.has_solution ? (
      <G.Gate>
        <G.GateIcon>🚧</G.GateIcon>
        <h2>No worked solution yet</h2>
        <p>This problem has no reference solution. Practise it and compare with the rubric.</p>
        <G.GateActions>
          <ActionButton $variant="primary" onClick={practise} disabled={busy}>
            {practiseLabel}
          </ActionButton>
        </G.GateActions>
      </G.Gate>
    ) : !open ? (
      <RevealGate
        onReveal={reveal}
        onPractise={practise}
        busy={busy}
        practiseLabel={practiseLabel}
      />
    ) : solError ? (
      <InlineError>⚠ Could not load the solution: {solError}</InlineError>
    ) : !solution ? (
      <Loader aria-label="loading" />
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
      <S.Attempts>
        <R.NewAttempt>
          <h3>Start a new attempt</h3>
          <S.StartRow>
            <input
              value={label}
              placeholder="label (optional, kebab-case)"
              aria-label="attempt label"
              onChange={(e) => setLabel(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && !badLabel && !busy && start(label)}
            />
            <S.StartButton disabled={busy || badLabel} onClick={() => start(label)}>
              ＋ Start
            </S.StartButton>
          </S.StartRow>
          {badLabel && <InlineError>Use lowercase letters, digits and dashes.</InlineError>}
        </R.NewAttempt>
        <h3>Your attempts</h3>
        {p.attempts.length === 0 && (
          <MutedP>None yet. Start one above, or press ▶ Practice.</MutedP>
        )}
        <R.AttemptList>
          {[...p.attempts].reverse().map((a, i) => (
            <R.AttemptItem key={a.name} $i={i}>
              <R.AttemptDot $state={a.submitted ? "done" : ""} />
              <R.AttemptName href={designHref(p.subject, p.slug, a.name)}>{a.name}</R.AttemptName>
              {a.submitted ? <R.Tag $tone="ok">✓ submitted</R.Tag> : <R.Tag>in progress</R.Tag>}
              <R.VsCode href={`vscode://file${a.path}`} title="Open in VS Code">
                ⧉ VS Code
              </R.VsCode>
              <R.OpenLink href={designHref(p.subject, p.slug, a.name)}>Open →</R.OpenLink>
            </R.AttemptItem>
          ))}
        </R.AttemptList>
      </S.Attempts>
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
      <R.Center ref={centerRef}>
        {startError && <InlineError>⚠ {startError}</InlineError>}
        {center}
      </R.Center>
    </Workbench>
  );
}
