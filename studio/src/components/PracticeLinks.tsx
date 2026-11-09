import type { SimilarProblem, TopicProblem } from "../api";
import { ROLE_LABEL, groupByRole, topicPageHref } from "../learn-bench";
import { STATUS_ICON } from "../reader";
import { problemHref } from "../route";
import { Card, Muted } from "../theme/primitives";
import { Badge } from "./PracticeBench.style";
import * as S from "./PracticeLinks.style";

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
        <S.Role key={g.role}>
          {roles && (
            <h3>
              {ROLE_LABEL[g.role]} <Muted $small>{g.items.length}</Muted>
            </h3>
          )}
          <S.ProblemGrid>
            {g.items.map((p, i) => (
              <S.ProblemItem key={p.slug} $difficulty={p.difficulty} $i={i}>
                <a href={problemHref(subject, p.slug)}>
                  <S.ProbTop>
                    {p.status && <span title={p.status}>{STATUS_ICON[p.status]}</span>}
                    <S.ProbTitle>{p.title}</S.ProbTitle>
                    <Badge $difficulty={p.difficulty}>{p.difficulty}</Badge>
                  </S.ProbTop>
                  {(p.other_topics ?? []).length > 0 && (
                    <S.ProbWith>
                      with {(p.other_topics ?? []).map((t) => names[t] ?? t).join(" · ")}
                    </S.ProbWith>
                  )}
                </a>
              </S.ProblemItem>
            ))}
          </S.ProblemGrid>
        </S.Role>
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
    <S.Links>
      {items.slice(0, 16).map((c) => (
        <S.Link key={c.id} href={topicPageHref(subject, c.id)} title={`${c.count} shared problems`}>
          {names[c.id] ?? c.id} <S.LinkTag>{c.count}</S.LinkTag>
        </S.Link>
      ))}
    </S.Links>
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
    <Card>
      <h4>Similar problems</h4>
      <S.Similar>
        {items.map((s) => (
          <li key={s.slug}>
            <a
              href={problemHref(subject, s.slug)}
              title={`shares ${s.shared.map((t) => names[t] ?? t).join(", ")}`}
            >
              <span title={s.status}>{STATUS_ICON[s.status]}</span> {s.title}{" "}
              <Badge $difficulty={s.difficulty}>{s.difficulty}</Badge>
            </a>
            <Muted $small> {s.shared.map((t) => names[t] ?? t).join(" · ")}</Muted>
          </li>
        ))}
      </S.Similar>
    </Card>
  );
}
