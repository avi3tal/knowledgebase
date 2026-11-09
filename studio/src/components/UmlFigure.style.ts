import styled, { css } from "styled-components";
import { t } from "../theme/theme";
import { Svg as FigSvg } from "./FigureView.style";

/** How a class box / relation looks at the current step. */
export type UmlState = "" | "on" | "failed" | "dim";
export type HeadTone = "base" | "on" | "failed";

export const Svg = FigSvg;

const toneColor = (tone: HeadTone) =>
  tone === "on" ? t.accent : tone === "failed" ? t.bad : t.text;

/* ---------- class boxes ---------- */

export const Class = styled.g<{ $state: UmlState }>`
  transition: opacity 0.3s;
  ${({ $state }) => $state === "dim" && "opacity: 0.28;"}
`;

export const Box = styled.rect`
  fill: ${t.panel};
`;

export const Header = styled.path<{ $state: UmlState }>`
  fill: ${({ $state }) => ($state === "on" ? t.accentSoft : t.panel2)};
`;

export const Outline = styled.rect<{ $state: UmlState }>`
  fill: none;
  stroke: ${t.muted};
  stroke-width: 1.4;
  transition: stroke 0.3s;
  ${({ $state }) =>
    $state === "on"
      ? css`
          stroke: ${t.accent};
          stroke-width: 2.6;
        `
      : $state === "failed"
        ? css`
            stroke: ${t.bad};
            stroke-width: 2.2;
            stroke-dasharray: 6 4;
          `
        : ""}
`;

export const Sep = styled.line`
  stroke: ${t.border};
  stroke-width: 1.2;
`;

export const Name = styled.text<{ $abstract?: boolean }>`
  fill: ${t.text};
  font-size: 14px;
  font-weight: 700;
  ${({ $abstract }) => $abstract && "font-style: italic;"}
`;

export const Stereo = styled.text`
  fill: ${t.muted};
  font-size: 11px;
`;

export const Member = styled.text`
  fill: ${t.text};
  font-family: ${t.fontMono};
  font-size: 12px;
  white-space: pre;
`;

const VIS_FILL = { pub: t.ok, priv: t.bad, prot: t.warn, pkg: t.muted } as const;
export type Visibility = keyof typeof VIS_FILL;

export const Vis = styled.tspan<{ $vis?: Visibility }>`
  font-weight: 700;
  ${({ $vis }) =>
    $vis &&
    css`
      fill: ${VIS_FILL[$vis]};
      ${$vis === "priv" ? "opacity: 0.85;" : ""}
    `}
`;

/* ---------- relations ---------- */

export const Rel = styled.g<{ $state: UmlState }>`
  transition: opacity 0.3s;
  ${({ $state }) => $state === "dim" && "opacity: 0.28;"}
`;

export const Line = styled.line<{ $state: UmlState; $dashed?: boolean }>`
  stroke: ${t.text};
  stroke-width: 1.5;
  transition:
    stroke 0.3s,
    stroke-width 0.3s;
  ${({ $dashed }) => $dashed && "stroke-dasharray: 7 5;"}
  ${({ $state }) =>
    $state === "on"
      ? css`
          stroke: ${t.accent};
          stroke-width: 2.6;
        `
      : $state === "failed"
        ? css`
            stroke: ${t.bad};
            stroke-width: 2.2;
          `
        : ""}
`;

/** Arrowhead / diamond inside a marker: stroke follows the tone, fill follows the shape. */
export const Head = styled.path<{ $tone: HeadTone; $fill: "hollow" | "solid" | "none" }>`
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke: ${({ $tone }) => toneColor($tone)};
  fill: ${({ $fill, $tone }) =>
    $fill === "hollow" ? t.panel : $fill === "solid" ? toneColor($tone) : "none"};
`;

const haloText = css`
  fill: ${t.muted};
  font-size: 12px;
  paint-order: stroke;
  stroke: ${t.panel};
  stroke-width: 4px;
  stroke-linejoin: round;
`;

export const RelLabel = styled.text<{ $on?: boolean }>`
  ${haloText}
  font-style: italic;
  ${({ $on }) => $on && `fill: ${t.accent};`}
`;

export const Mult = styled.text<{ $on?: boolean }>`
  ${haloText}
  font-size: 13.5px;
  font-weight: 700;
  ${({ $on }) => $on && `fill: ${t.accent};`}
`;
