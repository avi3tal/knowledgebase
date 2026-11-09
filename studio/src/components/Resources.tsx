import type { Resource } from "../api";
import { Muted } from "../theme/primitives";
import * as S from "./Resources.style";

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
    <S.Root>
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
            <Muted> — {r.source_name}</Muted>
            {r.page !== null && r.page !== undefined && <Muted>, p. {r.page}</Muted>}
            <S.Tag $kind={r.access}>{ACCESS_LABEL[r.access]}</S.Tag>
            {r.verdict === "core" && <S.Tag $kind="core">core</S.Tag>}
            {r.spoiler && (
              <S.Tag $kind="warn" title="Shows a full solution — open it after your own attempt">
                solution inside
              </S.Tag>
            )}
            <S.Summary>{r.summary}</S.Summary>
          </li>
        ))}
      </ul>
    </S.Root>
  );
}
