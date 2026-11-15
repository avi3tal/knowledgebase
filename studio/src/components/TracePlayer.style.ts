import styled from "styled-components";
import { PALETTE, t } from "../theme/theme";

const VIOLET = PALETTE[5];

/** Figures and traces break out of the reading column: centred on it, up to 1040px wide. */
export const WIDE = "min(1040px, calc(100cqw - 48px))";

export const Trace = styled.section`
  width: ${WIDE};
  max-width: none;
  margin: 22px 0;
  margin-left: calc(50% - ${WIDE} / 2);
  padding: 16px 18px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: ${t.shadow};
  outline: none;
  &:focus-visible {
    border-color: ${t.accent};
  }
`;

export const Title = styled.h3`
  margin: 0 0 4px;
  background: linear-gradient(90deg, ${PALETTE[0]}, ${PALETTE[4]});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  width: fit-content;
`;

export const Input = styled.div`
  color: ${t.muted};
  font-size: 0.9em;
  margin-bottom: 12px;
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 18px;
`;

export const Code = styled.pre`
  margin: 0;
  padding: 10px 0;
  overflow-x: auto;
  font-family: ${t.fontMono};
  font-size: 13.5px;
  line-height: 1.6;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 10px;
`;

export const CodeLine = styled.div<{ $active?: boolean }>`
  padding: 0 16px 0 0;
  white-space: pre;
  border-left: 2px solid ${({ $active }) => ($active ? t.accent : "transparent")};
  background: ${({ $active }) => ($active ? t.accentSoft : "none")};
  transition: background 0.2s;
`;

export const LineNo = styled.span`
  display: inline-block;
  width: 34px;
  text-align: right;
  padding-right: 10px;
  color: ${t.muted};
  user-select: none;
`;

export const Viz = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const Note = styled.div<{ $empty?: boolean }>`
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid ${VIOLET};
  background: color-mix(in srgb, ${VIOLET} 7%, ${t.panel});
  ${({ $empty }) => $empty && `color: ${t.muted};`}
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
`;

export const Btn = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  ${({ $primary }) =>
    $primary &&
    `
    background: ${t.accent};
    color: ${t.onAccent};
    border-color: ${t.accent};
    font-weight: 600;
  `}
`;

export const Range = styled.input`
  flex: 1;
  min-width: 120px;
`;

/** Predict mode: the question, the live score and the way out. */
export const PredictBar = styled.div<{ $tone?: "ok" | "bad" }>`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid ${({ $tone }) => ($tone === "ok" ? t.ok : $tone === "bad" ? t.bad : t.accent)};
  background: color-mix(
    in srgb,
    ${({ $tone }) => ($tone === "ok" ? t.ok : $tone === "bad" ? t.bad : t.accent)} 9%,
    ${t.panel}
  );
  transition:
    border-color 0.2s,
    background 0.2s;
`;

export const Question = styled.span`
  flex: 1;
  min-width: 200px;
  font-weight: 600;
`;

export const Score = styled.span`
  font-family: ${t.fontMono};
  font-size: 13px;
  color: ${t.muted};
`;

export const Hidden = styled.div`
  padding: 8px 12px;
  border: 1px dashed ${t.border};
  border-radius: 6px;
  font-size: 13px;
  color: ${t.muted};
`;

/** Full-width scene (e.g. a town map) above the code and the side views. */
export const Stage = styled.div`
  margin-bottom: 14px;
`;
