import type { TopicPageData } from "../api";
import { problemHref } from "../route";
import { NeighbourhoodGraph } from "./NeighbourhoodGraph";
import { ResourceList } from "./Resources";

export function TopicChips({
  subject,
  label,
  ids,
  names,
}: {
  subject: string;
  label: string;
  ids: string[];
  names: Record<string, string>;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="chips">
      <span className="muted">{label}:</span>
      {ids.map((id) => (
        <a key={id} className="chip-link" href={`#/topic/${subject}/${id}`}>
          {names[id] ?? id}
        </a>
      ))}
    </div>
  );
}

export function TopicPage({ data }: { data: TopicPageData }) {
  const { subject, topic, names } = data;
  return (
    <article>
      <h1>
        {topic.name}{" "}
        {data.subject_status === "locked" && <span className="tag">🔒 locked subject</span>}
      </h1>
      <p>{topic.usage}</p>
      {topic.samples.length > 0 && (
        <p className="muted">Classic problems: {topic.samples.join(" · ")}</p>
      )}
      <TopicChips subject={subject} label="Learn first" ids={topic.prereqs ?? []} names={names} />
      <TopicChips subject={subject} label="Related" ids={topic.related ?? []} names={names} />
      {data.has_lesson ? (
        <p>
          <a href={`#/learn/${subject}/${topic.id}`}>▶ Open the lesson →</a>
        </p>
      ) : (
        <div className="callout">
          No lesson yet. In Claude Code:{" "}
          <code>
            /learn {subject} {topic.id}
          </code>
        </div>
      )}
      <NeighbourhoodGraph graph={data.graph} subject={subject} />
      {data.problems.length > 0 && (
        <section>
          <h3>Practice</h3>
          <ul>
            {data.problems.map((p) => (
              <li key={p.slug}>
                <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>{" "}
                <a href={problemHref(subject, p.slug)}>{p.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ResourceList items={data.resources} title="Resources" />
    </article>
  );
}
