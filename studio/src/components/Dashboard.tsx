import type { Feedback, Topic } from "../api";
import { groupLabel, groupTopics } from "../catalog";

/** Topics worth a progress tile: practised or taught. Grouped like the Learn tab. */
export function progressGroups(data: Feedback, topics: Topic[]) {
  const shown = new Set(
    data.topics.filter((t) => t.problems.length > 0 || t.has_lesson).map((t) => t.id),
  );
  const byId = new Map(data.topics.map((t) => [t.id, t]));
  return groupTopics(topics.filter((t) => shown.has(t.id))).map((g) => ({
    ...g,
    tiles: g.topics.flatMap((t) => byId.get(t.id) ?? []),
  }));
}

export function Dashboard({ data, topics }: { data: Feedback; topics: Topic[] }) {
  const due = data.topics.filter((t) => t.review_due && t.review_due <= data.today);
  return (
    <div className="dashboard">
      <h1>Your progress</h1>
      <p className="muted">
        Computed by <code>kb feedback</code> from your private <code>_workspace/progress</code> — no
        AI involved. Today: {data.today}
      </p>
      {due.length > 0 && (
        <div className="callout">⏰ Spaced review due: {due.map((t) => t.name).join(", ")}</div>
      )}
      {progressGroups(data, topics).map((g) => (
        <section key={g.group} style={{ ["--c" as string]: g.color }}>
          <h2 className="group-title">
            <span className="swatch" /> {groupLabel(g.group)}
          </h2>
          <div className="grid">
            {g.tiles.map((t) => (
              <TopicTile key={t.id} t={t} subject={data.subject} />
            ))}
          </div>
        </section>
      ))}
      {data.unmapped_tags.length > 0 && (
        <p className="muted">Unmapped problem tags: {data.unmapped_tags.join(", ")}</p>
      )}
    </div>
  );
}

function TopicTile({ t, subject }: { t: Feedback["topics"][number]; subject: string }) {
  const total = t.problems.length || 1;
  return (
    <div className="tile">
      <div className="tile-head">
        <b>{t.name}</b>
        {t.has_lesson ? (
          <a href={`#/learn/${subject}/${t.id}`}>open lesson →</a>
        ) : (
          <a className="muted" href={`#/topic/${subject}/${t.id}`}>
            topic page →
          </a>
        )}
      </div>
      <div
        className="bar"
        title={`${t.counts.solved} solved · ${t.counts.failing} failing · ${t.counts.untried} untried`}
      >
        <span className="solved" style={{ width: `${(100 * t.counts.solved) / total}%` }} />
        <span className="failing" style={{ width: `${(100 * t.counts.failing) / total}%` }} />
      </div>
      <div className="muted small">
        {t.problems.length} problems · quiz{" "}
        {t.quiz_accuracy === null ? "—" : `${Math.round(t.quiz_accuracy * 100)}%`}
        {t.last_practiced ? ` · last ${t.last_practiced.slice(0, 10)}` : ""}
      </div>
      <ul className="advice">
        {t.advice.slice(0, 3).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
