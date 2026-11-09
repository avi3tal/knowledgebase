import { useContext, useMemo, useState } from "react";
import type { TopicPageData } from "../api";
import { SubjectContext } from "../context";
import { lessonHref, prevNext, topicNavGroups, topicPageHref } from "../learn-bench";
import { problemsHref } from "../practice-bench";
import { DESIGN_SUBJECTS, problemHref } from "../route";
import {
  PaneLoading,
  PrevNextFooter,
  TopicHeader,
  TopicLinks,
  usePrevNextKeys,
} from "./LearnBenchParts";
import { NeighbourhoodGraph } from "./NeighbourhoodGraph";
import { NavList } from "./panes";
import { CoTopics, TopicProblemList } from "./PracticeLinks";
import { ResourceList } from "./Resources";
import { Workbench } from "./Workbench";
import { Icon } from "./Icon";

type View = "overview" | "practice" | "resources";

/**
 * A topic in the Workbench: Overview | Practice | Resources. The Overview is never empty: without a
 * lesson it leads with where the topic shows up (problems by role, often-used-with topics,
 * resources); a planned topic says so and points at its neighbours.
 */
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
  const practiseHref = problemsHref(subj, { topic: topic.id, difficulty: "" });
  const state = data.state ?? (data.has_lesson ? "lesson" : "practice-only");
  const coTopics = data.co_topics ?? [];

  const tab = (v: View, label: string, colour: string, badge?: number) => (
    <button
      key={v}
      className={`wb-tab ${view === v ? "on" : ""}`}
      style={{ ["--tab-c" as string]: colour }}
      onClick={() => setView(v)}
      aria-pressed={view === v}
    >
      {label}
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
          <span>Topic</span>
          {data.subject_status === "locked" && <span>Lessons coming</span>}
        </>
      }
      action={
        data.has_lesson ? (
          <a className="btn primary" href={lessonHref(subj, topic.id)}>
            <Icon name="book" size={14} /> Open the lesson
          </a>
        ) : data.problems.length > 0 ? (
          <a className="btn primary" href={practiseHref}>
            <Icon name="play" size={13} /> Practise {data.problems.length} problems
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
          {data.problems.length > 0 && (
            <p className="lb-hero-actions">
              {data.has_lesson && (
                <a className="rd-btn primary" href={lessonHref(subj, topic.id)}>
                  ▶ Learn it
                </a>
              )}
              <a className={`rd-btn ${data.has_lesson ? "" : "primary"}`} href={practiseHref}>
                🧪 Practise {data.problems.length} problem{data.problems.length === 1 ? "" : "s"}
              </a>
            </p>
          )}
        </section>
        {state === "planned" && (
          <section className="rd-card lb-planned">
            <h2>Planned</h2>
            <p>
              No lesson, problem or resource uses this topic yet. Start from its neighbours below,
              or write the lesson in Claude Code:{" "}
              <code>
                /learn {subj} {topic.id}
              </code>
            </p>
            <TopicLinks
              subject={subj}
              ids={[...(topic.prereqs ?? []), ...(topic.related ?? [])]}
              topics={topics}
              names={names}
            />
          </section>
        )}
        {data.problems.length > 0 && (
          <section>
            <h2>Where it shows up</h2>
            <TopicProblemList
              subject={subj}
              problems={data.problems}
              names={names}
              roles={DESIGN_SUBJECTS.has(subj)}
            />
          </section>
        )}
        {coTopics.length > 0 && (
          <section>
            <h2>Often used with</h2>
            <p className="muted small">
              Topics that appear in the same problems: learn them together.
            </p>
            <CoTopics subject={subj} items={coTopics} names={names} />
          </section>
        )}
        {!data.has_lesson && data.resources.length > 0 && (
          <ResourceList items={data.resources.slice(0, 4)} title="Read about it" />
        )}
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
      leftCollapsed
      header={header}
      tabs={
        <>
          {tab("overview", "Overview", "var(--accent)")}
          {tab("practice", "Practice", "var(--ok)", data.problems.length)}
          {tab("resources", "Resources", "var(--rd-tech)", data.resources.length)}
        </>
      }
      left={{
        title: "Topics",
        icon: "🗂️",
        content: subject ? <NavList groups={nav} placeholder="Filter topics…" /> : <PaneLoading />,
      }}
      right={{ title: "Connections", icon: "🔗", content: right }}
      footer={<PrevNextFooter prev={pn.prev} next={pn.next} noun="topic" />}
    >
      <div className="lb-center lb-topic">{center}</div>
    </Workbench>
  );
}
