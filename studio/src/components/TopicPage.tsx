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
import { Workbench, WorkbenchTab } from "./Workbench";
import { Icon } from "./Icon";
import { Button, Muted, MutedP, difficultyColor } from "../theme/primitives";
import { t as tokens } from "../theme/theme";
import * as L from "./LearnBenchParts.style";
import * as S from "./TopicPage.style";

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
    <WorkbenchTab key={v} on={view === v} color={colour} onClick={() => setView(v)} badge={badge}>
      {label}
    </WorkbenchTab>
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
          <Button as="a" $variant="primary" href={lessonHref(subj, topic.id)}>
            <Icon name="book" size={14} /> Open the lesson
          </Button>
        ) : data.problems.length > 0 ? (
          <Button as="a" $variant="primary" href={practiseHref}>
            <Icon name="play" size={13} /> Practise {data.problems.length} problems
          </Button>
        ) : undefined
      }
    />
  );

  const right = (
    <L.Stack>
      <L.LearnCard>
        <h4>Lesson</h4>
        {data.has_lesson ? (
          <L.RdButton as="a" $variant="primary" href={lessonHref(subj, topic.id)}>
            ▶ Open the lesson →
          </L.RdButton>
        ) : (
          <MutedP $small>
            No lesson yet. In Claude Code:{" "}
            <code>
              /learn {subj} {topic.id}
            </code>
          </MutedP>
        )}
      </L.LearnCard>
      <L.LearnCard>
        <h4>Learn first</h4>
        <TopicLinks subject={subj} ids={topic.prereqs ?? []} topics={topics} names={names} />
      </L.LearnCard>
      <L.LearnCard>
        <h4>Related</h4>
        <TopicLinks subject={subj} ids={topic.related ?? []} topics={topics} names={names} />
      </L.LearnCard>
      <L.LearnCard>
        <h4>At a glance</h4>
        <L.Stats>
          <span>
            <b>{data.problems.length}</b> problems
          </span>
          <span>
            <b>{data.resources.length}</b> resources
          </span>
          <span>
            <b>{Math.max(0, data.graph.nodes.length - 1)}</b> neighbours
          </span>
        </L.Stats>
      </L.LearnCard>
    </L.Stack>
  );

  let center;
  if (view === "overview") {
    center = (
      <>
        <S.HeroCard>
          <h2>What it's for</h2>
          <S.Lead>{topic.usage}</S.Lead>
          {topic.samples.length > 0 && (
            <MutedP>Classic problems: {topic.samples.join(" · ")}</MutedP>
          )}
          {topic.ds.length > 0 && <MutedP $small>Data structures: {topic.ds.join(", ")}</MutedP>}
          {data.problems.length > 0 && (
            <S.HeroActions>
              {data.has_lesson && (
                <L.RdButton as="a" $variant="primary" href={lessonHref(subj, topic.id)}>
                  ▶ Learn it
                </L.RdButton>
              )}
              <L.RdButton
                as="a"
                $variant={data.has_lesson ? "default" : "primary"}
                href={practiseHref}
              >
                🧪 Practise {data.problems.length} problem{data.problems.length === 1 ? "" : "s"}
              </L.RdButton>
            </S.HeroActions>
          )}
        </S.HeroCard>
        {state === "planned" && (
          <S.Planned>
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
          </S.Planned>
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
            <MutedP $small>Topics that appear in the same problems: learn them together.</MutedP>
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
        <MutedP>No problem uses this topic yet.</MutedP>
      ) : (
        <section>
          <h2>Problems that use it</h2>
          {(["easy", "medium", "hard"] as const).map((d) =>
            byDiff(d).length === 0 ? null : (
              <S.Diff key={d}>
                <h3>
                  <L.Badge $difficulty={d}>{d}</L.Badge> <Muted $small>{byDiff(d).length}</Muted>
                </h3>
                <S.ProblemGrid>
                  {byDiff(d).map((p, i) => (
                    <S.ProblemItem key={p.slug} $i={i}>
                      <S.ProblemLink $color={difficultyColor(d)} href={problemHref(subj, p.slug)}>
                        {p.title}
                      </S.ProblemLink>
                    </S.ProblemItem>
                  ))}
                </S.ProblemGrid>
              </S.Diff>
            ),
          )}
        </section>
      );
  } else {
    center =
      data.resources.length === 0 ? (
        <MutedP>No curated resources for this topic yet.</MutedP>
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
          {tab("overview", "Overview", tokens.accent)}
          {tab("practice", "Practice", tokens.ok, data.problems.length)}
          {tab("resources", "Resources", tokens.tech, data.resources.length)}
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
      <L.LbCenter>{center}</L.LbCenter>
    </Workbench>
  );
}
