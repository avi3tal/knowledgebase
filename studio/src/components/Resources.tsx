import type { Resource } from "../api";

const ACCESS_LABEL = { free: "free", trial: "trial", paid: "paid", local: "local book" } as const;

export function ResourceList({
  items,
  title = "Go deeper",
}: {
  items: Resource[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="resources">
      <h3>📖 {title}</h3>
      <ul>
        {items.map((r) => (
          <li key={`${r.source}:${r.id}`}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
            ) : (
              <b>{r.title}</b>
            )}
            <span className="muted"> — {r.source_name}</span>
            {r.page !== null && r.page !== undefined && (
              <span className="muted">, p. {r.page}</span>
            )}
            <span className={`tag access-${r.access}`}>{ACCESS_LABEL[r.access]}</span>
            {r.verdict === "core" && <span className="tag core">core</span>}
            <div className="small muted">{r.summary}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
