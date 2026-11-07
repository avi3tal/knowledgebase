import { useMemo, useState } from "react";
import type { Feedback, Subject } from "../api";
import { SUBJECT_ICON, groupLabel, groupTopics, topicIcon } from "../catalog";
import { bestHref, homeStats, lessonHref, suggestions, topicNavGroups } from "../learn-bench";
import { NavList } from "./panes";
import { Ring } from "./Ring";
import { Workbench } from "./Workbench";

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
    <div className="rd-header lb-header">
      <div className="rd-icon">{SUBJECT_ICON[subject.id] ?? "📘"}</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          <span className="lb-group-pill">Learn</span>
          {locked && <span className="muted small">🔒 lessons coming · map & resources ready</span>}
        </div>
        <h1>{subject.title}</h1>
        <div className="lb-stats">
          <span>
            <b>{stats.topics}</b> topics
          </span>
          <span>
            <b>{stats.lessons}</b> lessons
          </span>
          {stats.problems > 0 && (
            <span>
              <b>
                {stats.solved}/{stats.problems}
              </b>{" "}
              problems solved
            </span>
          )}
        </div>
      </div>
      <div className="lb-hero-ring" title={`${stats.solved} of ${stats.problems} problems solved`}>
        <Ring
          solved={stats.solved}
          failing={stats.failing}
          total={stats.problems}
          size={58}
          label={
            stats.problems ? `${Math.round((100 * stats.solved) / stats.problems)}%` : undefined
          }
        />
      </div>
    </div>
  );

  const tabs = (
    <>
      <button
        className={`wb-tab ${group === "" ? "on" : ""}`}
        onClick={() => setGroup("")}
        aria-pressed={group === ""}
      >
        ✨ All <span className="wb-tab-badge">{subject.topics.length}</span>
      </button>
      {groups.map((g) => {
        const lessons = g.topics.filter((t) => t.has_lesson).length;
        return (
          <button
            key={g.group}
            className={`wb-tab lb-tab ${group === g.group ? "on" : ""} ${lessons === g.topics.length ? "done" : ""}`}
            style={{ ["--tab-c" as string]: g.color, ["--c" as string]: g.color }}
            onClick={() => setGroup(g.group)}
            aria-pressed={group === g.group}
            title={`${lessons} of ${g.topics.length} with a lesson`}
          >
            <span className="lb-swatch" /> {groupLabel(g.group)}
            <span className="wb-tab-badge">{g.topics.length}</span>
          </button>
        );
      })}
    </>
  );

  const sugList = (items: typeof sugg.next) => (
    <ul className="lb-sugg">
      {items.map((s, i) => {
        const t = subject.topics.find((x) => x.id === s.id);
        return (
          <li key={s.id} style={{ ["--i" as string]: i }}>
            <a href={hrefOf(s.id)}>
              <span className="lb-sugg-icon">{t ? topicIcon(t) : "•"}</span>
              <span className="lb-sugg-name">{s.name}</span>
              <span className={`lb-sugg-why ${s.tone}`}>{s.reason}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  const right = (
    <div className="lb-right">
      <section className="rd-card lb-card">
        <h4>⏭ Next up</h4>
        {!feedback && <p className="muted small">No progress data yet.</p>}
        {feedback && sugg.next.length === 0 && (
          <p className="muted small">Nothing due and every lesson started. 🎉</p>
        )}
        {sugList(sugg.next)}
      </section>
      <section className="rd-card lb-card">
        <h4>🩹 Weakest</h4>
        {sugg.weakest.length === 0 ? (
          <p className="muted small">No failing problems or weak quizzes yet.</p>
        ) : (
          sugList(sugg.weakest)
        )}
      </section>
      <section className="rd-card lb-card lb-quick">
        <h4>🚀 Quick start</h4>
        {sugg.next[0] ? (
          <a className="rd-btn primary" href={hrefOf(sugg.next[0].id)}>
            ▶ {sugg.next[0].tone === "due" ? "Review" : "Start"}: {sugg.next[0].name}
          </a>
        ) : (
          firstLesson && (
            <a className="rd-btn primary" href={lessonHref(subject.id, firstLesson.id)}>
              ▶ Start: {firstLesson.name}
            </a>
          )
        )}
        <a className="rd-btn ghost" href="#/sessions">
          🎯 Study sessions
        </a>
        <p className="muted small">
          Plan a personalised session in Claude Code with <code>/session</code>, then run it from
          Sessions.
        </p>
      </section>
    </div>
  );

  const footer = (
    <div className="lb-footer">
      <span>
        <b>{stats.topics}</b> topics
      </span>
      <span>
        <b>{stats.lessons}</b> lessons
      </span>
      <span>
        <b>{stats.problems}</b> problems{stats.problems > 0 && ` · ${stats.solved} solved`}
      </span>
      {feedback && <span className="muted">today {feedback.today}</span>}
    </div>
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
      <div className="home lb-home">
        {due.length > 0 && (
          <div className="callout due">
            ⏰ Spaced review due:{" "}
            {due.map((t) => (
              <a key={t.id} className="chip-link" href={hrefOf(t.id)}>
                {t.name}
              </a>
            ))}
          </div>
        )}
        <div className="toolbar">
          <input
            className="filter"
            placeholder={`Filter ${subject.topics.length} topics…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {stats.lessons > 0 && (
            <label className="pill check">
              <input
                type="checkbox"
                checked={lessonsOnly}
                onChange={(e) => setLessonsOnly(e.target.checked)}
              />{" "}
              with lesson
            </label>
          )}
        </div>
        {shownGroups.every((g) => g.topics.filter(visible).length === 0) && (
          <p className="muted">No topic matches.</p>
        )}
        {shownGroups.map((g) => {
          const shown = g.topics.filter(visible);
          if (shown.length === 0) return null;
          return (
            <section key={g.group} className="group" style={{ ["--c" as string]: g.color }}>
              <h2 className="group-title">
                <span className="swatch" /> {groupLabel(g.group)}
                <span className="muted small"> {shown.length}</span>
              </h2>
              <div className="cards">
                {shown.map((t) => {
                  const f = fb.get(t.id);
                  const total = f?.problems.length ?? 0;
                  return (
                    <a
                      key={t.id}
                      className={`topic-card ${t.has_lesson ? "has-lesson" : ""}`}
                      href={bestHref(subject.id, t)}
                      style={{ ["--i" as string]: card++ }}
                    >
                      <div className="tc-head">
                        <span className="tc-icon">{topicIcon(t)}</span>
                        {t.order ? <span className="tc-order">#{t.order}</span> : null}
                        <span className="grow" />
                        {total > 0 && (
                          <Ring
                            solved={f?.counts.solved ?? 0}
                            failing={f?.counts.failing ?? 0}
                            total={total}
                          />
                        )}
                      </div>
                      <div className="tc-name">{t.name}</div>
                      <div className="tc-usage">{t.usage}</div>
                      <div className="tc-foot">
                        {t.has_lesson ? (
                          <span className="tc-pill lesson">▶ lesson</span>
                        ) : (
                          <span className="tc-pill">topic page</span>
                        )}
                        {f?.review_due && feedback && f.review_due <= feedback.today && (
                          <span className="tc-pill due">review due</span>
                        )}
                        {f?.quiz_accuracy != null && (
                          <span className="tc-pill">quiz {Math.round(f.quiz_accuracy * 100)}%</span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Workbench>
  );
}
