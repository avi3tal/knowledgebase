import { useContext, useMemo, useRef, useState } from "react";
import type { Block, Lesson } from "../api";
import { SubjectContext } from "../context";
import type { SectionKey } from "../learn-bench";
import { stripLessonHead } from "../learn-bench";
import {
  blockId,
  lessonHref,
  lessonSections,
  lessonToc,
  prevNext,
  topicNavGroups,
  topicPageHref,
} from "../learn-bench";
import { designHref, problemHref } from "../route";
import { isTrace } from "../trace";
import { OnThisPage } from "./DesignReaderPanes";
import {
  PaneLoading,
  PrevNextFooter,
  TopicHeader,
  TopicLinks,
  usePrevNextKeys,
} from "./LearnBenchParts";
import { figureNumbering } from "../figures";
import { FigureView } from "./FigureView";
import { Markdown } from "./Markdown";
import { NavList, useCenterScroller } from "./panes";
import { ProblemCard } from "./ProblemCard";
import { Quiz } from "./Quiz";
import { ResourceList } from "./Resources";
import { TracePlayer } from "./TracePlayer";
import { Workbench, WorkbenchTab } from "./Workbench";
import { ErrorBoundary } from "./ErrorBoundary";
import { Icon } from "./Icon";
import { Button, MutedP } from "../theme/primitives";
import { t } from "../theme/theme";
import * as L from "./LearnBenchParts.style";
import * as S from "./LessonView.style";

const TAB_COLOUR: Record<SectionKey, string> = {
  learn: t.accent,
  quiz: t.pattern,
  practice: t.ok,
  resources: t.tech,
};

function LessonBlock({
  b,
  i,
  lesson,
  figureNumbers,
}: {
  b: Block;
  i: number;
  lesson: Lesson;
  figureNumbers: Map<string, number>;
}) {
  switch (b.type) {
    case "markdown":
      return (
        <Markdown
          text={i === firstMarkdown(lesson.blocks) ? stripLessonHead(b.text) : b.text}
          path={b.path}
          anchors
          fence={(lang, body) => {
            if (lang !== "figure") return undefined;
            const fig = b.figures?.[body];
            return fig ? (
              <ErrorBoundary label={`figure “${body}”`}>
                <FigureView figure={fig} number={figureNumbers.get(`${i}:${body}`)} />
              </ErrorBoundary>
            ) : (
              <S.ErrorText>Missing figure “{body}” — run ./kb learn validate.</S.ErrorText>
            );
          }}
        />
      );
    case "trace":
      return (
        <S.Block id={blockId(i)}>
          {isTrace(b.trace) ? (
            <TracePlayer trace={b.trace} />
          ) : (
            <S.ErrorText>
              Unsupported trace format — rebuild with <code>./kb learn build</code>.
            </S.ErrorText>
          )}
        </S.Block>
      );
    case "quiz":
      return (
        <S.Block id={blockId(i)}>
          <Quiz
            subject={lesson.subject}
            topic={lesson.topic}
            items={b.items}
            names={lesson.names}
          />
        </S.Block>
      );
    case "resources":
      return (
        <S.Block id={blockId(i)}>
          <ResourceList items={b.resources} />
        </S.Block>
      );
    case "problems":
      return (
        <S.Block as="section" id={blockId(i)}>
          <h2>Practice</h2>
          <MutedP>
            Easy → hard. Start an attempt, solve it in VS Code, then <code>./kb run</code> it. Each
            run feeds your progress.
          </MutedP>
          {b.problems.map((p) => (
            <ProblemCard key={p.slug} p={p} pattern={lesson.topic} />
          ))}
        </S.Block>
      );
    case "design-problems":
      return (
        <S.Block as="section" id={blockId(i)}>
          <h2>Practice in the design console</h2>
          <MutedP>
            Scope → estimates → API → versioned diagrams → deep dives → wrap-up, with live rubric
            checks and tips on demand.
          </MutedP>
          <L.CardGrid>
            {b.problems.map((p, k) => (
              <L.TopicCard key={p.slug} href={designHref(lesson.subject, p.slug)} $i={k}>
                <L.CardHead>
                  <L.CardIcon>{lesson.subject === "ood" ? "🧩" : "🏗️"}</L.CardIcon>
                  <L.Badge $difficulty={p.difficulty}>{p.difficulty}</L.Badge>
                </L.CardHead>
                <L.CardName>{p.title}</L.CardName>
                <L.CardFoot>
                  {p.minutes ? <L.CardPill>⏱ {p.minutes} min</L.CardPill> : null}
                  <L.CardPill $kind={p.attempts.length ? "lesson" : undefined}>
                    {p.attempts.length} attempt{p.attempts.length === 1 ? "" : "s"}
                  </L.CardPill>
                </L.CardFoot>
              </L.TopicCard>
            ))}
          </L.CardGrid>
        </S.Block>
      );
  }
}

/** A lesson in the Workbench: Learn | Quiz | Practice | Resources tabs, lessons list, TOC. */
const firstMarkdown = (blocks: Lesson["blocks"]) => blocks.findIndex((x) => x.type === "markdown");

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { subject } = useContext(SubjectContext);
  const topics = useMemo(() => subject?.topics ?? [], [subject]);
  const topic = topics.find((t) => t.id === lesson.topic) ?? null;
  const sections = useMemo(() => lessonSections(lesson.blocks), [lesson]);
  const figureNumbers = useMemo(() => figureNumbering(lesson.blocks), [lesson]);
  const [active, setActive] = useState<SectionKey>(sections[0]?.key ?? "learn");
  const tabbed = sections.length > 1;
  const current = sections.find((s) => s.key === active) ?? sections[0];
  const centerRef = useRef<HTMLDivElement>(null);
  const scroller = useCenterScroller(centerRef);

  const nav = useMemo(
    () =>
      topicNavGroups(topics, {
        current: lesson.topic,
        lessonsOnly: true,
        href: (t) => lessonHref(lesson.subject, t.id),
      }),
    [topics, lesson.subject, lesson.topic],
  );
  const pn = prevNext(nav, lesson.topic);
  usePrevNextKeys(pn.prev?.href ?? null, pn.next?.href ?? null);

  const toc = useMemo(
    () => lessonToc(lesson.blocks, tabbed ? current?.blocks : undefined),
    [lesson, tabbed, current],
  );

  const problems = lesson.blocks.flatMap((b) =>
    b.type === "problems" || b.type === "design-problems"
      ? b.problems.map((p) => ({
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          href: problemHref(lesson.subject, p.slug),
        }))
      : [],
  );

  const show = (key: SectionKey) => {
    setActive(key);
    scroller?.scrollTo({ top: 0 });
  };

  const tabs = tabbed ? (
    <>
      {sections.map((s) => (
        <WorkbenchTab
          key={s.key}
          on={active === s.key}
          color={TAB_COLOUR[s.key]}
          onClick={() => show(s.key)}
          badge={
            s.count > 0 ? (
              <span title={s.key === "learn" ? "visual traces" : undefined}>
                {s.key === "learn" ? `▶ ${s.count}` : s.count}
              </span>
            ) : undefined
          }
        >
          {s.label}
        </WorkbenchTab>
      ))}
    </>
  ) : undefined;

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      <S.SideCard>
        <h4>Learn first</h4>
        <TopicLinks
          subject={lesson.subject}
          ids={lesson.prereqs ?? []}
          topics={topics}
          names={lesson.names}
        />
      </S.SideCard>
      <S.SideCard>
        <h4>Related</h4>
        <TopicLinks
          subject={lesson.subject}
          ids={lesson.related ?? []}
          topics={topics}
          names={lesson.names}
        />
      </S.SideCard>
      {problems.length > 0 && (
        <S.SideCard>
          <h4>Practice problems</h4>
          <S.ProblemList>
            {problems.map((p) => (
              <li key={p.slug}>
                <L.Badge $difficulty={p.difficulty}>{p.difficulty}</L.Badge>
                <a href={p.href}>{p.title}</a>
              </li>
            ))}
          </S.ProblemList>
        </S.SideCard>
      )}
      <S.More href={topicPageHref(lesson.subject, lesson.topic)}>
        Topic page and neighbourhood →
      </S.More>
    </OnThisPage>
  );

  return (
    <Workbench
      id="lesson"
      leftCollapsed
      header={
        <TopicHeader
          topic={topic}
          fallbackTitle={lesson.title}
          topics={topics}
          kicker={<span>Lesson</span>}
        />
      }
      tabs={tabs}
      left={{
        title: "Lessons",
        icon: "📖",
        content: subject ? (
          <NavList groups={nav} placeholder="Filter lessons…" emptyText="No lessons yet." />
        ) : (
          <PaneLoading />
        ),
      }}
      right={{ title: "On this page", icon: "🧭", content: right }}
      footer={<PrevNextFooter prev={pn.prev} next={pn.next} noun="lesson" />}
    >
      <L.LbCenter ref={centerRef}>
        <S.Article>
          {sections.map((s) => (
            <S.Section key={s.key} hidden={tabbed && s.key !== current?.key}>
              {s.blocks.map((i) => (
                <LessonBlock
                  key={i}
                  b={lesson.blocks[i]!}
                  i={i}
                  lesson={lesson}
                  figureNumbers={figureNumbers}
                />
              ))}
            </S.Section>
          ))}
        </S.Article>
        {tabbed && current && (
          <S.NextSection>
            {sections
              .slice(sections.indexOf(current) + 1, sections.indexOf(current) + 2)
              .map((s) => (
                <Button key={s.key} $variant="primary" onClick={() => show(s.key)}>
                  Next: {s.label} <Icon name="arrowRight" size={14} />
                </Button>
              ))}
          </S.NextSection>
        )}
      </L.LbCenter>
    </Workbench>
  );
}
