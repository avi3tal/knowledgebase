import { useEffect, useMemo, useRef, useState } from "react";
import type { Feedback, Topic } from "../api";
import { groupLabel, groupTopics, topicIcon } from "../catalog";
import {
  masteryIcon,
  pct,
  progressHref,
  progressTotals,
  progressViewOf,
  rankTopics,
  recentlyPractised,
} from "../practice-bench";
import { STATUS_ICON } from "../reader";
import { problemHref } from "../route";
import type { NavGroup } from "./panes";
import { NavList } from "./panes";
import { StatusBar } from "./PracticeBench";
import { Ring } from "./Ring";
import { Workbench } from "./Workbench";
import { PageHeader } from "./PageHeader";

/** Topics worth a progress tile: practised or taught. Grouped like the Learn tab. */
export function progressGroups(data: Feedback, topics: Topic[]) {
  const shown = new Set(
    data.topics.filter((t) => t.problems.length > 0 || t.has_lesson).map((t) => t.id),
  );
  const byId = new Map(data.topics.map((t) => [t.id, t]));
  return groupTopics(topics.filter((t) => shown.has(t.id))).map((g) => ({
    ...g,
    tiles: g.topics.flatMap((t) => byId.get(t.id) ?? []),
  }));
}

/**
 * Progress on the Workbench: a tab per topic group (`#/progress/<subject>/<group>[/<topic>]`),
 * topics with mastery left, tiles center, strongest / weakest and recent practice right.
 */
export function Dashboard({ data, topics }: { data: Feedback; topics: Topic[] }) {
  const [view] = useState(() => progressViewOf(window.location.hash));
  const groups = useMemo(() => progressGroups(data, topics), [data, topics]);
  const totals = useMemo(() => progressTotals(data), [data]);
  const shownTiles = useMemo(() => groups.flatMap((g) => g.tiles), [groups]);
  const { strongest, weakest } = useMemo(() => rankTopics(shownTiles, 5), [shownTiles]);
  const recent = useMemo(() => recentlyPractised(data, 6), [data]);
  const due = data.topics.filter((t) => t.review_due && t.review_due <= data.today);
  const groupOfTopic = useMemo(
    () => new Map(groups.flatMap((g) => g.tiles.map((t) => [t.id, g.group] as const))),
    [groups],
  );
  // A topic link outside the chosen group opens its own group.
  const group =
    view.topic && groupOfTopic.has(view.topic) && view.group !== ""
      ? (groupOfTopic.get(view.topic) ?? "")
      : view.group;
  const visible = group ? groups.filter((g) => g.group === group) : groups;
  const centerRef = useRef<HTMLDivElement>(null);
  const subject = data.subject;
  const topicHref = (id: string) =>
    progressHref(subject, { group: group ? (groupOfTopic.get(id) ?? "") : "", topic: id });

  useEffect(() => {
    if (!view.topic) return;
    const el = centerRef.current?.querySelector<HTMLElement>(`[data-topic="${view.topic}"]`);
    el?.scrollIntoView({ block: "center" });
  }, [view.topic]);

  const nav = useMemo<NavGroup[]>(
    () =>
      groups.map((g) => ({
        key: g.group,
        label: groupLabel(g.group),
        color: g.color,
        items: g.tiles.map((t) => {
          const topic = g.topics.find((x) => x.id === t.id);
          return {
            id: t.id,
            title: `${topic ? topicIcon(topic) : ""} ${t.name}`.trim(),
            href: progressHref(subject, { group: group ? g.group : "", topic: t.id }),
            icon: masteryIcon(t),
            badge: t.problems.length ? `${pct(t.counts.solved, t.problems.length)}%` : "📖",
            current: view.topic === t.id,
            muted: t.problems.length === 0,
          };
        }),
      })),
    [groups, subject, group, view.topic],
  );

  const header = (
    <PageHeader
      title="Your progress"
      meta={[
        <span>{totals.topics} topics</span>,
        <span>{totals.lessons} lessons</span>,
        <span className="status solved">{totals.solved} solved</span>,
        totals.failing > 0 && <span className="status failing">{totals.failing} failing</span>,
        <span>{totals.untried} not started</span>,
        <span>quiz {totals.quiz === null ? "—" : `${Math.round(totals.quiz * 100)}%`}</span>,
        totals.due > 0 && <span className="status started">{totals.due} reviews due</span>,
      ]}
      actions={
        <span title="problems solved">
          <Ring solved={totals.solved} failing={totals.failing} total={totals.total} size={44} />
        </span>
      }
    />
  );

  const tab = (g: string, label: string, n: number, color?: string) => (
    <a
      key={g || "all"}
      className={`wb-tab ${group === g ? "on" : ""}`}
      style={color ? { ["--tab-c" as string]: color } : undefined}
      href={progressHref(subject, { group: g, topic: "" })}
      aria-current={group === g ? "page" : undefined}
    >
      {color && <span className="pb-tab-dot" style={{ background: color }} />}
      {label}
      <span className="wb-tab-badge">{n}</span>
    </a>
  );
  const tabs = (
    <>
      {tab("", "All topics", shownTiles.length)}
      {groups.map((g) => tab(g.group, groupLabel(g.group), g.tiles.length, g.color))}
    </>
  );

  const topicRow = (t: (typeof shownTiles)[number], tone: "ok" | "bad") => (
    <li key={t.id}>
      <a href={topicHref(t.id)}>{t.name}</a>
      <span className={`pb-num ${tone}`}>
        {t.counts.solved}/{t.problems.length}
      </span>
    </li>
  );

  const right = (
    <div className="pb-side">
      <section className="rd-card">
        <h4>💪 Strongest</h4>
        {strongest.length === 0 ? (
          <p className="muted small">Solve a problem to see your strengths.</p>
        ) : (
          <ol className="pb-rank">{strongest.map((t) => topicRow(t, "ok"))}</ol>
        )}
      </section>
      <section className="rd-card">
        <h4>🩹 Weakest</h4>
        {weakest.length === 0 ? (
          <p className="muted small">Nothing weak yet: no failing or half-done topics.</p>
        ) : (
          <ol className="pb-rank">{weakest.map((t) => topicRow(t, "bad"))}</ol>
        )}
      </section>
      <section className="rd-card">
        <h4>🕒 Recently practised</h4>
        {recent.length === 0 ? (
          <p className="muted small">
            No runs yet. Start with <code>./kb attempt &lt;slug&gt;</code> and <code>./kb run</code>
            .
          </p>
        ) : (
          <ul className="pb-recent">
            {recent.map((p) => (
              <li key={p.slug}>
                <span className={`rd-status ${p.status}`}>{STATUS_ICON[p.status]}</span>
                <a href={problemHref(subject, p.slug)}>{p.title}</a>
                <span className="muted small">{p.last_practiced?.slice(5, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {due.length > 0 && (
        <section className="rd-card pb-due">
          <h4>⏰ Spaced review due</h4>
          <div className="chips">
            {due.map((t) => (
              <a key={t.id} className="rd-chip" href={topicHref(t.id)}>
                {t.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const footer = (
    <div className="pb-footer">
      <span>
        <b>{totals.total}</b> problems · <b>{totals.topics}</b> topics
      </span>
      <StatusBar c={totals} />
      <span className="grow" />
      {data.unmapped_tags.length > 0 && (
        <span className="muted small" title={data.unmapped_tags.join(", ")}>
          {data.unmapped_tags.length} unmapped tag{data.unmapped_tags.length === 1 ? "" : "s"}
        </span>
      )}
      <span className="muted">no AI involved</span>
    </div>
  );

  return (
    <Workbench
      id="progress"
      header={header}
      tabs={tabs}
      left={{
        title: "Topics",
        icon: "🏷️",
        content: <NavList groups={nav} placeholder="Filter topics…" emptyText="No topics yet." />,
      }}
      right={{ title: "Highlights", icon: "✨", content: right }}
      footer={footer}
    >
      <div className="pb-center pb-progress" ref={centerRef}>
        {due.length > 0 && (
          <div className="callout">⏰ Spaced review due: {due.map((t) => t.name).join(", ")}</div>
        )}
        {visible.length === 0 && (
          <div className="pb-empty">
            <div className="pb-empty-icon">🌱</div>
            <p>No topics practised or taught yet. Open a lesson or start an attempt.</p>
          </div>
        )}
        {visible.map((g) => (
          <section key={g.group} className="pb-group" style={{ ["--c" as string]: g.color }}>
            <h2 className="group-title">
              <span className="swatch" /> {groupLabel(g.group)}
              <span className="muted small"> {g.tiles.length}</span>
            </h2>
            <div className="grid">
              {g.tiles.map((t, i) => (
                <TopicTile
                  key={t.id}
                  t={t}
                  subject={subject}
                  index={i}
                  current={t.id === view.topic}
                />
              ))}
            </div>
          </section>
        ))}
        {data.unmapped_tags.length > 0 && (
          <p className="muted">Unmapped problem tags: {data.unmapped_tags.join(", ")}</p>
        )}
      </div>
    </Workbench>
  );
}

function TopicTile({
  t,
  subject,
  index,
  current,
}: {
  t: Feedback["topics"][number];
  subject: string;
  index: number;
  current: boolean;
}) {
  return (
    <div
      className={`tile pb-tile ${current ? "current" : ""}`}
      data-topic={t.id}
      style={{ ["--i" as string]: index }}
    >
      <div className="tile-head">
        <b>
          <span className="pb-mastery">{masteryIcon(t)}</span> {t.name}
        </b>
        {t.has_lesson ? (
          <a href={`#/learn/${subject}/${t.id}`}>open lesson →</a>
        ) : (
          <a className="muted" href={`#/topic/${subject}/${t.id}`}>
            topic page →
          </a>
        )}
      </div>
      <StatusBar c={{ total: t.problems.length, ...t.counts }} legend={false} />
      <div className="muted small">
        {t.problems.length} problems · quiz{" "}
        {t.quiz_accuracy === null ? "—" : `${Math.round(t.quiz_accuracy * 100)}%`}
        {t.last_practiced ? ` · last ${t.last_practiced.slice(0, 10)}` : ""}
      </div>
      <ul className="advice">
        {t.advice.slice(0, 3).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
