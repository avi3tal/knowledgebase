import type { ReactNode } from "react";
import type { Topic } from "../api";
import { groupLabel, groupOf, groupTopics, topicIcon } from "../catalog";
import { bestHref } from "../learn-bench";
import { Loader, MutedP } from "../theme/primitives";
import { MetaGroup, PageHeader } from "./PageHeader";
import * as S from "./LearnBenchParts.style";

/** Building blocks shared by the Learn pages on the Workbench (styles in LearnBenchParts.style.ts). */

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
      meta={[topic && <MetaGroup>{groupLabel(groupOf(topic))}</MetaGroup>, kicker]}
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
  if (ids.length === 0) return <MutedP $small>None.</MutedP>;
  const byId = new Map(topics.map((t) => [t.id, t]));
  const colour = new Map(
    groupTopics(topics).flatMap((g) => g.topics.map((t) => [t.id, g.color] as const)),
  );
  return (
    <S.Links>
      {ids.map((id) => {
        const t = byId.get(id);
        return (
          <S.Link
            key={id}
            href={t ? bestHref(subject, t) : `#/topic/${subject}/${id}`}
            $color={colour.get(id)}
            title={t?.has_lesson ? "Open the lesson" : "Open the topic page"}
          >
            {t ? topicIcon(t) : "•"} {t?.name ?? names[id] ?? id}
            {t?.has_lesson && <S.LinkTag $color={colour.get(id)}>lesson</S.LinkTag>}
          </S.Link>
        );
      })}
    </S.Links>
  );
}

/** Placeholder for a left pane while the subject list is still loading. */
export function PaneLoading() {
  return <Loader $small aria-label="loading" />;
}
