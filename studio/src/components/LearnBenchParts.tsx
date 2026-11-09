import type { ReactNode } from "react";
import type { Topic } from "../api";
import { groupLabel, groupOf, groupTopics, topicIcon } from "../catalog";
import { bestHref } from "../learn-bench";
import { PageHeader } from "./PageHeader";

/** Building blocks shared by the Learn pages on the Workbench (styles in learn-bench.css). */

export { PrevNextFooter, usePrevNextKeys } from "./PageHeader";

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
    <PageHeader
      accent={color}
      icon={topic ? topicIcon(topic) : "📘"}
      title={topic?.name ?? fallbackTitle}
      meta={[topic && <span className="ph-group">{groupLabel(groupOf(topic))}</span>, kicker]}
      sub={topic?.usage}
      actions={action}
    />
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
