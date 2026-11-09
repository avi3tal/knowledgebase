import styled from "styled-components";
import { t } from "../theme/theme";

export type CalloutKind =
  "note" | "tip" | "pitfall" | "warning" | "pros" | "cons" | "interview" | "numbers" | "dialogue";

const KIND_COLOR: Record<CalloutKind, string> = {
  note: t.accent,
  tip: t.ok,
  pitfall: t.bad,
  warning: t.bad,
  cons: t.bad,
  pros: t.ok,
  interview: t.violet,
  numbers: t.warn,
  dialogue: t.cyan,
};

export const calloutColor = (kind: string): string => KIND_COLOR[kind as CalloutKind] ?? t.accent;

export const Box = styled.div<{ $color: string }>`
  margin: 16px 0;
  padding: 10px 16px 4px;
  border: 1px solid ${t.border};
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 10px;
  background: color-mix(in srgb, ${({ $color }) => $color} 7%, ${t.panel});
  color: ${t.text};

  & > p:last-child,
  & > ul:last-child {
    margin-bottom: 8px;
  }

  /* pros / cons side by side when they follow each other */
  [data-callout="pros"] + &[data-callout="cons"] {
    margin-top: -6px;
  }
`;

export const Title = styled.div<{ $color: string }>`
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-bottom: 2px;
`;

/** One chat bubble of a DIALOGUE callout. */
export const Line = styled.div<{ $speaker: string }>`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 8px 0;
  flex-direction: ${({ $speaker }) => ($speaker === "interviewer" ? "row-reverse" : "row")};

  && > p {
    margin: 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: ${({ $speaker }) =>
      $speaker === "interviewer" ? `color-mix(in srgb, ${t.cyan} 9%, ${t.panel})` : t.panel};
    border: 1px solid ${t.border};
    max-width: 85%;
  }
`;

export const Who = styled.span<{ $speaker: string }>`
  flex: 0 0 92px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-top: 9px;
  text-align: left;
  color: ${({ $speaker }) =>
    $speaker === "candidate" ? t.accent : $speaker === "interviewer" ? t.cyan : t.muted};
`;
