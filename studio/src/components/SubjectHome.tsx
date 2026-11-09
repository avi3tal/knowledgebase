import { useMemo, useState } from "react";
import type { Feedback, Subject } from "../api";
import { SUBJECT_ICON, groupLabel, groupTopics, topicIcon } from "../catalog";
import {
  bestHref,
  homeStats,
  lessonHref,
  suggestions,
  topicNavGroups,
  topicStateOf,
} from "../learn-bench";
import { Grow, Muted, MutedP } from "../theme/primitives";
import * as L from "./LearnBenchParts.style";
import { NavList } from "./panes";
import { PageHeader } from "./PageHeader";
import { Ring } from "./Ring";
import * as S from "./SubjectHome.style";
import { Workbench, WorkbenchTab } from "./Workbench";

const GROUP_KEY = (subject: string) => `kb.learn-home.${subject}.group`;

function readGroup(subject: string): string {
  try {
    return localStorage.getItem(GROUP_KEY(subject)) ?? "";
  } catch {
    return "";
  }
}

/** The Learn tab: every topic of a subject as a colourful card grid, one tab per topic group. */
export function SubjectHome({
  subject,
  feedback,
}: {
  subject: Subject;
  feedback: Feedback | null;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupTopics(subject.topics), [subject]);
  const [group, setGroupState] = useState(() => {
    const g = readGroup(subject.id);
    return groups.some((x) => x.group === g) ? g : "";
  });
  const setGroup = (g: string) => {
    setGroupState(g);
    try {
      localStorage.setItem(GROUP_KEY(subject.id), g);
    } catch {
      // private mode: not remembered
    }
  };
  const [lessonsOnly, setLessonsOnly] = useState(false);
  const fb = useMemo(() => new Map((feedback?.topics ?? []).map((t) => [t.id, t])), [feedback]);
  const nav = useMemo(
    () =>
      topicNavGroups(subject.topics, {
        href: (t) => bestHref(subject.id, t),
        badge: (t) => {
          const f = fb.get(t.id);
          return f && f.problems.length ? `${f.counts.solved}/${f.problems.length}` : undefined;
        },
      }),
    [subject, fb],
  );
  const stats = homeStats(subject.topics, feedback);
  const sugg = useMemo(() => suggestions(feedback, subject.topics), [feedback, subject]);
  const q = query.trim().toLowerCase();
  const visible = (t: Subject["topics"][number]) =>
    (!lessonsOnly || t.has_lesson) &&
    (!q ||
      t.name.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.usage.toLowerCase().includes(q));
  const locked = subject.status === "locked";
  const firstLesson = groups.flatMap((g) => g.topics).find((t) => t.has_lesson);
  const hrefOf = (id: string) => {
    const t = subject.topics.find((x) => x.id === id);
    return t ? bestHref(subject.id, t) : `#/topic/${subject.id}/${id}`;
  };
  let card = 0;

  const header = (
    <PageHeader
      icon={SUBJECT_ICON[subject.id] ?? "📘"}
      title={subject.title}
      meta={[
        <span>{stats.topics} topics</span>,
        <span>{stats.lessons} lessons</span>,
        stats.problems > 0 && (
          <span>
            {stats.solved}/{stats.problems} problems solved
          </span>
        ),
        locked && <span>Lessons coming · map and resources ready</span>,
      ]}
      actions={
        stats.problems > 0 ? (
          <L.HeroRing title={`${stats.solved} of ${stats.problems} problems solved`}>
            <Ring
              solved={stats.solved}
              failing={stats.failing}
              total={stats.problems}
              size={44}
              labelSize={13}
              label={`${Math.round((100 * stats.solved) / stats.problems)}%`}
            />
          </L.HeroRing>
        ) : undefined
      }
    />
  );

  const tabs = (
    <>
      <WorkbenchTab on={group === ""} onClick={() => setGroup("")} badge={subject.topics.length}>
        All
      </WorkbenchTab>
      {groups.map((g) => {
        const lessons = g.topics.filter((t) => t.has_lesson).length;
        const on = group === g.group;
        return (
          <WorkbenchTab
            key={g.group}
            on={on}
            done={lessons === g.topics.length}
            color={g.color}
            onClick={() => setGroup(g.group)}
            title={`${lessons} of ${g.topics.length} with a lesson`}
            badge={g.topics.length}
          >
            <L.TabLabel $color={on ? g.color : undefined}>
              <L.Swatch $color={g.color} /> {groupLabel(g.group)}
            </L.TabLabel>
          </WorkbenchTab>
        );
      })}
    </>
  );

  const sugList = (items: typeof sugg.next) => (
    <S.SuggList>
      {items.map((s, i) => {
        const t = subject.topics.find((x) => x.id === s.id);
        return (
          <S.SuggItem key={s.id} $i={i}>
            <S.SuggLink href={hrefOf(s.id)}>
              <S.SuggIcon>{t ? topicIcon(t) : "•"}</S.SuggIcon>
              <S.SuggName>{s.name}</S.SuggName>
              <S.SuggWhy $tone={s.tone}>{s.reason}</S.SuggWhy>
            </S.SuggLink>
          </S.SuggItem>
        );
      })}
    </S.SuggList>
  );

  const right = (
    <L.Stack>
      <L.LearnCard>
        <h4>⏭ Next up</h4>
        {!feedback && <MutedP $small>No progress data yet.</MutedP>}
        {feedback && sugg.next.length === 0 && (
          <MutedP $small>Nothing due and every lesson started. 🎉</MutedP>
        )}
        {sugList(sugg.next)}
      </L.LearnCard>
      <L.LearnCard>
        <h4>🩹 Weakest</h4>
        {sugg.weakest.length === 0 ? (
          <MutedP $small>No failing problems or weak quizzes yet.</MutedP>
        ) : (
          sugList(sugg.weakest)
        )}
      </L.LearnCard>
      <S.Quick>
        <h4>🚀 Quick start</h4>
        {sugg.next[0] ? (
          <L.RdButton as="a" $variant="primary" href={hrefOf(sugg.next[0].id)}>
            ▶ {sugg.next[0].tone === "due" ? "Review" : "Start"}: {sugg.next[0].name}
          </L.RdButton>
        ) : (
          firstLesson && (
            <L.RdButton as="a" $variant="primary" href={lessonHref(subject.id, firstLesson.id)}>
              ▶ Start: {firstLesson.name}
            </L.RdButton>
          )
        )}
        <L.RdButton as="a" $variant="ghost" href="#/sessions">
          🎯 Study sessions
        </L.RdButton>
        <MutedP $small>
          Plan a personalised session in Claude Code with <code>/session</code>, then run it from
          Sessions.
        </MutedP>
      </S.Quick>
    </L.Stack>
  );

  const footer = (
    <L.Footer>
      <span>
        <b>{stats.topics}</b> topics
      </span>
      <span>
        <b>{stats.lessons}</b> lessons
      </span>
      <span>
        <b>{stats.problems}</b> problems{stats.problems > 0 && ` · ${stats.solved} solved`}
      </span>
      {feedback && <Muted>today {feedback.today}</Muted>}
    </L.Footer>
  );

  const shownGroups = groups.filter((g) => !group || g.group === group);
  const due = feedback?.topics.filter((t) => t.review_due && t.review_due <= feedback.today) ?? [];

  return (
    <Workbench
      id="learn-home"
      header={header}
      tabs={tabs}
      left={{
        title: "Topics",
        icon: "🗂️",
        content: <NavList groups={nav} placeholder="Filter topics…" />,
      }}
      right={{ title: "Next up", icon: "🎯", content: right }}
      footer={footer}
    >
      <S.Home>
        {due.length > 0 && (
          <L.Callout $row>
            ⏰ Spaced review due:{" "}
            {due.map((t) => (
              <S.ChipLink key={t.id} href={hrefOf(t.id)}>
                {t.name}
              </S.ChipLink>
            ))}
          </L.Callout>
        )}
        <S.Toolbar>
          <S.Filter
            placeholder={`Filter ${subject.topics.length} topics…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {stats.lessons > 0 && (
            <S.LessonsOnly as="label">
              <input
                type="checkbox"
                checked={lessonsOnly}
                onChange={(e) => setLessonsOnly(e.target.checked)}
              />{" "}
              with lesson
            </S.LessonsOnly>
          )}
        </S.Toolbar>
        {shownGroups.every((g) => g.topics.filter(visible).length === 0) && (
          <MutedP>No topic matches.</MutedP>
        )}
        {shownGroups.map((g) => {
          const shown = g.topics.filter(visible);
          if (shown.length === 0) return null;
          return (
            <section key={g.group}>
              <L.GroupTitle>
                <L.Dot $color={g.color} /> {groupLabel(g.group)}
                <Muted $small> {shown.length}</Muted>
              </L.GroupTitle>
              <L.CardGrid $min={210}>
                {shown.map((t) => {
                  const f = fb.get(t.id);
                  const total = f?.problems.length ?? 0;
                  const state = topicStateOf(t);
                  return (
                    <L.TopicCard
                      key={t.id}
                      $color={g.color}
                      $i={card++}
                      $planned={state === "planned"}
                      href={state === "planned" ? undefined : bestHref(subject.id, t)}
                      aria-disabled={state === "planned" || undefined}
                      title={state === "planned" ? "Planned: no lesson or problem yet" : undefined}
                    >
                      <L.CardHead>
                        <L.CardIcon $color={g.color}>{topicIcon(t)}</L.CardIcon>
                        {t.order ? <L.CardOrder $color={g.color}>#{t.order}</L.CardOrder> : null}
                        <Grow />
                        {total > 0 && (
                          <Ring
                            solved={f?.counts.solved ?? 0}
                            failing={f?.counts.failing ?? 0}
                            total={total}
                          />
                        )}
                      </L.CardHead>
                      <L.CardName>{t.name}</L.CardName>
                      <L.CardUsage>{t.usage}</L.CardUsage>
                      <L.CardFoot>
                        {t.has_lesson ? (
                          <L.CardPill $kind="lesson" $color={g.color}>
                            ▶ lesson
                          </L.CardPill>
                        ) : state === "planned" ? (
                          <L.CardPill>planned</L.CardPill>
                        ) : (t.problems ?? total) > 0 ? (
                          <L.CardPill>🧪 practise · {t.problems ?? total} problems</L.CardPill>
                        ) : (
                          <L.CardPill>📚 reading</L.CardPill>
                        )}
                        {f?.review_due && feedback && f.review_due <= feedback.today && (
                          <L.CardPill $kind="due">review due</L.CardPill>
                        )}
                        {f?.quiz_accuracy != null && (
                          <L.CardPill>quiz {Math.round(f.quiz_accuracy * 100)}%</L.CardPill>
                        )}
                      </L.CardFoot>
                    </L.TopicCard>
                  );
                })}
              </L.CardGrid>
            </section>
          );
        })}
      </S.Home>
    </Workbench>
  );
}
