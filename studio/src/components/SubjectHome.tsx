import { useMemo, useState } from "react";
import type { Feedback, Subject } from "../api";
import { SUBJECT_ICON, groupLabel, groupTopics, topicIcon } from "../catalog";
import { Ring } from "./Ring";

/** The Learn tab: every topic of a subject as a colourful, filterable card grid. */
export function SubjectHome({
  subject,
  feedback,
}: {
  subject: Subject;
  feedback: Feedback | null;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [lessonsOnly, setLessonsOnly] = useState(false);
  const groups = useMemo(() => groupTopics(subject.topics), [subject]);
  const fb = new Map((feedback?.topics ?? []).map((t) => [t.id, t]));
  const q = query.trim().toLowerCase();
  const visible = (t: Subject["topics"][number]) =>
    (!lessonsOnly || t.has_lesson) &&
    (!q ||
      t.name.toLowerCase().includes(q) ||
      t.id.includes(q) ||
      t.usage.toLowerCase().includes(q));

  const lessons = subject.topics.filter((t) => t.has_lesson).length;
  const solved = feedback?.topics.reduce((n, t) => n + t.counts.solved, 0) ?? 0;
  const problems = new Set(feedback?.topics.flatMap((t) => t.problems.map((p) => p.slug))).size;
  const due = feedback?.topics.filter((t) => t.review_due && t.review_due <= feedback.today) ?? [];
  const locked = subject.status === "locked";
  let card = 0;

  return (
    <div className="home">
      <section className={`hero ${locked ? "locked" : ""}`}>
        <div className="hero-icon">{SUBJECT_ICON[subject.id] ?? "📘"}</div>
        <div>
          <h1>{subject.title}</h1>
          <div className="stats">
            <span className="stat">
              <b>{subject.topics.length}</b> topics
            </span>
            <span className="stat">
              <b>{lessons}</b> lessons
            </span>
            {problems > 0 && (
              <span className="stat">
                <b>
                  {solved}/{problems}
                </b>{" "}
                problems solved
              </span>
            )}
            {locked && <span className="stat lock">🔒 lessons coming · map & resources ready</span>}
          </div>
        </div>
      </section>

      {due.length > 0 && (
        <div className="callout due">
          ⏰ Spaced review due:{" "}
          {due.map((t) => (
            <a key={t.id} className="chip-link" href={`#/learn/${subject.id}/${t.id}`}>
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
        <div className="pills">
          <button className={`pill ${group === "" ? "on" : ""}`} onClick={() => setGroup("")}>
            All
          </button>
          {groups.map((g) => (
            <button
              key={g.group}
              className={`pill ${group === g.group ? "on" : ""}`}
              style={{ ["--c" as string]: g.color }}
              onClick={() => setGroup(group === g.group ? "" : g.group)}
            >
              <span className="swatch" /> {groupLabel(g.group)}{" "}
              <span className="muted">{g.topics.length}</span>
            </button>
          ))}
          {lessons > 0 && (
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
      </div>

      {groups
        .filter((g) => !group || g.group === group)
        .map((g) => {
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
                      href={
                        t.has_lesson
                          ? `#/learn/${subject.id}/${t.id}`
                          : `#/topic/${subject.id}/${t.id}`
                      }
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
  );
}
