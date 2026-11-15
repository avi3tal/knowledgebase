import styled, { css } from "styled-components";
import { breathe, drawRoute, fade, runAlong } from "../theme/animations";
import { PALETTE, t } from "../theme/theme";

/**
 * Road-map scene styles: every size, offset and look lives here (SVG geometry through
 * styled-components `attrs`); RoadMapView.tsx only places shapes from the trace's data.
 */

/** SVG units per layout unit, and the margin around the town. */
export const ROAD_UNIT = 150;
export const ROAD_PAD = 64;

const ASPHALT = `color-mix(in srgb, ${t.text} 22%, ${t.bg})`;

export const Svg = styled.svg<{ $width: number }>`
  display: block;
  width: 100%;
  max-width: ${({ $width }) => $width}px;
  height: auto;
  margin: 0 auto;
  border-radius: 12px;
  background: color-mix(in srgb, ${PALETTE[2]} 7%, ${t.panel2});
`;

/** Places its children at a point ($x, $y). */
export const At = styled.g<{ $x: number; $y: number }>`
  transform: translate(${({ $x }) => $x}px, ${({ $y }) => $y}px);
`;

/** A road: asphalt with a dashed centre line; glows while it is being relaxed. */
export const Asphalt = styled.line<{ $relaxed?: boolean }>`
  stroke: ${({ $relaxed }) => ($relaxed ? t.warn : ASPHALT)};
  stroke-width: 16;
  stroke-linecap: round;
  transition: stroke 0.25s;
`;

export const CentreLine = styled.line`
  stroke: color-mix(in srgb, ${t.panel} 80%, transparent);
  stroke-width: 2;
  stroke-dasharray: 8 8;
`;

/** The cheapest route, drawn over the roads once the goal is settled. */
export const RouteLine = styled.polyline.attrs({ pathLength: 1 })`
  fill: none;
  stroke: ${t.warn};
  stroke-width: 7;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: ${drawRoute} 1.4s ease-out both;
`;

/** Travel time of a road, in a pill at its middle. */
export const Pill = styled.rect.attrs({ x: -24, y: -12, width: 48, height: 24, rx: 12 })<{
  $on?: boolean;
}>`
  fill: ${({ $on }) => ($on ? t.warn : t.panel)};
  stroke: ${t.border};
`;

export const PillText = styled.text.attrs({ y: 4, textAnchor: "middle" })<{ $on?: boolean }>`
  font: 600 11px ${t.fontMono};
  fill: ${({ $on }) => ($on ? `color-mix(in srgb, black 82%, ${t.warn})` : t.text)};
`;

export type NodeTone = "idle" | "waiting" | "settled" | "current";

/** An intersection: idle, waiting in the heap (pulsing), settled (final distance) or current. */
export const Spot = styled.circle.attrs({ r: 17 })<{ $tone: NodeTone }>`
  stroke-width: 3;
  transition:
    fill 0.3s,
    stroke 0.3s;
  ${({ $tone }) =>
    $tone === "current"
      ? css`
          fill: ${t.accent};
          stroke: ${t.panel};
        `
      : $tone === "settled"
        ? css`
            fill: color-mix(in srgb, ${t.ok} 70%, ${t.panel});
            stroke: ${t.ok};
          `
        : $tone === "waiting"
          ? css`
              fill: ${t.panel};
              stroke: ${t.warn};
              stroke-dasharray: 5 4;
              animation: ${breathe} 1.4s ease-in-out infinite;
            `
          : css`
              fill: ${t.panel};
              stroke: ${t.border};
            `}
`;

export const PlaceName = styled.text.attrs({ y: 36, textAnchor: "middle" })`
  font: 600 12px ${t.fontSans};
  fill: ${t.text};
`;

/** Best distance so far, above the intersection. */
export const DistTag = styled.text.attrs({ y: -26, textAnchor: "middle" })`
  font: 700 12px ${t.fontMono};
  fill: ${t.accent};
  animation: ${fade} 0.3s ease both;
`;

export const Initial = styled.text.attrs({ y: 4, textAnchor: "middle" })`
  pointer-events: none;
  font: 700 12px ${t.fontSans};
  fill: ${t.text};
`;

export const GoalFlag = styled.path.attrs({ d: "M10,-34 L10,-14 M10,-34 L26,-28 L10,-22 Z" })`
  fill: ${t.bad};
  stroke: ${t.bad};
  stroke-width: 2;
`;

/** The car: drives the route once it is drawn ($path: SVG path data; $stops: route length). */
export const Car = styled.rect.attrs({ x: -11, y: -7, width: 22, height: 14, rx: 4 })<{
  $path: string;
  $stops: number;
}>`
  fill: ${t.warn};
  stroke: ${t.panel};
  stroke-width: 2;
  offset-path: path("${({ $path }) => $path}");
  offset-rotate: auto;
  animation: ${runAlong} ${({ $stops }) => Math.max(1.5, $stops * 0.5)}s ease-in-out 1.2s both;
`;

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 14px;
  margin-top: 8px;
  font-size: 12px;
  color: ${t.muted};
`;

export const Dot = styled.span<{ $tone: NodeTone | "route" }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  vertical-align: -2px;
  border-radius: 50%;
  ${({ $tone }) =>
    $tone === "waiting"
      ? css`
          border: 2px dashed ${t.warn};
        `
      : css`
          background: ${
            $tone === "current"
              ? t.accent
              : $tone === "settled"
                ? t.ok
                : $tone === "route"
                  ? t.warn
                  : t.panel
          };
        `}
`;
