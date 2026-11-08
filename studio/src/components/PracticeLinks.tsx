import type { SimilarProblem, TopicProblem } from "../api";
import { ROLE_LABEL, groupByRole, topicPageHref } from "../learn-bench";
import { STATUS_ICON } from "../reader";
import { problemHref } from "../route";

/** Learn -> Practice: the problems that use a topic, grouped by how they use it. */
export function TopicProblemList({
  subject,
  problems,
  names,
  roles,
}: {
  subject: string;
  problems: TopicProblem[];
  names: Record<string, string>;
  /** show the role headings (design subjects); algo problems all use a topic as a pattern */
  roles: boolean;
}) {
  const groups = roles ? groupByRole(problems) : [{ role: "pattern" as const, items: problems }];
  return (
    <>
      {groups.map((g) => (
        <div key={g.role} className="lb-role">
          {roles && (
            <h3>
              {ROLE_LABEL[g.role]} <span className="muted small">{g.items.length}</span>
            </h3>
          )}
          <ul className="lb-problem-grid lb-problem-rich">
            {g.items.map((p, i) => (
              <li
                key={p.slug}
                className={`lb-diff-${p.difficulty}`}
                style={{ ["--i" as string]: i }}
              >
                <a href={problemHref(subject, p.slug)}>
                  <span className="lb-prob-top">
                    {p.status && <span title={p.status}>{STATUS_ICON[p.status]}</span>}
                    <span className="lb-prob-title">{p.title}</span>
                    <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
                  </span>
                  {(p.other_topics ?? []).length > 0 && (
                    <span className="lb-prob-with muted small">
                      with {(p.other_topics ?? []).map((t) => names[t] ?? t).join(" · ")}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** "Often used with": topics that share problems with this one, strongest first. */
export function CoTopics({
  subject,
  items,
  names,
}: {
  subject: string;
  items: { id: string; count: number }[];
  names: Record<string, string>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="chips lb-links">
      {items.slice(0, 16).map((c) => (
        <a
          key={c.id}
          className="lb-link"
          href={topicPageHref(subject, c.id)}
          title={`${c.count} shared problems`}
        >
          {names[c.id] ?? c.id} <span className="lb-link-tag">{c.count}</span>
        </a>
      ))}
    </div>
  );
}

/** Practice -> Practice: problems drilling the same topics (right-pane card on problem pages). */
export function SimilarProblemsCard({
  subject,
  items,
  names,
}: {
  subject: string;
  items: SimilarProblem[] | undefined;
  names: Record<string, string>;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="rd-card">
      <h4>Similar problems</h4>
      <ul className="lb-similar">
        {items.map((s) => (
          <li key={s.slug}>
            <a
              href={problemHref(subject, s.slug)}
              title={`shares ${s.shared.map((t) => names[t] ?? t).join(", ")}`}
            >
              <span title={s.status}>{STATUS_ICON[s.status]}</span> {s.title}{" "}
              <span className={`badge ${s.difficulty}`}>{s.difficulty}</span>
            </a>
            <span className="muted small"> {s.shared.map((t) => names[t] ?? t).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
