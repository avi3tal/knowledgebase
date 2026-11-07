import { useContext, useMemo, useState } from "react";
import type { TopicPageData } from "../api";
import { SubjectContext } from "../context";
import { lessonHref, prevNext, topicNavGroups, topicPageHref } from "../learn-bench";
import { problemHref } from "../route";
import {
  PaneLoading,
  PrevNextFooter,
  TopicHeader,
  TopicLinks,
  usePrevNextKeys,
} from "./LearnBenchParts";
import { NeighbourhoodGraph } from "./NeighbourhoodGraph";
import { NavList } from "./panes";
import { ResourceList } from "./Resources";
import { Workbench } from "./Workbench";

type View = "overview" | "practice" | "resources";

/** A topic in the Workbench: Overview (usage + neighbourhood) | Practice | Resources. */
export function TopicPage({ data }: { data: TopicPageData }) {
  const { subject: subj, topic, names } = data;
  const { subject } = useContext(SubjectContext);
  const topics = useMemo(() => subject?.topics ?? [], [subject]);
  const [view, setView] = useState<View>("overview");
  const catalogTopic = topics.find((t) => t.id === topic.id) ?? null;

  const nav = useMemo(
    () => topicNavGroups(topics, { current: topic.id, href: (t) => topicPageHref(subj, t.id) }),
    [topics, subj, topic.id],
  );
  const pn = prevNext(nav, topic.id);
  usePrevNextKeys(pn.prev?.href ?? null, pn.next?.href ?? null);

  const byDiff = (d: string) => data.problems.filter((p) => p.difficulty === d);
  const lessonCount = nav.flatMap((g) => g.items).filter((i) => !i.muted).length;

  const tab = (v: View, icon: string, label: string, colour: string, badge?: number) => (
    <button
      key={v}
      className={`wb-tab ${view === v ? "on" : ""}`}
      style={{ ["--tab-c" as string]: colour }}
      onClick={() => setView(v)}
      aria-pressed={view === v}
    >
      {icon} {label}
      {badge !== undefined && <span className="wb-tab-badge">{badge}</span>}
    </button>
  );

  const header = (
    <TopicHeader
      topic={catalogTopic ?? { ...topic, has_lesson: data.has_lesson }}
      fallbackTitle={topic.name}
      topics={topics}
      kicker={
        <>
          <span className="muted small">topic</span>
          {data.subject_status === "locked" && <span className="tag">🔒 locked subject</span>}
        </>
      }
      action={
        data.has_lesson ? (
          <a className="rd-btn primary big" href={lessonHref(subj, topic.id)}>
            ▶ Lesson<span className="rd-btn-sub">open the lesson</span>
          </a>
        ) : undefined
      }
    />
  );

  const right = (
    <div className="lb-right">
      <section className={`rd-card lb-card ${data.has_lesson ? "lb-has-lesson" : ""}`}>
        <h4>Lesson</h4>
        {data.has_lesson ? (
          <a className="rd-btn primary" href={lessonHref(subj, topic.id)}>
            ▶ Open the lesson →
          </a>
        ) : (
          <p className="muted small">
            No lesson yet. In Claude Code:{" "}
            <code>
              /learn {subj} {topic.id}
            </code>
          </p>
        )}
      </section>
      <section className="rd-card lb-card">
        <h4>Learn first</h4>
        <TopicLinks subject={subj} ids={topic.prereqs ?? []} topics={topics} names={names} />
      </section>
      <section className="rd-card lb-card">
        <h4>Related</h4>
        <TopicLinks subject={subj} ids={topic.related ?? []} topics={topics} names={names} />
      </section>
      <section className="rd-card lb-card">
        <h4>At a glance</h4>
        <div className="rd-practice-stats">
          <span>
            <b>{data.problems.length}</b> problems
          </span>
          <span>
            <b>{data.resources.length}</b> resources
          </span>
          <span>
            <b>{Math.max(0, data.graph.nodes.length - 1)}</b> neighbours
          </span>
        </div>
      </section>
    </div>
  );

  let center;
  if (view === "overview") {
    center = (
      <>
        <section className="lb-hero-card">
          <h2>What it's for</h2>
          <p className="lb-lead">{topic.usage}</p>
          {topic.samples.length > 0 && (
            <p className="muted">Classic problems: {topic.samples.join(" · ")}</p>
          )}
          {topic.ds.length > 0 && (
            <p className="muted small">Data structures: {topic.ds.join(", ")}</p>
          )}
        </section>
        {data.graph.center && (
          <section>
            <h2>Neighbourhood</h2>
            <NeighbourhoodGraph graph={data.graph} subject={subj} />
          </section>
        )}
      </>
    );
  } else if (view === "practice") {
    center =
      data.problems.length === 0 ? (
        <p className="muted">No problem uses this topic yet.</p>
      ) : (
        <section>
          <h2>Problems that use it</h2>
          {(["easy", "medium", "hard"] as const).map((d) =>
            byDiff(d).length === 0 ? null : (
              <div key={d} className={`lb-diff lb-diff-${d}`}>
                <h3>
                  <span className={`badge ${d}`}>{d}</span>{" "}
                  <span className="muted small">{byDiff(d).length}</span>
                </h3>
                <ul className="lb-problem-grid">
                  {byDiff(d).map((p, i) => (
                    <li key={p.slug} style={{ ["--i" as string]: i }}>
                      <a href={problemHref(subj, p.slug)}>{p.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </section>
      );
  } else {
    center =
      data.resources.length === 0 ? (
        <p className="muted">No curated resources for this topic yet.</p>
      ) : (
        <ResourceList items={data.resources} title="Resources" />
      );
  }

  return (
    <Workbench
      id="topic"
      header={header}
      tabs={
        <>
          {tab("overview", "🧭", "Overview", "var(--accent)")}
          {tab("practice", "🧪", "Practice", "var(--ok)", data.problems.length)}
          {tab("resources", "📚", "Resources", "var(--rd-tech)", data.resources.length)}
        </>
      }
      left={{
        title: "Topics",
        icon: "🗂️",
        content: subject ? <NavList groups={nav} placeholder="Filter topics…" /> : <PaneLoading />,
      }}
      right={{ title: "Connections", icon: "🔗", content: right }}
      footer={
        <PrevNextFooter
          subject={subj}
          prev={pn.prev}
          next={pn.next}
          index={pn.index}
          total={pn.total}
          noun="topic"
          extra={<span className="muted"> · {lessonCount} with a lesson</span>}
        />
      }
    >
      <div className="lb-center lb-topic">{center}</div>
    </Workbench>
  );
}
