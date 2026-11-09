import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ProblemCardData, ProblemRow } from "../api";
import { api } from "../api";
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
import { STATUS_ICON, groupProblems, neighbours, orderProblems } from "../reader";
import { parseRoute } from "../route";
import { runCommand } from "../sessions";
import { extractToc } from "../toc";
import { Button, Grow, Loader, Muted, MutedP, Pill, difficultyColor } from "../theme/primitives";
import { t } from "../theme/theme";
import { OnThisPage } from "./DesignReaderPanes";
import * as R from "./DesignReaderPanes.style";
import * as S from "./ProblemCard.style";
import { Attempts, PracticeCard, SmallLink } from "./DesignProblemPage.style";
import { Badge, Center, CmdStack, PracticeStats } from "./PracticeBench.style";
import { Markdown } from "./Markdown";
import type { NavGroup } from "./panes";
import { NavList, useCenterScroller } from "./panes";
import { Copy } from "./PracticeBench";
import { ResourceList } from "./Resources";
import { Workbench, WorkbenchTab } from "./Workbench";
import { Icon } from "./Icon";
import { MetaTags, PageHeader, PrevNextFooter, StatusLabel, usePrevNextKeys } from "./PageHeader";
import { SimilarProblemsCard } from "./PracticeLinks";

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
    <S.CompactCard>
      <S.CardHead onClick={() => setOpen((o) => !o)}>
        <Badge $difficulty={p.difficulty}>{p.difficulty}</Badge>
        <b>{p.title}</b>
        <Muted>
          {p.expected_complexity.time} · {p.patterns.join(", ")}
        </Muted>
        <Grow />
        <Muted>{open ? "▾" : "▸"}</Muted>
      </S.CardHead>
      <S.Row>
        {p.attempts.length === 0 && <Muted>no attempts yet</Muted>}
        {p.attempts.map((a) => {
          const r = a.last_run;
          const state = runState(r);
          return (
            <S.Attempt
              key={a.name}
              $state={state}
              href={`vscode://file${a.path}`}
              title={`open in VS Code${r ? ` · last run ${r.ts}${r.fit ? " · ≈" + r.fit : ""}` : " · not run"}`}
            >
              {a.name} {r ? `${r.passed}/${r.total}` : ""}
            </S.Attempt>
          );
        })}
      </S.Row>
      <S.Row>
        <Copy text={`./kb attempt ${p.slug} --lang go${pattern ? ` --pattern ${pattern}` : ""}`} />
        <Copy
          text={`./kb attempt ${p.slug} --lang python${pattern ? ` --pattern ${pattern}` : ""}`}
        />
        <Copy text={`./kb run ${p.slug}`} />
        <S.OpenEditor href={`vscode://file${dir}`}>⧉ open in VS Code</S.OpenEditor>
        {practice.length > 0 && <Muted>{practice.length} practice attempt(s)</Muted>}
      </S.Row>
      {open &&
        p.attempts
          .filter((a) => a.review)
          .map((a) => (
            <R.Review key={`review-${a.name}`}>
              <summary>📝 Tutor review of {a.name}</summary>
              <Markdown text={a.review ?? ""} path={p.readme_path} />
            </R.Review>
          ))}
      {open && <Markdown text={p.readme} path={p.readme_path} />}
      {open && p.refs && <ResourceList items={p.refs} title="Explanations elsewhere" />}
    </S.CompactCard>
  );
}

// ---------------------------------------------------------------- the problem page

// The page remounts on every hash change (App keys it): keep the problem list across problems.
const rowsCache = new Map<string, ProblemRow[]>();

const TAB_COLOR: Record<ProblemTab, string | undefined> = {
  problem: undefined,
  learn: t.warn,
  attempts: t.ok,
  resources: t.pattern,
};

const TAB_LABEL: Record<ProblemTab, string> = {
  problem: "Description",
  learn: "Hints & learning",
  attempts: "Attempts",
  resources: "Resources",
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

  usePrevNextKeys(prev ? hrefFor(prev.slug) : null, next ? hrefFor(next.slug) : null);

  const nav = useMemo<NavGroup[]>(
    () =>
      groupProblems(rows ?? [], "").map((g) => ({
        key: g.difficulty,
        label: g.difficulty,
        color: difficultyColor(g.difficulty),
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

  const topicNames = useMemo(
    () => Object.fromEntries((subj?.topics ?? []).map((t) => [t.id, t.name])),
    [subj],
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
    <PageHeader
      title={p.title}
      meta={[
        <Pill $difficulty={p.difficulty}>{p.difficulty}</Pill>,
        <StatusLabel status={status} />,
        <span title="expected time · space complexity">
          {p.expected_complexity.time} · {p.expected_complexity.space}
        </span>,
        ...sources.map((s) =>
          s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name} <Icon name="external" size={12} />
            </a>
          ) : (
            <span>{s.name}</span>
          ),
        ),
        topics.length > 0 && (
          <MetaTags
            tags={topics.map(({ id, topic }) => ({
              key: topic?.name ?? id,
              label: topic?.name ?? id,
              href: topic?.has_lesson ? `#/learn/${subject}/${id}` : `#/topic/${subject}/${id}`,
            }))}
          />
        ),
      ]}
      actions={
        latest ? (
          <Button
            as="a"
            $variant="primary"
            href={`vscode://file${latest.path}`}
            title={latest.name}
          >
            <Icon name="code" size={15} /> Continue in VS Code
          </Button>
        ) : (
          <Button
            $variant="primary"
            onClick={() => void navigator.clipboard.writeText(startCmd)}
            title={`copies: ${startCmd}`}
          >
            <Icon name="play" size={13} /> Start an attempt
          </Button>
        )
      }
    />
  );

  const tabs = available.map((t) => {
    const badge =
      t === "attempts" ? p.attempts.length : t === "resources" ? p.refs?.length : undefined;
    return (
      <WorkbenchTab
        key={t}
        on={tab === t}
        href={problemTabHref(subject, p.slug, t)}
        color={TAB_COLOR[t]}
        badge={badge}
        done={t === "attempts" && passing > 0}
      >
        {TAB_LABEL[t]}
      </WorkbenchTab>
    );
  });

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      <PracticeCard>
        <h4>Practice</h4>
        <PracticeStats>
          <span>
            <b>{p.attempts.length}</b> attempt{p.attempts.length === 1 ? "" : "s"}
          </span>
          <span>
            <b>{passing}</b> passing
          </span>
          <span>
            <b>{reviews}</b> review{reviews === 1 ? "" : "s"}
          </span>
        </PracticeStats>
        <CmdStack>
          <Copy text={`./kb attempt ${p.slug} --lang go`} />
          <Copy text={`./kb attempt ${p.slug} --lang python`} />
          <Copy text={`./kb run ${p.slug}`} />
        </CmdStack>
        <SmallLink href={`vscode://file${dir}`}>⧉ open the problem folder in VS Code</SmallLink>
      </PracticeCard>
      <SimilarProblemsCard subject={subject} items={p.similar} names={topicNames} />
    </OnThisPage>
  );

  const footer = (
    <PrevNextFooter
      prev={prev ? { title: prev.title, href: hrefFor(prev.slug) } : null}
      next={next ? { title: next.title, href: hrefFor(next.slug) } : null}
      noun="problem"
    />
  );

  let center;
  if (tab === "problem" || tab === "learn") {
    center = (
      <S.ProblemArticle>
        {tab === "learn" && (
          <S.Note>
            💡 Try the hints one at a time; the approach is a spoiler. Stuck for real? Practise the
            pattern's lesson first.
          </S.Note>
        )}
        <Markdown text={md} path={p.readme_path} anchors />
      </S.ProblemArticle>
    );
  } else if (tab === "attempts") {
    center = (
      <Attempts>
        <R.NewAttempt>
          <h3>Start a new attempt</h3>
          <MutedP $small>
            Attempts live in your private workspace. Create one from the repo root, solve it in your
            editor, then run it; this page picks the result up.
          </MutedP>
          <CmdStack>
            <Copy text={`./kb attempt ${p.slug} --lang go`} />
            <Copy text={`./kb attempt ${p.slug} --lang python`} />
          </CmdStack>
        </R.NewAttempt>
        <h3>Your attempts</h3>
        {p.attempts.length === 0 && <MutedP>None yet. Start one above.</MutedP>}
        <R.AttemptList>
          {[...p.attempts].reverse().map((a, i) => {
            const r = a.last_run;
            const state = runState(r);
            return (
              <R.AttemptItem key={a.name} $i={i} $stacked>
                <S.AttemptRow>
                  <R.AttemptDot
                    $state={state === "ok" ? "done" : state === "fail" ? "fail" : "none"}
                  />
                  <R.AttemptName href={`vscode://file${a.path}`} title="Open in VS Code">
                    {a.name}
                  </R.AttemptName>
                  <R.Tag>{a.lang}</R.Tag>
                  {r ? (
                    <R.Tag $tone={state === "ok" ? "ok" : "bad"} title={`last run ${r.ts}`}>
                      {state === "ok" ? "✓" : "✗"} {r.passed}/{r.total}
                      {r.fit ? ` · ≈${r.fit}` : ""}
                    </R.Tag>
                  ) : (
                    <R.Tag>not run</R.Tag>
                  )}
                  <Copy text={runCommand(a.path, root)} label="▶ run" inline />
                  <R.VsCode href={`vscode://file${a.path}`} title="Open in VS Code">
                    ⧉ VS Code
                  </R.VsCode>
                </S.AttemptRow>
                {a.review && (
                  <S.AttemptReview open={i === 0}>
                    <summary>📝 Tutor review</summary>
                    <Markdown text={a.review} path={p.readme_path} />
                  </S.AttemptReview>
                )}
              </R.AttemptItem>
            );
          })}
        </R.AttemptList>
        <MutedP $small>
          Want feedback on an attempt? In Claude Code: <code>/review</code>; it lands here.
        </MutedP>
      </Attempts>
    );
  } else {
    center = <ResourceList items={p.refs ?? []} title="Explanations elsewhere" />;
  }

  return (
    <Workbench
      id="problem"
      leftCollapsed
      header={header}
      tabs={tabs}
      left={{
        title: "Problems",
        icon: "🗂️",
        content: rows ? (
          <NavList groups={nav} placeholder="Filter problems…" />
        ) : (
          <Loader $small aria-label="loading" />
        ),
      }}
      right={{ title: "On this page", icon: "🧭", content: right }}
      footer={footer}
    >
      <Center $narrow ref={centerRef}>
        {center}
      </Center>
    </Workbench>
  );
}
