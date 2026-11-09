import { useMemo, useState } from "react";
import type { Graph, Subject } from "../api";
import { groupLabel, groupOf, groupTopics, topicIcon } from "../catalog";
import type { MapNode } from "../learn-bench";
import {
  edgePath,
  lessonHref,
  linkedTo,
  mapLabel,
  nodeRadius,
  ringLayout,
  topicCounts,
  topicEdges,
  topicPageHref,
} from "../learn-bench";
import { TopicLinks } from "./LearnBenchParts";
import { Muted, MutedP } from "../theme/primitives";
import { t as tokens } from "../theme/theme";
import * as L from "./LearnBenchParts.style";
import { PageHeader } from "./PageHeader";
import * as S from "./SubjectMap.style";
import { Workbench, WorkbenchTab } from "./Workbench";

type View = "graph" | "grid";

/** Subject-level knowledge map: every topic on a ring by group, prereq / related edges across it. */
export function SubjectMap({ subject, graph }: { subject: Subject; graph: Graph }) {
  const [view, setView] = useState<View>("graph");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [lessonsOnly, setLessonsOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const groups = useMemo(() => groupTopics(subject.topics), [subject]);
  const counts = useMemo(() => topicCounts(graph), [graph]);
  const allEdges = useMemo(() => topicEdges(graph), [graph]);
  const shown = useMemo(
    () => subject.topics.filter((t) => !hidden.has(groupOf(t)) && (!lessonsOnly || t.has_lesson)),
    [subject, hidden, lessonsOnly],
  );
  const layout = useMemo(() => ringLayout(shown, counts), [shown, counts]);
  const pos = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const edges = allEdges.filter((e) => pos.has(e.from) && pos.has(e.to));
  const focus = hover ?? selected;
  const near = useMemo(() => (focus ? linkedTo(focus, allEdges) : null), [focus, allEdges]);
  const names = useMemo(
    () => Object.fromEntries(subject.topics.map((t) => [t.id, t.name])),
    [subject],
  );
  const sel = selected ? (subject.topics.find((t) => t.id === selected) ?? null) : null;
  const c = layout.size / 2;

  const toggle = (g: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  const header = (
    <PageHeader
      title="Knowledge map"
      meta={[
        <span>{subject.title}</span>,
        subject.status === "locked" && <span>Lessons coming</span>,
      ]}
      sub="Every topic with its prerequisites, related topics, practice problems and resources. Click a topic for details."
    />
  );

  const tab = (v: View, icon: string, label: string, colour: string) => (
    <WorkbenchTab on={view === v} color={colour} onClick={() => setView(v)}>
      {icon} {label}
    </WorkbenchTab>
  );

  const left = (
    <S.Legend>
      <L.LearnCard>
        <h4>Groups</h4>
        <S.Filters>
          {groups.map((g) => (
            <li key={g.group}>
              <S.FilterLabel $color={g.color}>
                <input
                  type="checkbox"
                  checked={!hidden.has(g.group)}
                  onChange={() => toggle(g.group)}
                />
                <L.Swatch $color={g.color} />
                <S.FilterName>{groupLabel(g.group)}</S.FilterName>
                <Muted $small>{g.topics.length}</Muted>
              </S.FilterLabel>
            </li>
          ))}
        </S.Filters>
        <S.FilterActions>
          <L.RdButton $variant="ghost" onClick={() => setHidden(new Set())}>
            All
          </L.RdButton>
          <L.RdButton
            $variant="ghost"
            onClick={() => setHidden(new Set(groups.map((g) => g.group)))}
          >
            None
          </L.RdButton>
        </S.FilterActions>
        <S.Check>
          <input
            type="checkbox"
            checked={lessonsOnly}
            onChange={(e) => setLessonsOnly(e.target.checked)}
          />{" "}
          only topics with a lesson
        </S.Check>
      </L.LearnCard>
      <L.LearnCard>
        <h4>Legend</h4>
        <S.Key>
          <li>
            <svg width="34" height="10" aria-hidden>
              <S.KeyEdge x1="2" y1="5" x2="32" y2="5" />
            </svg>
            learn first → unlocks
          </li>
          <li>
            <svg width="34" height="10" aria-hidden>
              <S.KeyEdge $related x1="2" y1="5" x2="32" y2="5" />
            </svg>
            related
          </li>
          <li>
            <svg width="34" height="18" aria-hidden>
              <S.KeyDot cx="9" cy="9" r="5" />
              <S.KeyDot cx="25" cy="9" r="8" />
            </svg>
            size = practice problems
          </li>
          <li>
            <svg width="34" height="18" aria-hidden>
              <S.KeyDot $lesson cx="17" cy="9" r="6" />
            </svg>
            ringed = has a lesson
          </li>
        </S.Key>
      </L.LearnCard>
    </S.Legend>
  );

  const details = sel ? (
    <S.Detail key={sel.id}>
      <S.DetailHead>
        <S.DetailIcon $color={pos.get(sel.id)?.color}>{topicIcon(sel)}</S.DetailIcon>
        <div>
          <S.GroupPill $color={pos.get(sel.id)?.color}>{groupLabel(groupOf(sel))}</S.GroupPill>
          <h3>{sel.name}</h3>
        </div>
      </S.DetailHead>
      <p>{sel.usage}</p>
      <L.Stats>
        <span>
          <b>{counts.get(sel.id)?.problems ?? 0}</b> problems
        </span>
        <span>
          <b>{counts.get(sel.id)?.refs ?? 0}</b> resources
        </span>
      </L.Stats>
      <S.DetailActions>
        {sel.has_lesson && (
          <L.RdButton as="a" $variant="primary" href={lessonHref(subject.id, sel.id)}>
            ▶ Open the lesson
          </L.RdButton>
        )}
        <L.RdButton as="a" $variant="ghost" href={topicPageHref(subject.id, sel.id)}>
          🧭 Topic page
        </L.RdButton>
      </S.DetailActions>
      <L.LearnCard>
        <h4>Learn first</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges.filter((e) => e.type === "prereq" && e.to === sel.id).map((e) => e.from)}
          topics={subject.topics}
          names={names}
        />
      </L.LearnCard>
      <L.LearnCard>
        <h4>Unlocks</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges.filter((e) => e.type === "prereq" && e.from === sel.id).map((e) => e.to)}
          topics={subject.topics}
          names={names}
        />
      </L.LearnCard>
      <L.LearnCard>
        <h4>Related</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges
            .filter((e) => e.type === "related" && (e.from === sel.id || e.to === sel.id))
            .map((e) => (e.from === sel.id ? e.to : e.from))}
          topics={subject.topics}
          names={names}
        />
      </L.LearnCard>
      <L.RdButton $variant="ghost" onClick={() => setSelected(null)}>
        ✕ Clear selection
      </L.RdButton>
    </S.Detail>
  ) : (
    <L.Stack>
      <L.LearnCard>
        <h4>Select a topic</h4>
        <MutedP $small>
          Click a node to see what it's for, what to learn first and what it unlocks. Hover to
          highlight its links.
        </MutedP>
      </L.LearnCard>
      {groups.map((g) => (
        <L.LearnCard key={g.group} $color={g.color}>
          <h4>
            <L.Swatch $color={g.color} /> {groupLabel(g.group)}
          </h4>
          <L.Stats>
            <span>
              <b>{g.topics.length}</b> topics
            </span>
            <span>
              <b>{g.topics.filter((t) => t.has_lesson).length}</b> lessons
            </span>
          </L.Stats>
        </L.LearnCard>
      ))}
    </L.Stack>
  );

  const nodeEl = (n: MapNode) => {
    const r = nodeRadius(n.problems);
    const deg = (n.angle * 180) / Math.PI;
    const flip = Math.cos(n.angle) < 0;
    const dim = focus !== null && n.id !== focus && !near?.has(n.id);
    return (
      <S.Node
        key={n.id}
        $color={n.color}
        $lesson={!!n.topic.has_lesson}
        $selected={n.id === selected}
        $dim={dim}
        transform={`translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`}
        onClick={() => setSelected(n.id === selected ? null : n.id)}
        onMouseEnter={() => setHover(n.id)}
        onMouseLeave={() => setHover(null)}
        role="button"
        tabIndex={0}
        aria-label={n.topic.name}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(n.id === selected ? null : n.id);
          }
        }}
      >
        <title>{`${n.topic.name} — ${n.problems} problems · ${n.refs} resources`}</title>
        <S.Halo r={r + 6} $color={n.color} />
        <S.Dot r={r} $color={n.color} $lesson={!!n.topic.has_lesson} />
        <text
          transform={`rotate(${flip ? deg + 180 : deg})`}
          x={flip ? -(r + 8) : r + 8}
          dy="0.35em"
          textAnchor={flip ? "end" : "start"}
        >
          {mapLabel(n.topic.name)}
        </text>
      </S.Node>
    );
  };

  const arc = (a0: number, a1: number, rr: number) => {
    const p = (a: number) =>
      `${(c + rr * Math.cos(a)).toFixed(1)},${(c + rr * Math.sin(a)).toFixed(1)}`;
    return `M${p(a0)} A${rr},${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
  };

  const graphView = (
    <S.MapBox onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
      {layout.nodes.length === 0 ? (
        <S.MapEmpty>No topic matches the filters.</S.MapEmpty>
      ) : (
        <S.MapSvg
          viewBox={`0 0 ${layout.size} ${layout.size}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Knowledge map of ${subject.title}`}
        >
          <defs>
            <marker
              id="lb-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <S.Arrow d="M0,0 L10,5 L0,10 z" />
            </marker>
          </defs>
          <S.RingCircle cx={c} cy={c} r={layout.radius} onClick={() => setSelected(null)} />
          {layout.arcs.map((a) => (
            <S.Arc key={a.group} d={arc(a.a0, a.a1, layout.radius - 22)} $color={a.color} />
          ))}
          <g>
            {edges.map((e) => {
              const a = pos.get(e.from)!;
              const b = pos.get(e.to)!;
              const on = focus !== null && (e.from === focus || e.to === focus);
              return (
                <S.Edge
                  key={`${e.type}:${e.from}:${e.to}`}
                  d={edgePath(a, b, c)}
                  $color={a.color}
                  $related={e.type === "related"}
                  $on={on}
                  $dim={!!focus && !on}
                  markerEnd={e.type === "prereq" ? "url(#lb-arrow)" : undefined}
                />
              );
            })}
          </g>
          <g>{layout.nodes.map(nodeEl)}</g>
        </S.MapSvg>
      )}
    </S.MapBox>
  );

  const gridView = (
    <L.LbCenter>
      {groups
        .filter((g) => !hidden.has(g.group))
        .map((g) => {
          const ts = g.topics.filter((t) => !lessonsOnly || t.has_lesson);
          if (ts.length === 0) return null;
          return (
            <section key={g.group}>
              <L.GroupTitle>
                <L.Dot $color={g.color} /> {groupLabel(g.group)}
                <Muted $small> {ts.length}</Muted>
              </L.GroupTitle>
              <L.Grid>
                {ts.map((t) => (
                  <L.TopicTile
                    key={t.id}
                    $planned={t.state === "planned"}
                    href={t.state === "planned" ? undefined : topicPageHref(subject.id, t.id)}
                    aria-disabled={t.state === "planned" || undefined}
                  >
                    <b>
                      {topicIcon(t)} {t.name}
                    </b>
                    <Muted $small>
                      {t.has_lesson ? "● lesson · " : ""}
                      {counts.get(t.id)?.problems ?? 0} problems · {counts.get(t.id)?.refs ?? 0}{" "}
                      resources
                    </Muted>
                    <L.Small>{t.usage}</L.Small>
                  </L.TopicTile>
                ))}
              </L.Grid>
            </section>
          );
        })}
    </L.LbCenter>
  );

  const nTopics = graph.nodes.filter((n) => n.type === "topic").length;
  const prereqs = allEdges.filter((e) => e.type === "prereq").length;
  const footer = (
    <L.Footer>
      <span>
        <b>{graph.nodes.length}</b> nodes ({nTopics} topics ·{" "}
        {graph.nodes.filter((n) => n.type === "problem").length} problems ·{" "}
        {graph.nodes.filter((n) => n.type === "ref").length} resources)
      </span>
      <span>
        <b>{graph.edges.length}</b> edges ({prereqs} prereq · {allEdges.length - prereqs} related)
      </span>
      {view === "graph" && (
        <Muted>
          showing {layout.nodes.length} topics · {edges.length} links
        </Muted>
      )}
    </L.Footer>
  );

  return (
    <Workbench
      id="map"
      header={header}
      tabs={
        <>
          {tab("graph", "🕸️", "Graph", tokens.pattern)}
          {tab("grid", "▦", "Grid", tokens.accent)}
        </>
      }
      left={{ title: "Legend & filters", icon: "🎛️", content: left, width: 260 }}
      right={{ title: sel ? "Topic" : "Details", icon: "🔎", content: details }}
      footer={footer}
      flush={view === "graph"}
    >
      {view === "graph" ? graphView : gridView}
    </Workbench>
  );
}
