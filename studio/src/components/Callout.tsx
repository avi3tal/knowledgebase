import type { ReactNode } from "react";
import { CALLOUTS } from "../callouts";
import * as S from "./Callout.style";

/** A `> [!KIND]` callout (see callouts.ts): coloured box with an icon + heading, body is markdown. */
export function Callout({
  kind,
  heading,
  children,
}: {
  kind: string;
  heading?: string;
  children?: ReactNode;
}) {
  const color = S.calloutColor(kind);
  const meta = CALLOUTS[kind.toUpperCase()];
  return (
    <S.Box $color={color} data-callout={kind}>
      <S.Title $color={color}>
        {meta && <span aria-hidden="true">{meta.icon}</span>} {heading ?? meta?.title ?? kind}
      </S.Title>
      {children}
    </S.Box>
  );
}

/** One speaker line of a DIALOGUE callout; the speaker decides the side and the colour. */
export function DialogueLine({
  speaker,
  who,
  children,
}: {
  speaker: string;
  who: string;
  children?: ReactNode;
}) {
  return (
    <S.Line $speaker={speaker} data-speaker={speaker}>
      <S.Who $speaker={speaker}>{who}</S.Who>
      {children}
    </S.Line>
  );
}
