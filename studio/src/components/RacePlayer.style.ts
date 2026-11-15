import styled, { css } from "styled-components";
import { fadeUp } from "../theme/animations";
import { PALETTE, t } from "../theme/theme";
import { Trace, WIDE } from "./TracePlayer.style";

/** Race frame: the same wide card as a trace player. */
export const Race = styled(Trace)`
  width: ${WIDE};
`;

export const Title = styled.h3`
  margin: 0 0 4px;
  background: linear-gradient(90deg, ${PALETTE[3]}, ${PALETTE[0]});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  width: fit-content;
`;

export const Sub = styled.div`
  color: ${t.muted};
  font-size: 0.9em;
  margin-bottom: 12px;
`;

export const Lanes = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
`;

/** One runner; the shortest-route winner gets a green frame once everyone has finished. */
export const Lane = styled.div<{ $winner?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ $winner }) => ($winner ? t.ok : t.border)};
  border-radius: 10px;
  background: ${({ $winner }) =>
    $winner ? `color-mix(in srgb, ${t.ok} 7%, ${t.panel})` : t.panel2};
  transition:
    border-color 0.3s,
    background 0.3s;
`;

export const LaneHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
`;

export const Runner = styled.span`
  font-weight: 700;
  font-size: 1.05em;
`;

export const Counter = styled.span`
  margin-left: auto;
  font-family: ${t.fontMono};
  font-size: 12px;
  color: ${t.muted};
`;

export const Status = styled.div<{ $done?: boolean }>`
  min-height: 1.4em;
  margin-top: 6px;
  font-size: 13px;
  color: ${({ $done }) => ($done ? t.text : t.muted)};
  ${({ $done }) =>
    $done &&
    css`
      font-weight: 600;
    `}
`;

export const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
`;

export const Board = styled.div`
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid ${t.ok};
  background: color-mix(in srgb, ${t.ok} 8%, ${t.panel});
  animation: ${fadeUp} 0.4s ease both;
  p {
    margin: 4px 0;
  }
`;

export const Badge = styled.span<{ $tone: "ok" | "accent" }>`
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $tone }) => ($tone === "ok" ? t.ok : t.accent)};
  border: 1px solid currentColor;
`;
