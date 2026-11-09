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
import { Workbench } from "./Workbench";
import { ErrorBoundary } from "./ErrorBoundary";
import { Icon } from "./Icon";

const TAB_COLOUR: Record<SectionKey, string> = {
  learn: "var(--accent)",
  quiz: "var(--rd-pattern)",
  practice: "var(--ok)",
  resources: "var(--rd-tech)",
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
              <p className="why wrong">Missing figure “{body}” — run ./kb learn validate.</p>
            );
          }}
        />
      );
    case "trace":
      return (
        <div id={blockId(i)} className="lb-block">
          {isTrace(b.trace) ? (
            <TracePlayer trace={b.trace} />
          ) : (
            <p className="why wrong">
              Unsupported trace format — rebuild with <code>./kb learn build</code>.
            </p>
          )}
        </div>
      );
    case "quiz":
      return (
        <div id={blockId(i)} className="lb-block">
          <Quiz
            subject={lesson.subject}
            topic={lesson.topic}
            items={b.items}
            names={lesson.names}
          />
        </div>
      );
    case "resources":
      return (
        <div id={blockId(i)} className="lb-block">
          <ResourceList items={b.resources} />
        </div>
      );
    case "problems":
      return (
        <section id={blockId(i)} className="lb-block">
          <h2>Practice</h2>
          <p className="muted">
            Easy → hard. Start an attempt, solve it in VS Code, then <code>./kb run</code> it. Each
            run feeds your progress.
          </p>
          {b.problems.map((p) => (
            <ProblemCard key={p.slug} p={p} pattern={lesson.topic} />
          ))}
        </section>
      );
    case "design-problems":
      return (
        <section id={blockId(i)} className="lb-block">
          <h2>Practice in the design console</h2>
          <p className="muted">
            Scope → estimates → API → versioned diagrams → deep dives → wrap-up, with live rubric
            checks and tips on demand.
          </p>
          <div className="cards design-cards">
            {b.problems.map((p, k) => (
              <a
                key={p.slug}
                className="topic-card design-card"
                href={designHref(lesson.subject, p.slug)}
                style={{ ["--i" as string]: k }}
              >
                <div className="tc-head">
                  <span className="tc-icon">{lesson.subject === "ood" ? "🧩" : "🏗️"}</span>
                  <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
                </div>
                <div className="tc-name">{p.title}</div>
                <div className="tc-foot">
                  {p.minutes ? <span className="tc-pill">⏱ {p.minutes} min</span> : null}
                  <span className={`tc-pill ${p.attempts.length ? "lesson" : ""}`}>
                    {p.attempts.length} attempt{p.attempts.length === 1 ? "" : "s"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
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
        <button
          key={s.key}
          className={`wb-tab ${active === s.key ? "on" : ""}`}
          style={{ ["--tab-c" as string]: TAB_COLOUR[s.key] }}
          onClick={() => show(s.key)}
          aria-pressed={active === s.key}
        >
          {s.label}
          {s.count > 0 && (
            <span className="wb-tab-badge" title={s.key === "learn" ? "visual traces" : undefined}>
              {s.key === "learn" ? `▶ ${s.count}` : s.count}
            </span>
          )}
        </button>
      ))}
    </>
  ) : undefined;

  const right = (
    <OnThisPage toc={toc} scroller={scroller}>
      <section className="rd-card lb-card">
        <h4>Learn first</h4>
        <TopicLinks
          subject={lesson.subject}
          ids={lesson.prereqs ?? []}
          topics={topics}
          names={lesson.names}
        />
      </section>
      <section className="rd-card lb-card">
        <h4>Related</h4>
        <TopicLinks
          subject={lesson.subject}
          ids={lesson.related ?? []}
          topics={topics}
          names={lesson.names}
        />
      </section>
      {problems.length > 0 && (
        <section className="rd-card lb-card">
          <h4>Practice problems</h4>
          <ul className="lb-problems">
            {problems.map((p) => (
              <li key={p.slug}>
                <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
                <a href={p.href}>{p.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <a className="small lb-more" href={topicPageHref(lesson.subject, lesson.topic)}>
        Topic page and neighbourhood →
      </a>
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
      <div className="lb-center" ref={centerRef}>
        <article className="lesson lb-lesson">
          {sections.map((s) => (
            <div
              key={s.key}
              className={`lb-section lb-section-${s.key}`}
              hidden={tabbed && s.key !== current?.key}
            >
              {s.blocks.map((i) => (
                <LessonBlock
                  key={i}
                  b={lesson.blocks[i]!}
                  i={i}
                  lesson={lesson}
                  figureNumbers={figureNumbers}
                />
              ))}
            </div>
          ))}
        </article>
        {tabbed && current && (
          <div className="lb-next-section">
            {sections
              .slice(sections.indexOf(current) + 1, sections.indexOf(current) + 2)
              .map((s) => (
                <button key={s.key} className="btn primary" onClick={() => show(s.key)}>
                  Next: {s.label} <Icon name="arrowRight" size={14} />
                </button>
              ))}
          </div>
        )}
      </div>
    </Workbench>
  );
}
