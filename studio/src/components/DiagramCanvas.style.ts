import styled, { css } from "styled-components";
import { dashFlow, fade, figMarch, newGlow, nodeIn, pop } from "../theme/animations";
import { t } from "../theme/theme";

/**
 * The diagram canvas: one SVG renderer used by the console (editable) and by lesson figures and
 * solutions (read-only; `presentation` adds step dimming, packets and failure marks).
 * Node and edge colours come from a `--kc` custom property that `Node` / `Edge` set from `$kc`.
 */

const reduceMotion = (rule: string) => css`
  @media (prefers-reduced-motion: reduce) {
    ${rule}
  }
`;

// ------------------------------------------------------------------ defs

export const GridDot = styled.circle`
  fill: color-mix(in srgb, ${t.muted} 45%, transparent);
`;

export const GridLine = styled.path`
  fill: none;
  stroke: color-mix(in srgb, ${t.muted} 14%, transparent);
  stroke-width: 1;
`;

export const Arrow = styled.path<{ $variant: "plain" | "new" | "sel" }>`
  fill: ${({ $variant }) => ($variant === "new" ? t.ok : $variant === "sel" ? t.accent : t.muted)};
`;

export const Bg = styled.rect`
  cursor: grab;
`;

export const Svg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
`;

// ------------------------------------------------------------------ edges

export const EdgeHit = styled.path`
  fill: none;
  stroke: transparent;
  stroke-width: 14;
`;

export const EdgeLine = styled.path`
  fill: none;
  stroke: ${t.muted};
  stroke-width: 2;
  transition: stroke 0.15s;
`;

export const EdgeFlow = styled.path`
  fill: none;
  stroke: var(--kc, ${t.accent});
  stroke-width: 2;
  stroke-dasharray: 2 14;
  stroke-linecap: round;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  ${reduceMotion("animation: none !important;")}
`;

export const EdgeLabel = styled.g`
  rect {
    fill: ${t.panel};
    stroke: ${t.border};
  }
  text {
    font-size: 11px;
    fill: ${t.text};
  }
`;

/** Travelling dots along an active arrow (lesson figures). */
export const Packets = styled.g`
  ${reduceMotion("display: none;")}
`;

export const Packet = styled.circle`
  fill: ${t.accent};
  stroke: ${t.panel};
  stroke-width: 2;
  filter: drop-shadow(0 0 4px ${t.accent});
`;

/** The red ✕ on a failed node or arrow. */
export const FailMark = styled.g`
  circle {
    fill: ${t.bad};
    stroke: ${t.panel};
    stroke-width: 2;
  }
  text {
    fill: #fff;
    font-size: 13px;
    font-weight: 800;
  }
`;

export const TempEdge = styled.path`
  fill: none;
  stroke: ${t.accent};
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
`;

const flowOn = css`
  opacity: 0.9;
  animation: ${dashFlow} 0.8s linear infinite;
`;

interface EdgeProps {
  $kc: string;
  $new: boolean;
  $failed: boolean;
  $selected: boolean;
  /** lesson figure with a step playing: everything but the step is dimmed */
  $dim: boolean;
  $presentation: boolean;
}

export const Edge = styled.g<EdgeProps>`
  --kc: ${({ $kc }) => $kc};
  cursor: pointer;
  ${({ $dim }) =>
    $dim &&
    css`
      opacity: 0.28;
      transition: opacity 0.25s;
    `}
  &:hover ${EdgeFlow} {
    ${flowOn}
  }
  &:hover ${EdgeLine} {
    stroke: ${t.text};
  }
  ${({ $new, $presentation }) =>
    $new &&
    css`
      ${EdgeLine} {
        stroke: ${t.ok};
        stroke-width: 2.5;
        stroke-dasharray: ${$presentation ? "8 6" : "8 5"};
        animation: ${$presentation ? figMarch : dashFlow} ${$presentation ? "0.7s" : "0.9s"} linear
          infinite;
        ${reduceMotion("animation: none !important;")}
      }
    `}
  ${({ $selected }) =>
    $selected &&
    css`
      ${EdgeFlow} {
        ${flowOn}
      }
      ${EdgeLine} {
        stroke: ${t.accent};
        stroke-width: 3;
      }
      ${EdgeLabel} rect {
        stroke: ${t.accent};
      }
    `}
  ${({ $failed }) =>
    $failed &&
    css`
      ${EdgeLine} {
        stroke: ${t.bad} !important;
        stroke-dasharray: 6 5;
      }
    `}
`;

// ------------------------------------------------------------------ nodes

export const Card = styled.rect`
  fill: ${t.panel};
  stroke: color-mix(in srgb, var(--kc) 55%, ${t.border});
  stroke-width: 1.5;
  filter: drop-shadow(0 2px 4px rgba(16, 24, 40, 0.12));
  transition: stroke 0.15s;
`;

export const CardTint = styled.rect`
  fill: var(--kc);
  opacity: 0.07;
  pointer-events: none;
`;

export const Rim = styled.ellipse`
  fill: color-mix(in srgb, var(--kc) 22%, ${t.panel});
  stroke: color-mix(in srgb, var(--kc) 55%, ${t.border});
  stroke-width: 1.5;
  pointer-events: none;
`;

export const Slots = styled.g`
  line {
    stroke: var(--kc);
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0.55;
  }
`;

export const Stripe = styled.rect`
  fill: var(--kc);
`;

export const IconBg = styled.circle`
  fill: var(--kc);
  opacity: 0.16;
`;

export const Icon = styled.text`
  font-size: 18px;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
`;

export const Label = styled.text<{ $presentation: boolean }>`
  font-size: ${({ $presentation }) => ($presentation ? "12px" : "13px")};
  font-weight: 700;
  fill: ${t.text};
  pointer-events: none;
`;

export const Kind = styled.text`
  font-size: 10.5px;
  fill: ${t.muted};
  pointer-events: none;
`;

export const NewBadge = styled.g`
  rect {
    fill: ${t.ok};
  }
  text {
    fill: #fff;
    font-size: 10px;
    font-weight: 800;
    text-anchor: middle;
    dominant-baseline: central;
    letter-spacing: 0.04em;
  }
`;

export const SmellRing = styled.rect`
  fill: none;
  stroke: ${t.bad};
  stroke-width: 2;
  stroke-dasharray: 6 4;
  animation: ${dashFlow} 1.6s linear infinite;
  ${reduceMotion("animation: none !important;")}
`;

export const SmellBadge = styled.g`
  circle {
    fill: ${t.bad};
  }
  text {
    fill: #fff;
    font-weight: 900;
    font-size: 13px;
    text-anchor: middle;
    dominant-baseline: central;
  }
`;

export const Handle = styled.circle`
  fill: ${t.panel};
  stroke: ${t.accent};
  stroke-width: 2;
  cursor: crosshair;
  opacity: 0;
  transition:
    opacity 0.15s,
    r 0.15s;
  &:hover {
    fill: ${t.accent};
    r: 9;
  }
`;

export const NodeBody = styled.g<{ $i: number }>`
  animation: ${nodeIn} 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 25}ms;
  transform-box: fill-box;
  transform-origin: center;
`;

interface NodeProps {
  $kc: string;
  $editable: boolean;
  $selected: boolean;
  $new: boolean;
  $failed: boolean;
  $pending: boolean;
  $dragging: boolean;
  $dim: boolean;
}

export const Node = styled.g<NodeProps>`
  --kc: ${({ $kc }) => $kc};
  cursor: ${({ $editable }) => ($editable ? "move" : "pointer")};
  ${({ $dim }) =>
    $dim &&
    css`
      opacity: 0.28;
      transition: opacity 0.25s;
    `}
  &:hover ${Card} {
    stroke: var(--kc);
    stroke-width: 2;
  }
  &:hover ${Handle} {
    opacity: 1;
  }
  ${({ $selected }) =>
    $selected &&
    css`
      ${Card} {
        stroke: ${t.accent};
        stroke-width: 3;
      }
      ${Handle} {
        opacity: 1;
      }
    `}
  ${({ $pending }) =>
    $pending &&
    css`
      ${Card} {
        stroke: ${t.accent};
        stroke-width: 3;
        stroke-dasharray: 5 4;
      }
    `}
  ${({ $dragging }) =>
    $dragging &&
    css`
      ${Card} {
        filter: drop-shadow(0 10px 18px rgba(16, 24, 40, 0.25));
      }
    `}
  ${({ $new }) =>
    $new &&
    css`
      ${Card} {
        stroke: ${t.ok};
        stroke-width: 2.5;
        animation: ${newGlow} 1.8s ease-in-out infinite;
        ${reduceMotion("animation: none !important;")}
      }
    `}
  ${({ $failed }) =>
    $failed &&
    css`
      ${Card} {
        stroke: ${t.bad} !important;
        stroke-dasharray: 6 4;
      }
    `}
`;

// ------------------------------------------------------------------ chrome

export const Tools = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: color-mix(in srgb, ${t.panel} 88%, transparent);
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  backdrop-filter: blur(6px);
`;

export const ToolButton = styled.button<{ $on?: boolean }>`
  padding: 3px 10px;
  ${({ $on }) =>
    $on &&
    css`
      background: ${t.accent};
      color: ${t.onAccent};
      border-color: ${t.accent};
    `}
`;

export const Zoom = styled.span`
  font-size: 0.8em;
  color: ${t.muted};
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

const hint = css`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.85em;
  pointer-events: none;
  white-space: nowrap;
  animation: ${fade} 0.4s ease both;
`;

export const EmptyHint = styled.div`
  ${hint}
  bottom: 16px;
  background: ${t.panel2};
  color: ${t.muted};
  border: 1px dashed ${t.border};
  max-width: 90%;
  white-space: normal;
  text-align: center;
`;

export const ModeHint = styled.div`
  ${hint}
  top: 12px;
  background: ${t.accent};
  color: ${t.onAccent};
  box-shadow: ${t.shadowLift};
`;

export const DropHint = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 999px;
  background: ${t.accent};
  color: ${t.onAccent};
  font-weight: 700;
  font-size: 0.85em;
  pointer-events: none;
  animation: ${pop} 0.2s ease both;
`;

export const Help = styled.div`
  position: absolute;
  left: 10px;
  bottom: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, ${t.panel} 85%, transparent);
  pointer-events: none;
  opacity: 0.85;
  color: ${t.muted};
  font-size: 0.85em;
`;

// ------------------------------------------------------------------ frame

export const Stage = styled.div<{
  $fill: boolean;
  $height: number;
  $pan: boolean;
  $dropping: boolean;
}>`
  position: relative;
  border: 1px solid ${t.border};
  border-radius: 14px;
  overflow: hidden;
  background: ${t.panel};
  outline: none;
  box-shadow: inset 0 0 0 1px transparent;
  transition: box-shadow 0.2s;
  ${({ $fill, $height }) =>
    $fill
      ? css`
          flex: 1;
          min-height: 240px;
          border: 0;
          border-radius: 0;
          background:
            radial-gradient(
              circle at 15% 10%,
              color-mix(in srgb, #4f46e5 5%, transparent),
              transparent 40%
            ),
            radial-gradient(
              circle at 85% 90%,
              color-mix(in srgb, #db2777 5%, transparent),
              transparent 40%
            ),
            ${t.bg};
        `
      : css`
          height: ${$height}px;
        `}
  ${({ $dropping }) =>
    $dropping &&
    css`
      box-shadow: inset 0 0 0 3px color-mix(in srgb, ${t.accent} 45%, transparent);
    `}
  &:focus-visible,
  &:focus {
    box-shadow: inset 0 0 0 2px ${t.accentSoft};
  }
  ${({ $pan }) =>
    $pan &&
    css`
      ${Bg} {
        cursor: grabbing;
      }
    `}
`;

export const Root = styled.div<{ $fill: boolean }>`
  min-width: 0;
  ${({ $fill }) =>
    $fill &&
    css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    `}
`;
