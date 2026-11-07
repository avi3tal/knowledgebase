import { useContext, useMemo, useState } from "react";
import type { ProblemRow } from "../api";
import { SUBJECT_ICON, SUBJECT_SHORT, groupLabel, groupTopics, topicIcon } from "../catalog";
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
import { StatusBar, Stat } from "./PracticeBench";
import { Ring } from "./Ring";
import { Workbench } from "./Workbench";

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

const DIFF_ICON: Record<Difficulty, string> = { easy: "🌱", medium: "🔥", hard: "⚡" };

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
        color: "var(--muted)",
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
    <div className="rd-header pb-head">
      <div className="rd-icon">{SUBJECT_ICON[subject] ?? "🧪"}</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          <span className="pb-kicker">Practice</span>
          <span className="muted small">
            mirrors <code>{subject}/problems/</code> · status from your runs
          </span>
        </div>
        <h1>
          {SUBJECT_SHORT[subject] ?? subject} problems
          {filter.topic && <span className="pb-h1-sub"> · {topicName(filter.topic)}</span>}
        </h1>
        <div className="pb-stats">
          <Stat n={all.total} label="problems" />
          <Stat n={all.solved} label="solved" tone="ok" />
          <Stat n={all.failing} label="failing" tone="bad" />
          <Stat n={all.untried} label="untried" />
        </div>
      </div>
      <div className="pb-ring">
        <Ring solved={all.solved} failing={all.failing} total={all.total} size={64} />
      </div>
    </div>
  );

  const tab = (d: Difficulty | "", label: string, icon: string, n: number) => (
    <a
      key={d || "all"}
      className={`wb-tab pb-tab-${d || "all"} ${filter.difficulty === d ? "on" : ""}`}
      href={problemsHref(subject, { topic: filter.topic, difficulty: d })}
      aria-current={filter.difficulty === d ? "page" : undefined}
    >
      {icon} {label}
      <span className="wb-tab-badge">{n}</span>
    </a>
  );
  const tabs = (
    <>
      {tab("", "All", "🧪", inTopic.length)}
      {DIFFICULTIES.map((d) =>
        tab(d, d[0]!.toUpperCase() + d.slice(1), DIFF_ICON[d], tabDiff[d].total),
      )}
    </>
  );

  const right = (
    <div className="pb-side">
      <section className="rd-card pb-summary">
        <h4>By difficulty</h4>
        {DIFFICULTIES.map((d) => (
          <a
            key={d}
            className={`pb-diff-row ${d}`}
            href={problemsHref(subject, { topic: "", difficulty: d })}
          >
            <span className={`badge ${d}`}>{d}</span>
            <StatusBar c={byDiff[d]} legend={false} />
            <span className="pb-num">
              {byDiff[d].solved}/{byDiff[d].total}
            </span>
          </a>
        ))}
      </section>
      <section className="rd-card">
        <h4>By status</h4>
        <StatusBar c={all} />
      </section>
      <section className="rd-card pb-next">
        <h4>🎯 Next to practise</h4>
        {next.length === 0 && <p className="muted small">Everything is tried. Nice.</p>}
        <ol>
          {next.map(({ row: r, topic }, i) => (
            <li key={r.slug} style={{ ["--i" as string]: i }}>
              <a href={problemHref(subject, r.slug)}>{r.title}</a>
              <span className={`badge ${r.difficulty}`}>{r.difficulty}</span>
              <div className="muted small">
                {topic ? `weak spot: ${topicName(topic)}` : "fresh ground"}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="muted small">
        Plan a set from these in <a href="#/sessions">🎯 Sessions</a>, or ask Claude Code:{" "}
        <code>/session</code>.
      </p>
    </div>
  );

  const footer = (
    <div className="pb-footer">
      <span>
        Showing <b>{shown.length}</b> / {rows.length}
      </span>
      {(filter.topic || filter.difficulty || status || query) && (
        <span className="pb-filters">
          {filter.topic && <span className="pb-pill">{topicName(filter.topic)}</span>}
          {filter.difficulty && <span className="pb-pill">{filter.difficulty}</span>}
          {status && <span className="pb-pill">{status}</span>}
          {query && <span className="pb-pill">“{query}”</span>}
          <a
            href={problemsHref(subject, { topic: "", difficulty: "" })}
            onClick={() => {
              setStatus("");
              setQuery("");
            }}
          >
            clear filters
          </a>
        </span>
      )}
      <span className="grow" />
      <span className="muted">
        {design ? "rows open the design reader" : "rows open the problem page"}
      </span>
    </div>
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
      <div className="pb-center pb-problems">
        <div className="pb-toolbar">
          <input
            className="rd-filter pb-search"
            type="search"
            placeholder="Search problems…"
            aria-label="Search problems"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          />
          <div className="pb-seg" role="group" aria-label="status">
            {(["", ...STATUSES] as const).map((s) => (
              <button
                key={s || "any"}
                className={`pb-seg-btn ${s} ${status === s ? "on" : ""}`}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
              >
                {s ? `${STATUS_ICON[s]} ${s}` : "any status"}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="pb-empty">
            <div className="pb-empty-icon">🔍</div>
            <p>No problem matches these filters.</p>
          </div>
        ) : (
          <div className="pb-table-wrap">
            <table className="problems-table pb-table">
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
                  <tr key={r.slug} className={r.status} style={{ ["--i" as string]: i }}>
                    <td>
                      <a className="pb-title" href={problemHref(subject, r.slug)}>
                        {r.title}
                      </a>
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
                        <a key={t} href={topicLink(t)} className="topic-link">
                          {topicName(t)}
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
        )}
      </div>
    </Workbench>
  );
}
