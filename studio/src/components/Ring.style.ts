import styled, { css } from "styled-components";
import { ringFill } from "../theme/animations";
import { t } from "../theme/theme";

export const Svg = styled.svg<{ $labelSize: number; $inverse: boolean }>`
  text {
    font-size: ${({ $labelSize }) => $labelSize}px;
    font-weight: 700;
    fill: ${({ $inverse }) => ($inverse ? "#fff" : t.muted)};
  }
`;

export const Track = styled.circle<{ $inverse: boolean }>`
  fill: none;
  stroke: ${({ $inverse }) => ($inverse ? "rgba(255, 255, 255, 0.25)" : t.panel2)};
  stroke-width: 5;
`;

export const Arc = styled.circle<{ $kind: "solved" | "failing"; $inverse: boolean }>`
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
  animation: ${ringFill} 0.9s ease both;
  ${({ $kind, $inverse }) => css`
    stroke: ${$kind === "failing" ? t.bad : $inverse ? "#fff" : t.ok};
  `}
`;
