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
import { Grow, Muted, MutedP, Tinted } from "../theme/primitives";
import * as S from "./Dashboard.style";
import * as L from "./LearnBenchParts.style";
import { PageHeader } from "./PageHeader";
import { Workbench, WorkbenchTab } from "./Workbench";

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
        <Tinted $tone="ok">{totals.solved} solved</Tinted>,
        totals.failing > 0 && <Tinted $tone="bad">{totals.failing} failing</Tinted>,
        <span>{totals.untried} not started</span>,
        <span>quiz {totals.quiz === null ? "—" : `${Math.round(totals.quiz * 100)}%`}</span>,
        totals.due > 0 && <Tinted $tone="warn">{totals.due} reviews due</Tinted>,
      ]}
      actions={
        <span title="problems solved">
          <Ring solved={totals.solved} failing={totals.failing} total={totals.total} size={44} />
        </span>
      }
    />
  );

  const tab = (g: string, label: string, n: number, color?: string) => (
    <WorkbenchTab
      key={g || "all"}
      on={group === g}
      color={color}
      href={progressHref(subject, { group: g, topic: "" })}
      badge={n}
    >
      {color && <S.TabDot $color={color} />}
      {label}
    </WorkbenchTab>
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
      <S.Num $tone={tone}>
        {t.counts.solved}/{t.problems.length}
      </S.Num>
    </li>
  );

  const right = (
    <S.Side>
      <L.RdCard>
        <h4>💪 Strongest</h4>
        {strongest.length === 0 ? (
          <MutedP $small>Solve a problem to see your strengths.</MutedP>
        ) : (
          <S.Rank>{strongest.map((t) => topicRow(t, "ok"))}</S.Rank>
        )}
      </L.RdCard>
      <L.RdCard>
        <h4>🩹 Weakest</h4>
        {weakest.length === 0 ? (
          <MutedP $small>Nothing weak yet: no failing or half-done topics.</MutedP>
        ) : (
          <S.Rank>{weakest.map((t) => topicRow(t, "bad"))}</S.Rank>
        )}
      </L.RdCard>
      <L.RdCard>
        <h4>🕒 Recently practised</h4>
        {recent.length === 0 ? (
          <MutedP $small>
            No runs yet. Start with <code>./kb attempt &lt;slug&gt;</code> and <code>./kb run</code>
            .
          </MutedP>
        ) : (
          <S.Recent>
            {recent.map((p) => (
              <li key={p.slug}>
                <S.StatusMark $status={p.status}>{STATUS_ICON[p.status]}</S.StatusMark>
                <a href={problemHref(subject, p.slug)}>{p.title}</a>
                <Muted $small>{p.last_practiced?.slice(5, 10)}</Muted>
              </li>
            ))}
          </S.Recent>
        )}
      </L.RdCard>
      {due.length > 0 && (
        <S.DueCard>
          <h4>⏰ Spaced review due</h4>
          <S.DueChips>
            {due.map((t) => (
              <S.DueChip key={t.id} href={topicHref(t.id)}>
                {t.name}
              </S.DueChip>
            ))}
          </S.DueChips>
        </S.DueCard>
      )}
    </S.Side>
  );

  const footer = (
    <S.Footer>
      <span>
        <b>{totals.total}</b> problems · <b>{totals.topics}</b> topics
      </span>
      <S.FooterBar>
        <StatusBar c={totals} />
      </S.FooterBar>
      <Grow />
      {data.unmapped_tags.length > 0 && (
        <Muted $small title={data.unmapped_tags.join(", ")}>
          {data.unmapped_tags.length} unmapped tag{data.unmapped_tags.length === 1 ? "" : "s"}
        </Muted>
      )}
      <Muted>no AI involved</Muted>
    </S.Footer>
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
      <S.Center ref={centerRef}>
        {due.length > 0 && (
          <L.Callout>⏰ Spaced review due: {due.map((t) => t.name).join(", ")}</L.Callout>
        )}
        {visible.length === 0 && (
          <S.Empty>
            <S.EmptyIcon>🌱</S.EmptyIcon>
            <p>No topics practised or taught yet. Open a lesson or start an attempt.</p>
          </S.Empty>
        )}
        {visible.map((g) => (
          <S.Group key={g.group}>
            <L.GroupTitle>
              <L.Dot $color={g.color} /> {groupLabel(g.group)}
              <Muted $small> {g.tiles.length}</Muted>
            </L.GroupTitle>
            <L.Grid>
              {g.tiles.map((t, i) => (
                <TopicTile
                  key={t.id}
                  t={t}
                  subject={subject}
                  index={i}
                  color={g.color}
                  current={t.id === view.topic}
                />
              ))}
            </L.Grid>
          </S.Group>
        ))}
        {data.unmapped_tags.length > 0 && (
          <MutedP>Unmapped problem tags: {data.unmapped_tags.join(", ")}</MutedP>
        )}
      </S.Center>
    </Workbench>
  );
}

function TopicTile({
  t,
  subject,
  index,
  color,
  current,
}: {
  t: Feedback["topics"][number];
  subject: string;
  index: number;
  color: string;
  current: boolean;
}) {
  return (
    <S.Tile $color={color} $i={index} $current={current} data-topic={t.id}>
      <S.TileHead>
        <b>
          <S.Mastery $color={color}>{masteryIcon(t)}</S.Mastery> {t.name}
        </b>
        {t.has_lesson ? (
          <a href={`#/learn/${subject}/${t.id}`}>open lesson →</a>
        ) : (
          <Muted as="a" href={`#/topic/${subject}/${t.id}`}>
            topic page →
          </Muted>
        )}
      </S.TileHead>
      <S.TileBar>
        <StatusBar c={{ total: t.problems.length, ...t.counts }} legend={false} />
      </S.TileBar>
      <Muted $small as="div">
        {t.problems.length} problems · quiz{" "}
        {t.quiz_accuracy === null ? "—" : `${Math.round(t.quiz_accuracy * 100)}%`}
        {t.last_practiced ? ` · last ${t.last_practiced.slice(0, 10)}` : ""}
      </Muted>
      <S.Advice>
        {t.advice.slice(0, 3).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </S.Advice>
    </S.Tile>
  );
}
