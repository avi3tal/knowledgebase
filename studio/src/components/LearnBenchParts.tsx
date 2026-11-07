import type { ReactNode } from "react";
import { useEffect } from "react";
import type { Topic } from "../api";
import { SUBJECT_SHORT, groupLabel, groupOf, groupTopics, topicIcon } from "../catalog";
import { bestHref } from "../learn-bench";
import { navKey } from "../reader";

/** Building blocks shared by the Learn pages on the Workbench (styles in learn-bench.css). */

function isTyping(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

/** `[` / `]` go to the previous / next href (ignored while typing or with modifiers). */
export function usePrevNextKeys(prev: string | null, next: string | null) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const dir = navKey(e);
      const target = dir === "prev" ? prev : dir === "next" ? next : null;
      if (!target) return;
      e.preventDefault();
      window.location.hash = target.replace(/^#/, "");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);
}

/** ← previous · subject n / total · next → footer, like the design reader's. */
export function PrevNextFooter({
  subject,
  prev,
  next,
  index,
  total,
  noun,
  extra,
}: {
  subject: string;
  prev: { title: string; href: string } | null;
  next: { title: string; href: string } | null;
  index: number;
  total: number;
  noun: string;
  extra?: ReactNode;
}) {
  return (
    <div className="rd-footer">
      {prev ? (
        <a className="rd-nav prev" href={prev.href}>
          ← <span>{prev.title}</span>
        </a>
      ) : (
        <span className="rd-nav prev muted">← first {noun}</span>
      )}
      <span className="rd-foot-mid">
        <b>{SUBJECT_SHORT[subject] ?? subject}</b>
        {index >= 0 && (
          <span className="muted">
            {" "}
            · {index + 1} / {total} {noun}s
          </span>
        )}
        {extra}
        <span className="rd-keys muted">
          <kbd>[</kbd> <kbd>]</kbd> prev / next
        </span>
      </span>
      {next ? (
        <a className="rd-nav next" href={next.href}>
          <span>{next.title}</span> →
        </a>
      ) : (
        <span className="rd-nav next muted">last {noun} →</span>
      )}
    </div>
  );
}

/** Coloured header of a topic / lesson: icon, group + kicker, name, usage. */
export function TopicHeader({
  topic,
  fallbackTitle,
  topics,
  kicker,
  action,
}: {
  topic: Topic | null;
  fallbackTitle: string;
  topics: Topic[];
  kicker?: ReactNode;
  action?: ReactNode;
}) {
  const color =
    (topic && groupTopics(topics).find((g) => g.group === groupOf(topic))?.color) || undefined;
  return (
    <div className="rd-header lb-header" style={color ? { ["--c" as string]: color } : undefined}>
      <div className="rd-icon lb-icon">{topic ? topicIcon(topic) : "📘"}</div>
      <div className="rd-head-main">
        <div className="rd-kicker">
          {topic && <span className="lb-group-pill">{groupLabel(groupOf(topic))}</span>}
          {kicker}
        </div>
        <h1>{topic?.name ?? fallbackTitle}</h1>
        {topic?.usage && <p className="lb-usage">{topic.usage}</p>}
      </div>
      {action}
    </div>
  );
}

/** Topic ids as chips, coloured by group; linking to the lesson when there is one. */
export function TopicLinks({
  subject,
  ids,
  topics,
  names,
}: {
  subject: string;
  ids: string[];
  topics: Topic[];
  names: Record<string, string>;
}) {
  if (ids.length === 0) return <p className="muted small">None.</p>;
  const byId = new Map(topics.map((t) => [t.id, t]));
  const colour = new Map(
    groupTopics(topics).flatMap((g) => g.topics.map((t) => [t.id, g.color] as const)),
  );
  return (
    <div className="chips lb-links">
      {ids.map((id) => {
        const t = byId.get(id);
        return (
          <a
            key={id}
            className={`lb-link ${t?.has_lesson ? "lesson" : ""}`}
            href={t ? bestHref(subject, t) : `#/topic/${subject}/${id}`}
            style={colour.has(id) ? { ["--c" as string]: colour.get(id) } : undefined}
            title={t?.has_lesson ? "Open the lesson" : "Open the topic page"}
          >
            {t ? topicIcon(t) : "•"} {t?.name ?? names[id] ?? id}
            {t?.has_lesson && <span className="lb-link-tag">lesson</span>}
          </a>
        );
      })}
    </div>
  );
}

/** Placeholder for a left pane while the subject list is still loading. */
export function PaneLoading() {
  return <div className="loader small-loader" aria-label="loading" />;
}
