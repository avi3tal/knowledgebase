import { useMemo } from "react";
import type { DesignDoc, DesignProblemData } from "../api";
import { extractBrief } from "../design";
import { LinkButton, Muted, MutedP } from "../theme/primitives";
import * as D from "./DesignShared.style";
import * as S from "./DesignBrief.style";
import { Markdown } from "./Markdown";
import { t } from "../theme/theme";

/**
 * Left pane on the form stages: what the interviewer says when asked (from the README), plus the
 * requirements written so far, so API, parts and deep dives can cite F/N ids without switching tabs.
 */
export function DesignBrief({
  problem,
  scope,
  onScope,
}: {
  problem: DesignProblemData;
  scope: DesignDoc["scope"];
  onScope: () => void;
}) {
  const brief = useMemo(() => extractBrief(problem.readme), [problem.readme]);
  const lists = [
    { title: "Functional", cls: "f", color: undefined, items: scope.functional ?? [] },
    { title: "Non-functional", cls: "n", color: t.cyan, items: scope.non_functional ?? [] },
  ];
  const empty = lists.every((l) => l.items.every((x) => !x.text.trim()));
  return (
    <div>
      <S.Card>
        <h4>🗣️ The interviewer says</h4>
        {brief ? (
          <Markdown text={brief} path={problem.readme_path} />
        ) : (
          <MutedP $small>This problem’s README has no interviewer notes.</MutedP>
        )}
      </S.Card>
      <S.Card>
        <h4>🎯 Your requirements</h4>
        {empty && (
          <MutedP $small>
            None yet. <LinkButton onClick={onScope}>Write them in Scope →</LinkButton>
          </MutedP>
        )}
        {lists.map((l) =>
          l.items.some((x) => x.text.trim()) ? (
            <S.Reqs key={l.cls}>
              <Muted $small as="div">
                {l.title}
              </Muted>
              <ul>
                {l.items
                  .filter((x) => x.text.trim())
                  .map((x) => (
                    <li key={x.id}>
                      <D.IdChip $color={l.color}>{x.id}</D.IdChip> {x.text}
                    </li>
                  ))}
              </ul>
            </S.Reqs>
          ) : null,
        )}
      </S.Card>
    </div>
  );
}
