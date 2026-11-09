import styled from "styled-components";
import { VIEW } from "../graph";
import { t } from "../theme/theme";

export const Root = styled.section``;

export const Svg = styled.svg`
  width: 100%;
  max-width: ${VIEW.width}px;
  height: auto;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 12px;
`;

export const Edge = styled.line<{ $role: string }>`
  stroke: ${({ $role }) => ($role === "prereq" || $role === "next" ? t.accent : t.border)};
  stroke-width: 1.5;
`;

/** Fill of a node's dot: matches role or type, later rules winning (the old class order). */
const dotColor = (role: string, type: string): string => {
  const is = (x: string) => role === x || type === x;
  if (is("resource")) return t.warn;
  if (is("problem")) return t.ok;
  if (is("prereq") || is("next") || role === "center") return t.accent;
  return t.muted;
};

export const Node = styled.g<{ $role: string; $type: string }>`
  circle {
    fill: ${({ $role, $type }) => dotColor($role, $type)};
  }
  text {
    fill: ${t.text};
    font-size: ${({ $role }) => ($role === "center" ? 13 : 11)}px;
    ${({ $role }) => ($role === "center" ? "font-weight: 700;" : "")}
  }
`;

export const NodeLink = styled.a`
  &:hover ${Node} text {
    fill: ${t.accent};
  }
`;

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85em;
  margin-top: 4px;
`;

export const LegendItem = styled.span<{ $role: string }>`
  color: ${({ $role }) =>
    $role === "prereq" || $role === "next"
      ? t.accent
      : $role === "problem"
        ? t.ok
        : $role === "resource"
          ? t.warn
          : t.muted};
`;
