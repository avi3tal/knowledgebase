import type { Graph, Subject } from "../api";

/** Subject-level map: topics grouped by kind/group with lesson status and graph counts. */
export function SubjectMap({ subject, graph }: { subject: Subject; graph: Graph }) {
  const count = (topicId: string, type: string) =>
    graph.edges.filter(
      (e) =>
        (e.from === `topic:${topicId}` && e.to.startsWith(`${type}:`)) ||
        (e.to === `topic:${topicId}` && e.from.startsWith(`${type}:`)),
    ).length;
  const groups = new Map<string, Subject["topics"]>();
  for (const t of subject.topics) {
    const key =
      (t as { group?: string }).group ?? (t.kind === "pattern" ? "coding patterns" : `${t.kind}s`);
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return (
    <article>
      <h1>
        {subject.title}{" "}
        {subject.status === "locked" && <span className="tag">🔒 locked — lessons coming</span>}
      </h1>
      <p className="muted">
        Knowledge map: every topic with its practice problems and curated resources. Click a topic
        for its neighbourhood.
      </p>
      {[...groups].map(([group, topics]) => (
        <section key={group}>
          <h2>{group}</h2>
          <div className="grid">
            {topics.map((t) => (
              <a key={t.id} className="tile topic-tile" href={`#/topic/${subject.id}/${t.id}`}>
                <b>{t.name}</b>
                <span className="muted small">
                  {t.has_lesson ? "● lesson · " : ""}
                  {count(t.id, "problem")} problems · {count(t.id, "ref")} resources
                </span>
                <span className="small">{t.usage}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
