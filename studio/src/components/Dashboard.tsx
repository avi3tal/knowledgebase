import type { Feedback } from "../api";

export function Dashboard({ data }: { data: Feedback }) {
  const patterns = data.topics.filter((t) => t.kind === "pattern");
  const fundamentals = data.topics.filter((t) => t.kind === "fundamental" && t.problems.length > 0);
  const due = data.topics.filter((t) => t.review_due && t.review_due <= data.today);
  return (
    <div className="dashboard">
      <h1>Your progress</h1>
      <p className="muted">
        Computed by <code>kb feedback</code> from <code>progress/*.jsonl</code> — no AI involved.
        Today: {data.today}
      </p>
      {due.length > 0 && (
        <div className="callout">⏰ Spaced review due: {due.map((t) => t.name).join(", ")}</div>
      )}
      <h2>Coding patterns</h2>
      <div className="grid">
        {patterns.map((t) => (
          <TopicTile key={t.id} t={t} subject={data.subject} />
        ))}
      </div>
      <h2>Fundamentals</h2>
      <div className="grid">
        {fundamentals.map((t) => (
          <TopicTile key={t.id} t={t} subject={data.subject} />
        ))}
      </div>
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
          <span className="muted">no lesson yet</span>
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
