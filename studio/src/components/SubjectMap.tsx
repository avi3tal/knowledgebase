import { useMemo, useState } from "react";
import type { Graph, Subject } from "../api";
import { SUBJECT_ICON, groupLabel, groupOf, groupTopics, topicIcon } from "../catalog";
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
import { Workbench } from "./Workbench";

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
    <div className="rd-header lb-header">
      <div className="rd-icon">🗺️</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          <span className="lb-group-pill">
            {SUBJECT_ICON[subject.id] ?? "📘"} {subject.title}
          </span>
          {subject.status === "locked" && <span className="tag">🔒 locked — lessons coming</span>}
        </div>
        <h1>Knowledge map</h1>
        <p className="lb-usage">
          Every topic with its prerequisites, related topics, practice problems and resources. Click
          a topic for details.
        </p>
      </div>
    </div>
  );

  const tab = (v: View, icon: string, label: string, colour: string) => (
    <button
      className={`wb-tab ${view === v ? "on" : ""}`}
      style={{ ["--tab-c" as string]: colour }}
      onClick={() => setView(v)}
      aria-pressed={view === v}
    >
      {icon} {label}
    </button>
  );

  const left = (
    <div className="lb-legend">
      <section className="rd-card lb-card">
        <h4>Groups</h4>
        <ul className="lb-filters">
          {groups.map((g) => (
            <li key={g.group}>
              <label style={{ ["--c" as string]: g.color }}>
                <input
                  type="checkbox"
                  checked={!hidden.has(g.group)}
                  onChange={() => toggle(g.group)}
                />
                <span className="lb-swatch" />
                <span className="lb-filter-name">{groupLabel(g.group)}</span>
                <span className="muted small">{g.topics.length}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="lb-filter-actions">
          <button className="rd-btn ghost" onClick={() => setHidden(new Set())}>
            All
          </button>
          <button
            className="rd-btn ghost"
            onClick={() => setHidden(new Set(groups.map((g) => g.group)))}
          >
            None
          </button>
        </div>
        <label className="lb-check">
          <input
            type="checkbox"
            checked={lessonsOnly}
            onChange={(e) => setLessonsOnly(e.target.checked)}
          />{" "}
          only topics with a lesson
        </label>
      </section>
      <section className="rd-card lb-card">
        <h4>Legend</h4>
        <ul className="lb-key">
          <li>
            <svg width="34" height="10" aria-hidden>
              <line className="lb-edge prereq" x1="2" y1="5" x2="32" y2="5" />
            </svg>
            learn first → unlocks
          </li>
          <li>
            <svg width="34" height="10" aria-hidden>
              <line className="lb-edge related" x1="2" y1="5" x2="32" y2="5" />
            </svg>
            related
          </li>
          <li>
            <svg width="34" height="18" aria-hidden>
              <circle cx="9" cy="9" r="5" className="lb-key-dot" />
              <circle cx="25" cy="9" r="8" className="lb-key-dot" />
            </svg>
            size = practice problems
          </li>
          <li>
            <svg width="34" height="18" aria-hidden>
              <circle cx="17" cy="9" r="6" className="lb-key-dot lesson" />
            </svg>
            ringed = has a lesson
          </li>
        </ul>
      </section>
    </div>
  );

  const details = sel ? (
    <div className="lb-right lb-detail" key={sel.id}>
      <div className="lb-detail-head" style={{ ["--c" as string]: pos.get(sel.id)?.color }}>
        <span className="lb-detail-icon">{topicIcon(sel)}</span>
        <div>
          <span className="lb-group-pill">{groupLabel(groupOf(sel))}</span>
          <h3>{sel.name}</h3>
        </div>
      </div>
      <p>{sel.usage}</p>
      <div className="rd-practice-stats">
        <span>
          <b>{counts.get(sel.id)?.problems ?? 0}</b> problems
        </span>
        <span>
          <b>{counts.get(sel.id)?.refs ?? 0}</b> resources
        </span>
      </div>
      <div className="lb-detail-actions">
        {sel.has_lesson && (
          <a className="rd-btn primary" href={lessonHref(subject.id, sel.id)}>
            ▶ Open the lesson
          </a>
        )}
        <a className="rd-btn ghost" href={topicPageHref(subject.id, sel.id)}>
          🧭 Topic page
        </a>
      </div>
      <section className="rd-card lb-card">
        <h4>Learn first</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges.filter((e) => e.type === "prereq" && e.to === sel.id).map((e) => e.from)}
          topics={subject.topics}
          names={names}
        />
      </section>
      <section className="rd-card lb-card">
        <h4>Unlocks</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges.filter((e) => e.type === "prereq" && e.from === sel.id).map((e) => e.to)}
          topics={subject.topics}
          names={names}
        />
      </section>
      <section className="rd-card lb-card">
        <h4>Related</h4>
        <TopicLinks
          subject={subject.id}
          ids={allEdges
            .filter((e) => e.type === "related" && (e.from === sel.id || e.to === sel.id))
            .map((e) => (e.from === sel.id ? e.to : e.from))}
          topics={subject.topics}
          names={names}
        />
      </section>
      <button className="rd-btn ghost" onClick={() => setSelected(null)}>
        ✕ Clear selection
      </button>
    </div>
  ) : (
    <div className="lb-right">
      <section className="rd-card lb-card">
        <h4>Select a topic</h4>
        <p className="muted small">
          Click a node to see what it's for, what to learn first and what it unlocks. Hover to
          highlight its links.
        </p>
      </section>
      {groups.map((g) => (
        <section key={g.group} className="rd-card lb-card" style={{ ["--c" as string]: g.color }}>
          <h4>
            <span className="lb-swatch" /> {groupLabel(g.group)}
          </h4>
          <div className="rd-practice-stats">
            <span>
              <b>{g.topics.length}</b> topics
            </span>
            <span>
              <b>{g.topics.filter((t) => t.has_lesson).length}</b> lessons
            </span>
          </div>
        </section>
      ))}
    </div>
  );

  const nodeEl = (n: MapNode) => {
    const r = nodeRadius(n.problems);
    const deg = (n.angle * 180) / Math.PI;
    const flip = Math.cos(n.angle) < 0;
    const dim = focus !== null && n.id !== focus && !near?.has(n.id);
    return (
      <g
        key={n.id}
        className={`lb-node ${n.topic.has_lesson ? "lesson" : ""} ${n.id === selected ? "selected" : ""} ${dim ? "dim" : ""}`}
        style={{ ["--c" as string]: n.color }}
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
        <circle r={r + 6} className="lb-node-halo" />
        <circle r={r} className="lb-node-dot" />
        <text
          transform={`rotate(${flip ? deg + 180 : deg})`}
          x={flip ? -(r + 8) : r + 8}
          dy="0.35em"
          textAnchor={flip ? "end" : "start"}
        >
          {mapLabel(n.topic.name)}
        </text>
      </g>
    );
  };

  const arc = (a0: number, a1: number, rr: number) => {
    const p = (a: number) =>
      `${(c + rr * Math.cos(a)).toFixed(1)},${(c + rr * Math.sin(a)).toFixed(1)}`;
    return `M${p(a0)} A${rr},${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
  };

  const graphView = (
    <div className="lb-map" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
      {layout.nodes.length === 0 ? (
        <p className="muted lb-map-empty">No topic matches the filters.</p>
      ) : (
        <svg
          className="lb-map-svg"
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
              <path d="M0,0 L10,5 L0,10 z" className="lb-arrow" />
            </marker>
          </defs>
          <circle
            cx={c}
            cy={c}
            r={layout.radius}
            className="lb-ring"
            onClick={() => setSelected(null)}
          />
          {layout.arcs.map((a) => (
            <path
              key={a.group}
              d={arc(a.a0, a.a1, layout.radius - 22)}
              className="lb-arc"
              style={{ ["--c" as string]: a.color }}
            />
          ))}
          <g className="lb-edges">
            {edges.map((e) => {
              const a = pos.get(e.from)!;
              const b = pos.get(e.to)!;
              const on = focus !== null && (e.from === focus || e.to === focus);
              return (
                <path
                  key={`${e.type}:${e.from}:${e.to}`}
                  d={edgePath(a, b, c)}
                  className={`lb-edge ${e.type} ${on ? "on" : ""} ${focus && !on ? "dim" : ""}`}
                  style={{ ["--c" as string]: a.color }}
                  markerEnd={e.type === "prereq" ? "url(#lb-arrow)" : undefined}
                />
              );
            })}
          </g>
          <g className="lb-nodes">{layout.nodes.map(nodeEl)}</g>
        </svg>
      )}
    </div>
  );

  const gridView = (
    <div className="lb-center">
      {groups
        .filter((g) => !hidden.has(g.group))
        .map((g) => {
          const ts = g.topics.filter((t) => !lessonsOnly || t.has_lesson);
          if (ts.length === 0) return null;
          return (
            <section key={g.group} className="group" style={{ ["--c" as string]: g.color }}>
              <h2 className="group-title">
                <span className="swatch" /> {groupLabel(g.group)}
                <span className="muted small"> {ts.length}</span>
              </h2>
              <div className="grid">
                {ts.map((t) => (
                  <a
                    key={t.id}
                    className={`tile topic-tile ${t.state === "planned" ? "planned" : ""}`}
                    href={t.state === "planned" ? undefined : topicPageHref(subject.id, t.id)}
                    aria-disabled={t.state === "planned" || undefined}
                  >
                    <b>
                      {topicIcon(t)} {t.name}
                    </b>
                    <span className="muted small">
                      {t.has_lesson ? "● lesson · " : ""}
                      {counts.get(t.id)?.problems ?? 0} problems · {counts.get(t.id)?.refs ?? 0}{" "}
                      resources
                    </span>
                    <span className="small">{t.usage}</span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );

  const nTopics = graph.nodes.filter((n) => n.type === "topic").length;
  const prereqs = allEdges.filter((e) => e.type === "prereq").length;
  const footer = (
    <div className="lb-footer">
      <span>
        <b>{graph.nodes.length}</b> nodes ({nTopics} topics ·{" "}
        {graph.nodes.filter((n) => n.type === "problem").length} problems ·{" "}
        {graph.nodes.filter((n) => n.type === "ref").length} resources)
      </span>
      <span>
        <b>{graph.edges.length}</b> edges ({prereqs} prereq · {allEdges.length - prereqs} related)
      </span>
      {view === "graph" && (
        <span className="muted">
          showing {layout.nodes.length} topics · {edges.length} links
        </span>
      )}
    </div>
  );

  return (
    <Workbench
      id="map"
      header={header}
      tabs={
        <>
          {tab("graph", "🕸️", "Graph", "var(--rd-pattern)")}
          {tab("grid", "▦", "Grid", "var(--accent)")}
        </>
      }
      left={{ title: "Legend & filters", icon: "🎛️", content: left, width: 260 }}
      right={{ title: sel ? "Topic" : "Details", icon: "🔎", content: details }}
      footer={footer}
      centerClass={view === "graph" ? "flush" : ""}
    >
      {view === "graph" ? graphView : gridView}
    </Workbench>
  );
}
