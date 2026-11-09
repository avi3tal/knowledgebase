import styled, { css } from "styled-components";
import { lbFade, lbPop, lbPulse, lbRise } from "../theme/animations";
import { MutedP } from "../theme/primitives";
import { t } from "../theme/theme";
import { RdButton, Stack } from "./LearnBenchParts.style";

/* ---- left pane: filters and legend */

export const Legend = styled(Stack)``;

export const Filters = styled.ul`
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const FilterLabel = styled.label<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: color-mix(in srgb, ${({ $color }) => $color} 10%, transparent);
  }
  input {
    accent-color: ${({ $color }) => $color};
  }
  &:has(input:not(:checked)) {
    opacity: 0.5;
  }
`;

export const FilterName = styled.span`
  flex: 1;
  font-weight: 600;
  font-size: 0.9em;
`;

export const FilterActions = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
`;

export const Check = styled.label`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.88em;
`;

export const Key = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.86em;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const KeyEdge = styled.line<{ $related?: boolean }>`
  fill: none;
  stroke: ${({ $related }) => ($related ? t.muted : t.accent)};
  stroke-width: 2;
  opacity: 0.9;
  ${({ $related }) =>
    $related &&
    css`
      stroke-dasharray: 5 5;
    `}
`;

export const KeyDot = styled.circle<{ $lesson?: boolean }>`
  fill: ${t.accent};
  opacity: 0.8;
  ${({ $lesson }) =>
    $lesson &&
    css`
      stroke: ${t.text};
      stroke-width: 2;
    `}
`;

/* ---- graph */

export const MapBox = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in srgb, ${t.accent} 7%, ${t.bg}) 0%,
    ${t.bg} 70%
  );
`;

export const MapSvg = styled.svg`
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  animation: ${lbFade} 0.5s ease both;
`;

export const MapEmpty = styled(MutedP)`
  margin: auto;
`;

export const RingCircle = styled.circle`
  fill: none;
  stroke: ${t.border};
  stroke-dasharray: 3 6;
`;

export const Arc = styled.path<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 10;
  stroke-linecap: round;
  opacity: 0.35;
`;

export const Edge = styled.path<{
  $color: string;
  $related: boolean;
  $on: boolean;
  $dim: boolean;
}>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 1.6;
  opacity: 0.45;
  transition:
    opacity 0.2s,
    stroke-width 0.2s;
  ${({ $related }) =>
    $related &&
    css`
      stroke-dasharray: 5 5;
      stroke: ${t.muted};
    `}
  ${({ $on }) =>
    $on &&
    css`
      opacity: 1;
      stroke-width: 3;
    `}
  ${({ $dim }) =>
    $dim &&
    css`
      opacity: 0.08;
    `}
`;

export const Arrow = styled.path`
  fill: ${t.muted};
`;

export const Halo = styled.circle<{ $color: string }>`
  fill: ${({ $color }) => $color};
  opacity: 0;
  transition: opacity 0.2s;
`;

export const Dot = styled.circle<{ $color: string; $lesson: boolean }>`
  fill: ${({ $color }) => $color};
  stroke: ${({ $lesson }) => ($lesson ? t.text : t.panel)};
  stroke-width: ${({ $lesson }) => ($lesson ? 2.5 : 2)};
`;

export const Node = styled.g<{
  $color: string;
  $lesson: boolean;
  $selected: boolean;
  $dim: boolean;
}>`
  cursor: pointer;
  transition: opacity 0.2s;
  outline: none;
  ${({ $dim }) =>
    $dim &&
    css`
      opacity: 0.25;
    `}
  &:hover ${Halo}, &:focus-visible ${Halo} {
    opacity: 0.25;
  }
  ${({ $selected }) =>
    $selected &&
    css`
      ${Halo} {
        opacity: 0.25;
        animation: ${lbPulse} 1.6s ease-in-out infinite;
      }
    `}
  text {
    fill: ${({ $lesson }) => ($lesson ? t.text : t.muted)};
    font-size: 17px;
    font-weight: 600;
    paint-order: stroke;
    stroke: ${t.bg};
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  &:hover text {
    fill: ${({ $color }) => $color};
    font-weight: 800;
  }
  ${({ $selected, $color }) =>
    $selected &&
    css`
      text {
        fill: ${$color};
        font-weight: 800;
      }
    `}
`;

/* ---- right pane */

export const Detail = styled(Stack)`
  animation: ${lbRise} 0.3s ease both;
  p {
    margin: 0;
    line-height: 1.45;
  }
`;

export const DetailHead = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  h3 {
    margin: 4px 0 0;
  }
`;

export const DetailIcon = styled.span<{ $color?: string }>`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 1.4em;
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 18%, ${t.panel});
  animation: ${lbPop} 0.4s cubic-bezier(0.2, 1.4, 0.4, 1);
`;

export const GroupPill = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 9px;
  border-radius: 999px;
  font-size: 0.78em;
  font-weight: 700;
  color: ${({ $color }) => $color ?? t.accent};
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 14%, transparent);
`;

export const DetailActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  ${RdButton} {
    text-align: center;
    text-decoration: none;
    justify-content: center;
  }
`;
