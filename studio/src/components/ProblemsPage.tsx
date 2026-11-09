import { useContext, useMemo, useState } from "react";
import type { ProblemRow } from "../api";
import { groupLabel, groupTopics, topicIcon } from "../catalog";
import { SubjectContext } from "../context";
import type { Status } from "../practice-bench";
import {
  STATUSES,
  countByDifficulty,
  countByTopic,
  countStatus,
  nextToPractise,
  problemsFilterOf,
  problemsHref,
} from "../practice-bench";
import type { Difficulty } from "../reader";
import { DIFFICULTIES, STATUS_ICON } from "../reader";
import { DESIGN_SUBJECTS, problemHref } from "../route";
import type { NavGroup } from "./panes";
import { NavList } from "./panes";
import { StatusBar } from "./PracticeBench";
import { Ring } from "./Ring";
import { Workbench, WorkbenchTab } from "./Workbench";
import { Card, Grow, Muted, MutedP, Tinted } from "../theme/primitives";
import { t as tk } from "../theme/theme";
import { Badge, Center, Empty, EmptyIcon, FooterRow, Side } from "./PracticeBench.style";
import * as S from "./ProblemsPage.style";
import { PageHeader, TitleSuffix } from "./PageHeader";

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

/**
 * Every problem of a subject on the Workbench: topic filters left, the table in the center,
 * a summary and "next to practise" right. Topic and difficulty live in the hash
 * (`#/problems/<subject>/<topic|all>/<difficulty>`), status and search are local.
 */
export function ProblemsPage(props: {
  subject: string;
  rows: ProblemRow[];
  names: Record<string, string>;
  /** Topic ids that have a lesson; others link to their topic page. */
  lessons?: Set<string>;
}) {
  const { subject, rows, names, lessons } = props;
  const { subject: subj } = useContext(SubjectContext);
  const [filter] = useState(() => problemsFilterOf(window.location.hash));
  const [status, setStatus] = useState<Status | "">("");
  const [query, setQuery] = useState("");
  const design = DESIGN_SUBJECTS.has(subject);

  const inTopic = useMemo(
    () => filterProblems(rows, { topic: filter.topic, difficulty: "", status: "", query: "" }),
    [rows, filter.topic],
  );
  const shown = useMemo(
    () => filterProblems(rows, { ...filter, status, query }),
    [rows, filter, status, query],
  );
  const all = countStatus(rows);
  const byDiff = countByDifficulty(rows);
  const tabDiff = countByDifficulty(inTopic);
  const next = useMemo(() => nextToPractise(rows, 5), [rows]);
  const topicName = (t: string) => names[t] ?? t;
  const topicLink = (t: string) =>
    lessons && !lessons.has(t) ? `#/topic/${subject}/${t}` : `#/learn/${subject}/${t}`;

  const nav = useMemo<NavGroup[]>(() => {
    const counts = countByTopic(rows);
    const allItem: NavGroup = {
      key: "_all",
      label: "Show",
      icon: "🧪",
      items: [
        {
          id: "_all",
          title: "All problems",
          href: problemsHref(subject, { topic: "", difficulty: filter.difficulty }),
          icon: "★",
          badge: rows.length,
          current: !filter.topic,
        },
      ],
    };
    const known = new Set((subj?.topics ?? []).map((t) => t.id));
    const groups: NavGroup[] = groupTopics(
      (subj?.topics ?? []).filter((t) => counts.has(t.id)),
    ).map((g) => ({
      key: g.group,
      label: groupLabel(g.group),
      color: g.color,
      items: g.topics.map((t) => {
        const c = counts.get(t.id);
        return {
          id: t.id,
          title: t.name,
          href: problemsHref(subject, { topic: t.id, difficulty: filter.difficulty }),
          icon: topicIcon(t),
          badge: c ? `${c.solved}/${c.total}` : 0,
          current: filter.topic === t.id,
          hint: t.id,
        };
      }),
    }));
    // Problem tags the catalog doesn't know still filter.
    const other = [...counts.keys()].filter((t) => !known.has(t)).sort();
    if (other.length)
      groups.push({
        key: "_other",
        label: "Other tags",
        color: tk.muted,
        items: other.map((t) => ({
          id: t,
          title: names[t] ?? t,
          href: problemsHref(subject, { topic: t, difficulty: filter.difficulty }),
          badge: `${counts.get(t)?.solved ?? 0}/${counts.get(t)?.total ?? 0}`,
          current: filter.topic === t,
        })),
      });
    return [allItem, ...groups];
  }, [rows, subj, subject, filter, names]);

  const header = (
    <PageHeader
      title={
        <>
          Problems
          {filter.topic && <TitleSuffix> · {topicName(filter.topic)}</TitleSuffix>}
        </>
      }
      meta={[
        <span>{all.total} problems</span>,
        <Tinted $tone="ok">{all.solved} solved</Tinted>,
        all.failing > 0 && <Tinted $tone="bad">{all.failing} failing</Tinted>,
        <span>{all.untried} not started</span>,
      ]}
      actions={<Ring solved={all.solved} failing={all.failing} total={all.total} size={44} />}
    />
  );

  const tab = (d: Difficulty | "", label: string, n: number) => (
    <WorkbenchTab
      key={d || "all"}
      on={filter.difficulty === d}
      href={problemsHref(subject, { topic: filter.topic, difficulty: d })}
      color={d ? tk[d] : undefined}
      badge={n}
    >
      {label}
    </WorkbenchTab>
  );
  const tabs = (
    <>
      {tab("", "All", inTopic.length)}
      {DIFFICULTIES.map((d) => tab(d, d[0]!.toUpperCase() + d.slice(1), tabDiff[d].total))}
    </>
  );

  const right = (
    <Side>
      <Card>
        <h4>By difficulty</h4>
        {DIFFICULTIES.map((d) => (
          <S.DiffRow key={d} href={problemsHref(subject, { topic: "", difficulty: d })}>
            <S.DiffBadge $difficulty={d}>{d}</S.DiffBadge>
            <StatusBar c={byDiff[d]} legend={false} />
            <S.Num>
              {byDiff[d].solved}/{byDiff[d].total}
            </S.Num>
          </S.DiffRow>
        ))}
      </Card>
      <Card>
        <h4>By status</h4>
        <StatusBar c={all} />
      </Card>
      <S.NextCard>
        <h4>🎯 Next to practise</h4>
        {next.length === 0 && <MutedP $small>Everything is tried. Nice.</MutedP>}
        <ol>
          {next.map(({ row: r, topic }, i) => (
            <S.NextItem key={r.slug} $i={i}>
              <a href={problemHref(subject, r.slug)}>{r.title}</a>
              <Badge $difficulty={r.difficulty}>{r.difficulty}</Badge>
              <Muted as="div" $small>
                {topic ? `weak spot: ${topicName(topic)}` : "fresh ground"}
              </Muted>
            </S.NextItem>
          ))}
        </ol>
      </S.NextCard>
      <MutedP $small>
        Plan a set from these in <a href="#/sessions">🎯 Sessions</a>, or ask Claude Code:{" "}
        <code>/session</code>.
      </MutedP>
    </Side>
  );

  const footer = (
    <FooterRow>
      <span>
        Showing <b>{shown.length}</b> / {rows.length}
      </span>
      {(filter.topic || filter.difficulty || status || query) && (
        <S.Filters>
          {filter.topic && <S.FilterPill>{topicName(filter.topic)}</S.FilterPill>}
          {filter.difficulty && <S.FilterPill>{filter.difficulty}</S.FilterPill>}
          {status && <S.FilterPill>{status}</S.FilterPill>}
          {query && <S.FilterPill>“{query}”</S.FilterPill>}
          <a
            href={problemsHref(subject, { topic: "", difficulty: "" })}
            onClick={() => {
              setStatus("");
              setQuery("");
            }}
          >
            clear filters
          </a>
        </S.Filters>
      )}
      <Grow />
      <Muted>{design ? "rows open the design reader" : "rows open the problem page"}</Muted>
    </FooterRow>
  );

  return (
    <Workbench
      id="problems"
      header={header}
      tabs={tabs}
      left={{
        title: "Topics",
        icon: "🏷️",
        content: <NavList groups={nav} placeholder="Filter topics…" />,
      }}
      right={{ title: "Summary", icon: "📊", content: right }}
      footer={footer}
    >
      <Center>
        <S.Toolbar>
          <S.Search
            type="search"
            placeholder="Search problems…"
            aria-label="Search problems"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          />
          <S.Seg role="group" aria-label="status">
            {(["", ...STATUSES] as const).map((s) => (
              <S.SegButton
                key={s || "any"}
                $kind={s}
                $on={status === s}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
              >
                {s ? `${STATUS_ICON[s]} ${s}` : "any status"}
              </S.SegButton>
            ))}
          </S.Seg>
        </S.Toolbar>
        {shown.length === 0 ? (
          <Empty>
            <EmptyIcon>🔍</EmptyIcon>
            <p>No problem matches these filters.</p>
          </Empty>
        ) : (
          <S.TableWrap>
            <S.Table>
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Difficulty</th>
                  <th>Patterns</th>
                  <th>Status</th>
                  <th title="attempts">#</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <S.Row key={r.slug} $status={r.status} $i={i}>
                    <td>
                      <S.Title href={problemHref(subject, r.slug)}>{r.title}</S.Title>
                      {r.legacy_failing && (
                        <S.Tag title="an old solution of yours has a known bug">legacy bug</S.Tag>
                      )}
                      {r.complexity_miss && <S.Tag>complexity ✗</S.Tag>}
                    </td>
                    <td>
                      <Badge $difficulty={r.difficulty}>{r.difficulty}</Badge>
                    </td>
                    <S.PatternCell>
                      {r.topics.map((t) => (
                        <S.TopicLink key={t} href={topicLink(t)}>
                          {topicName(t)}
                        </S.TopicLink>
                      ))}
                    </S.PatternCell>
                    <S.StatusCell $status={r.status}>{STATUS_LABEL[r.status]}</S.StatusCell>
                    <S.CountCell>{r.attempts}</S.CountCell>
                  </S.Row>
                ))}
              </tbody>
            </S.Table>
          </S.TableWrap>
        )}
      </Center>
    </Workbench>
  );
}
