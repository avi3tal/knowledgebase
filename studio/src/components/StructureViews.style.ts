import styled, { css } from "styled-components";
import { t } from "../theme/theme";

/* ---------- tree / heap / graph (SVG) ---------- */

export const Svg = styled.svg`
  overflow: visible;
`;

/** A tree edge or a graph edge (`$on`: lit by the current step). */
export const Edge = styled.line<{ $on?: boolean }>`
  stroke: ${({ $on }) => ($on ? t.accent : t.border)};
  stroke-width: ${({ $on }) => ($on ? 3 : 2)};
  transition:
    stroke 0.3s,
    stroke-width 0.3s;
`;

/** `$pointed`: a pointer or a lit node; `$stroke`: the colour of the group the node belongs to. */
export const Node = styled.circle<{ $pointed?: boolean; $stroke?: string }>`
  fill: ${({ $pointed }) => ($pointed ? `color-mix(in srgb, ${t.accent} 25%, transparent)` : t.panel2)};
  stroke: ${({ $pointed }) => ($pointed ? t.accent : t.muted)};
  stroke-width: ${({ $pointed }) => ($pointed ? 3 : 1.5)};
  transition:
    stroke 0.3s,
    fill 0.3s;
  ${({ $stroke }) =>
    $stroke &&
    css`
      stroke: ${$stroke};
      stroke-width: 3;
    `}
`;

export const NodeText = styled.text`
  fill: ${t.text};
  font-size: 13px;
  font-weight: 600;
`;

/** The name of a pointer above a node, or a label below a graph node. */
export const NodeTag = styled.text`
  fill: ${t.ok};
  font-size: 11px;
  font-weight: 600;
`;

export const ArrowHead = styled.path`
  fill: ${t.muted};
`;

export const Weight = styled.text<{ $on?: boolean }>`
  fill: ${({ $on }) => ($on ? t.accent : t.muted)};
  font-size: 12px;
  font-weight: 600;
  paint-order: stroke;
  stroke: ${t.panel};
  stroke-width: 4px;
`;

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85em;
  margin-top: 4px;
`;

export const LegendItem = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

export const HeapArray = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 6px;
`;

/* ---------- grid / DP table ---------- */

export const Grid = styled.table`
  border-collapse: collapse;
  font-size: 0.85em;
  th {
    color: ${t.muted};
    font-weight: 600;
    padding: 2px 6px;
  }
`;

export const GridCell = styled.td<{ $marked?: boolean; $cursor?: boolean }>`
  border: 1px solid ${t.border};
  min-width: 28px;
  height: 26px;
  text-align: center;
  background: ${t.panel2};
  transition: background 0.25s;
  ${({ $marked }) =>
    $marked &&
    css`
      background: color-mix(in srgb, ${t.ok} 22%, transparent);
    `}
  ${({ $cursor }) =>
    $cursor &&
    css`
      background: color-mix(in srgb, ${t.accent} 35%, transparent);
      outline: 2px solid ${t.accent};
      font-weight: 700;
    `}
`;

/* ---------- intervals ---------- */

export const Intervals = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
`;

export const Lane = styled.div`
  display: flex;
  align-items: center;
  margin: 4px 0;
`;

export const LaneName = styled.span`
  width: 90px;
  font-size: 0.8em;
  color: ${t.muted};
`;

export const LaneTrack = styled.div<{ $width: number; $height: number }>`
  position: relative;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  background: ${t.bg};
  border-radius: 4px;
`;

export const Bar = styled.div<{ $left: number; $width: number; $top: number; $pointed?: boolean }>`
  position: absolute;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  width: ${({ $width }) => $width}px;
  height: 20px;
  /* margin and flex are inherited from the old shared ".bar" progress-bar rule (kept for parity) */
  display: flex;
  margin: 8px 0 4px;
  border-radius: 4px;
  background: color-mix(
    in srgb,
    ${({ $pointed }) => ($pointed ? t.warn : t.accent)} ${({ $pointed }) => ($pointed ? 35 : 30)}%,
    transparent
  );
  border: 1px solid ${({ $pointed }) => ($pointed ? t.warn : t.accent)};
  font-size: 0.72em;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  transition:
    left 0.35s,
    width 0.35s;
`;

export const Axis = styled.div<{ $width: number }>`
  display: flex;
  justify-content: space-between;
  margin-left: 90px;
  width: ${({ $width }) => $width}px;
  font-size: 0.75em;
  color: ${t.muted};
`;

/* ---------- call stack ---------- */

export const CallStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: ${t.fontMono};
  font-size: 0.82em;
`;

export const Frame = styled.div<{ $top?: boolean }>`
  border: 1px solid ${({ $top }) => ($top ? t.accent : t.border)};
  border-radius: 4px;
  padding: 2px 8px;
  color: ${({ $top }) => ($top ? t.text : t.muted)};
`;
