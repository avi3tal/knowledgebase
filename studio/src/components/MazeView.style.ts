import styled, { css } from "styled-components";
import { breathe, drawRoute, fade, flashOut, runAlong } from "../theme/animations";
import { PALETTE, t } from "../theme/theme";

/**
 * Maze scene styles. Every shape's size, offset and look lives here (as styled-components `attrs`
 * for SVG geometry); MazeView.tsx only places shapes on cells and passes state.
 */

/** Side of one maze cell in SVG units; MazeView converts cells to positions with it. */
export const MAZE_CELL = 44;
const C = MAZE_CELL;
/** A tile inset by 1 unit on each side: the 2-unit gap between tiles. */
const TILE = { x: 1, y: 1, width: C - 2, height: C - 2, rx: 5 };

export const Scene = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

/** Grows with its pane up to ~60px a cell (the viewBox keeps proportions). */
export const Svg = styled.svg<{ $cols: number }>`
  display: block;
  width: 100%;
  max-width: ${({ $cols }) => $cols * 60}px;
  height: auto;
  border-radius: 10px;
  background: ${t.panel2};
`;

/** Places its children on a cell (top-left corner at $x, $y). */
export const At = styled.g<{ $x: number; $y: number }>`
  transform: translate(${({ $x }) => $x}px, ${({ $y }) => $y}px);
`;

/** Diagonal hatch for walls (referenced by id from `WallHatch`). */
export const Hatch = styled.pattern.attrs({
  width: 8,
  height: 8,
  patternUnits: "userSpaceOnUse",
  patternTransform: "rotate(45)",
})``;

export const HatchLine = styled.path.attrs({ d: "M0,0 L0,8" })`
  stroke: color-mix(in srgb, ${t.muted} 40%, transparent);
  stroke-width: 2;
`;

/** Solid wall: a dark block with the hatch on top. */
export const Wall = styled.rect.attrs(TILE)`
  fill: color-mix(in srgb, ${t.bg} 70%, black);
  stroke: color-mix(in srgb, ${t.muted} 45%, transparent);
  stroke-width: 1;
`;

export const WallHatch = styled.rect.attrs(TILE)<{ $pattern: string }>`
  pointer-events: none;
  fill: url(#${({ $pattern }) => $pattern});
`;

export const Floor = styled.rect.attrs(TILE)<{ $pickable?: boolean }>`
  fill: ${t.panel};
  stroke: ${t.border};
  stroke-width: 1;
  ${({ $pickable }) =>
    $pickable &&
    css`
      cursor: pointer;
      &:hover {
        fill: color-mix(in srgb, ${t.accent} 18%, ${t.panel});
      }
    `}
`;

/** Terrain theme: water (the "wall" cells) with two wave strokes, and land. */
export const Water = styled.rect.attrs(TILE)`
  fill: color-mix(in srgb, ${PALETTE[1]} 30%, ${t.panel2});
`;

export const Waves = styled.path.attrs({ d: "M9,17 q6,-5 13,0 t13,0 M9,29 q6,-5 13,0 t13,0" })`
  pointer-events: none;
  fill: none;
  stroke: color-mix(in srgb, ${PALETTE[1]} 55%, ${t.panel});
  stroke-width: 2;
  stroke-linecap: round;
`;

export const Land = styled.rect.attrs(TILE)<{ $pickable?: boolean }>`
  fill: color-mix(in srgb, ${t.warn} 20%, ${t.panel});
  stroke: color-mix(in srgb, ${t.warn} 35%, transparent);
  stroke-width: 1;
  ${({ $pickable }) =>
    $pickable &&
    css`
      cursor: pointer;
    `}
`;

/** Rubble (0-1 BFS): a boulder on the floor, passable at a cost. */
export const Rock = styled.path.attrs({
  d: "M10,31 L14,18 L23,12 L32,16 L35,28 L28,34 L15,35 Z",
})`
  pointer-events: none;
  fill: color-mix(in srgb, ${t.muted} 70%, ${t.panel});
  stroke: color-mix(in srgb, ${t.text} 35%, transparent);
  stroke-width: 1.5;
  stroke-linejoin: round;
`;

/**
 * A visited cell: tinted from early (green) to late (accent) by discovery order, or, when the
 * search numbers its regions ($group, e.g. islands), in that region's palette colour.
 */
export const Visited = styled.rect.attrs({ ...TILE, rx: 6 })<{ $heat: number; $group?: number }>`
  pointer-events: none;
  fill: ${({ $heat, $group }) =>
    $group !== undefined
      ? PALETTE[$group % PALETTE.length]
      : `color-mix(in oklab, ${t.ok} ${Math.round((1 - $heat) * 100)}%, ${t.accent})`};
  fill-opacity: ${({ $group }) => ($group !== undefined ? 0.75 : 0.5)};
  animation: ${fade} 0.35s ease both;
`;

/** A cell waiting in the queue / on the stack. */
export const Frontier = styled.rect.attrs({ x: 5, y: 5, width: C - 10, height: C - 10, rx: 6 })`
  pointer-events: none;
  fill: none;
  stroke: ${t.warn};
  stroke-width: 3;
  stroke-dasharray: 6 4;
  animation: ${breathe} 1.4s ease-in-out infinite;
`;

/** Queue position, in the cell's top-left corner. */
export const Order = styled.text.attrs({ x: 8, y: 17 })`
  pointer-events: none;
  font: 600 11px ${t.fontMono};
  fill: ${t.warn};
`;

export const Start = styled.circle.attrs({ cx: C / 2, cy: C / 2, r: C / 2 - 7 })`
  pointer-events: none;
  fill: none;
  stroke: ${t.ok};
  stroke-width: 3;
`;

export const GoalPole = styled.line.attrs({ x1: 16, y1: 35, x2: 16, y2: 8 })`
  pointer-events: none;
  stroke: ${t.text};
  stroke-width: 2;
`;

export const GoalFlag = styled.path.attrs({ d: "M16,8 L34,14 L16,20 Z" })`
  pointer-events: none;
  fill: ${t.bad};
`;

/** The shortest route through cell centres; draws itself once. */
export const Route = styled.polyline.attrs({ pathLength: 1 })`
  pointer-events: none;
  fill: none;
  stroke: ${t.warn};
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: ${drawRoute} 1.2s ease-out both;
`;

/** Travels the route once the line is drawn ($path: SVG path data; $cells: route length). */
export const Runner = styled.circle.attrs({ r: 8 })<{ $path: string; $cells: number }>`
  pointer-events: none;
  fill: ${t.warn};
  stroke: ${t.panel};
  stroke-width: 2;
  offset-path: path("${({ $path }) => $path}");
  offset-rotate: 0deg;
  animation: ${runAlong} ${({ $cells }) => Math.max(1, $cells * 0.22)}s ease-in-out 0.9s both;
`;

/** The explorer: glides to the cell being expanded ($x, $y: the cell's corner). */
export const Explorer = styled.circle.attrs({ cx: C / 2, cy: C / 2, r: 11 })<{
  $x: number;
  $y: number;
}>`
  pointer-events: none;
  fill: ${t.accent};
  stroke: ${t.panel};
  stroke-width: 3;
  transform: translate(${({ $x }) => $x}px, ${({ $y }) => $y}px);
  transition: transform 0.35s ease;
`;

/** One-off flash on the cell a prediction named. */
export const Flash = styled.rect.attrs({ width: C, height: C, rx: 6 })<{ $ok: boolean }>`
  pointer-events: none;
  fill: ${({ $ok }) => ($ok ? t.ok : t.bad)};
  animation: ${flashOut} 0.9s ease-out both;
`;

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12px;
  color: ${t.muted};
`;

export type SwatchKind =
  "frontier" | "early" | "late" | "route" | "explorer" | "water" | "land" | "island" | "rock";

const SWATCH: Record<Exclude<SwatchKind, "frontier">, string> = {
  early: `color-mix(in srgb, ${t.ok} 55%, transparent)`,
  late: `color-mix(in srgb, ${t.accent} 55%, transparent)`,
  route: t.warn,
  explorer: t.accent,
  water: `color-mix(in srgb, ${PALETTE[1]} 45%, ${t.panel2})`,
  land: `color-mix(in srgb, ${t.warn} 30%, ${t.panel})`,
  island: `linear-gradient(90deg, ${PALETTE[0]}, ${PALETTE[3]}, ${PALETTE[4]})`,
  rock: `color-mix(in srgb, ${t.muted} 70%, ${t.panel})`,
};

export const Swatch = styled.span<{ $kind: SwatchKind }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  vertical-align: -2px;
  border-radius: ${({ $kind }) => ($kind === "explorer" ? "50%" : "3px")};
  ${({ $kind }) =>
    $kind === "frontier"
      ? css`
          border: 2px dashed ${t.warn};
        `
      : css`
          background: ${SWATCH[$kind]};
        `}
`;
