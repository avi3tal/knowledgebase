import styled, { css } from "styled-components";
import type { ScenarioTone } from "../figures";
import { figMarch, figProgress } from "../theme/animations";
import { t } from "../theme/theme";
import { WIDE } from "./TracePlayer.style";
import { Views } from "./StructureFigure.style";

/* ---------------------------------------------------------------- figure frame */

const TONE_COLOR: Record<ScenarioTone, string> = {
  happy: t.ok,
  failure: t.bad,
  risk: t.bad,
  edge: t.warn,
  alternative: t.cyan,
  scale: "#7c3aed", // TODO(token)
};
const toneColor = (tone: ScenarioTone | undefined): string => (tone ? TONE_COLOR[tone] : t.accent);

const box = css`
  margin: 22px 0 26px;
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  background: ${t.panel};
  box-shadow: ${t.shadow};
  overflow: hidden;
`;

/** Wide content breaks out of the reading column: centred on it, up to 1040px. */
const breakout = css`
  width: ${WIDE};
  max-width: none;
  margin-left: calc(50% - ${WIDE} / 2);
`;

/**
 * The look of DiagramCanvas internals while a figure is playing (class names owned by
 * DiagramCanvas: dg-node, dg-edge, dg-packet, dg-fail-mark…). Kept here because these rules only
 * exist for lesson figures; they must follow DiagramCanvas's markup.
 */
const diagramPresentation = css`
  .dg-label {
    font-size: 12px;
  }
  .dg-packet {
    fill: ${t.accent};
    stroke: ${t.panel};
    stroke-width: 2;
    filter: drop-shadow(0 0 4px ${t.accent});
  }
  .dg-fail-mark circle {
    fill: ${t.bad};
    stroke: ${t.panel};
    stroke-width: 2;
  }
  .dg-fail-mark text {
    fill: #fff;
    font-size: 13px;
    font-weight: 800;
  }
  .dg-node.is-failed .dg-card {
    stroke: ${t.bad} !important;
    stroke-dasharray: 6 4;
  }
  .dg-edge.is-failed .dg-edge-line {
    stroke: ${t.bad} !important;
    stroke-dasharray: 6 5;
  }
  @media (prefers-reduced-motion: reduce) {
    .dg-packets {
      display: none;
    }
  }
`;

const diagramStepping = css`
  .dg-node:not(.is-new),
  .dg-edge:not(.is-new) {
    opacity: 0.28;
    transition: opacity 0.25s;
  }
  .dg-node.is-failed,
  .dg-edge.is-failed {
    opacity: 1;
  }
  .dg-edge.is-new .dg-edge-line {
    stroke-dasharray: 8 6;
    animation: ${figMarch} 0.7s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .dg-edge.is-new .dg-edge-line {
      animation: none;
    }
  }
`;

export const Fig = styled.figure<{ $stepping?: boolean; $expanded?: boolean }>`
  ${box}
  ${({ $expanded }) =>
    $expanded
      ? css`
          position: fixed;
          inset: 18px;
          z-index: 1000;
          margin: 0;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 0 0 100vmax rgba(10, 14, 28, 0.55),
            ${t.shadowLift};
        `
      : breakout}
  ${diagramPresentation}
  ${({ $stepping }) => $stepping && diagramStepping}
  ${({ $expanded }) =>
    $expanded &&
    css`
      ${Views} {
        overflow: auto;
      }
    `}
`;

/** Stands where an expanded figure came from, so the page doesn't jump. */
export const Placeholder = styled.div`
  ${box}
  ${breakout}
  min-height: 120px;
`;

export const Head = styled.figcaption`
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel2};
`;

export const Num = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${t.accent};
`;

export const Title = styled.span`
  font-weight: 650;
`;

export const ExpandBtn = styled.button`
  margin-left: auto;
  border: 1px solid ${t.border};
  background: ${t.panel};
  color: ${t.muted};
  border-radius: 8px;
  padding: 2px 10px;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover {
    color: ${t.accent};
    border-color: ${t.accent};
  }
`;

export const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px 0;
`;

export const Tab = styled.button<{ $tone: ScenarioTone; $on?: boolean }>`
  border: 1px solid ${({ $on, $tone }) => ($on ? toneColor($tone) : t.border)};
  background: ${({ $on, $tone }) =>
    $on ? `color-mix(in srgb, ${toneColor($tone)} 12%, ${t.panel})` : t.panel};
  color: ${t.text};
  border-radius: 999px;
  padding: 4px 12px;
  font: inherit;
  font-size: 0.84rem;
  font-weight: ${({ $on }) => ($on ? 650 : "inherit")};
  cursor: pointer;
`;

export const Summary = styled.p<{ $tone: ScenarioTone }>`
  margin: 8px 16px 0;
  padding: 6px 10px;
  border-left: 3px solid ${({ $tone }) => toneColor($tone)};
  background: color-mix(in srgb, ${({ $tone }) => toneColor($tone)} 7%, ${t.panel});
  border-radius: 0 8px 8px 0;
  font-size: 0.9rem;
`;

export const Body = styled.div<{ $expanded?: boolean }>`
  padding: 12px;
  display: flex;
  justify-content: center;
  & > * {
    width: 100%;
  }
  ${({ $expanded }) =>
    $expanded &&
    css`
      flex: 1;
      min-height: 0;
      & > * {
        height: 100%;
      }
    `}
`;

export const Caption = styled.p`
  margin: 0;
  padding: 0 16px 12px;
  color: ${t.muted};
  font-size: 0.86rem;
`;

/* ---------------------------------------------------------------- step controls */

export const Steps = styled.div`
  border-top: 1px dashed ${t.border};
  padding: 10px 16px 12px;
`;

export const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

export const Btn = styled.button<{ $primary?: boolean }>`
  border: 1px solid ${({ $primary }) => ($primary ? t.accent : t.border)};
  background: ${({ $primary }) => ($primary ? t.accent : t.panel)};
  color: ${({ $primary }) => ($primary ? t.onAccent : t.text)};
  border-radius: 8px;
  padding: 4px 10px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: ${({ $primary }) => ($primary ? 600 : "inherit")};
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const Dots = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: 6px;
`;

export const Dot = styled(Btn)<{ $state?: "on" | "done" }>`
  && {
    width: 26px;
    height: 26px;
    padding: 0;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
    ${({ $state }) =>
      $state === "on"
        ? css`
            background: ${t.accent};
            border-color: ${t.accent};
            color: ${t.onAccent};
          `
        : $state === "done"
          ? css`
              background: ${t.accentSoft};
              border-color: ${t.accentSoft};
            `
          : ""}
  }
`;

/** Time-bar of the auto-playing step; `$ms` is the step length. */
export const Progress = styled.span<{ $ms: number }>`
  flex: 1 1 60px;
  max-width: 120px;
  height: 4px;
  border-radius: 2px;
  background: ${t.accentSoft};
  position: relative;
  overflow: hidden;
  margin-left: 6px;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: ${t.accent};
    transform-origin: left;
    animation: ${figProgress} ${({ $ms }) => $ms}ms linear forwards;
  }
`;

export const Narration = styled.p<{ $bad?: boolean }>`
  margin: 10px 0 0;
  min-height: 1.6em;
  b {
    color: ${({ $bad }) => ($bad ? t.bad : t.accent)};
  }
`;

/* ---------------------------------------------------------------- svg figures */

/** Root of a sequence / flowchart / uml drawing; `$maxWidth` is its natural width. */
export const Svg = styled.svg<{ $maxWidth?: number }>`
  display: block;
  margin: 0 auto;
  width: 100%;
  height: auto;
  font-family: inherit;
  ${({ $maxWidth }) => $maxWidth !== undefined && `max-width: ${$maxWidth}px;`}
  ${Fig}[data-expanded="true"] & {
    max-width: none !important;
    height: 100%;
  }
`;

/** The red cross of a failed step. */
export const FailMark = styled.text`
  fill: ${t.bad};
  font-size: 16px;
  font-weight: 800;
`;

/** Marching ants on the active arrow. */
const march = css`
  stroke-dasharray: 8 6;
  animation: ${figMarch} 0.7s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** A dot travelling along an active arrow. */
export const Packet = styled.circle<{ $bad?: boolean }>`
  fill: ${({ $bad }) => ($bad ? t.bad : t.accent)};
  stroke: ${t.panel};
  stroke-width: 2;
  filter: drop-shadow(0 0 4px ${({ $bad }) => ($bad ? t.bad : t.accent)});
  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const haloText = css`
  paint-order: stroke;
  stroke: ${t.panel};
  stroke-width: 4px;
  stroke-linejoin: round;
`;

/* ---- sequence ---- */

export const SeqLife = styled.line`
  stroke: ${t.border};
  stroke-width: 2;
  stroke-dasharray: 5 5;
`;

export const SeqActor = styled.rect<{ $color: string }>`
  fill: ${t.panel};
  stroke: ${({ $color }) => $color};
  stroke-width: 2;
`;

export const SeqActorLabel = styled.text`
  fill: ${t.text};
  font-size: 13px;
  font-weight: 650;
  text-anchor: middle;
`;

export type SeqStyle = "call" | "reply" | "error" | "self" | "lost" | "async";
export type SeqState = "" | "on" | "done" | "later";

const seqLabelLook = (style: SeqStyle, state: SeqState) => {
  const on = state === "on";
  const fill =
    style === "lost" || style === "error"
      ? t.bad
      : style === "reply"
        ? on
          ? t.accent
          : t.muted
        : on
          ? t.accent
          : t.text;
  const weight = on ? 700 : style === "error" ? 650 : "normal";
  return css`
    fill: ${fill};
    font-weight: ${weight};
  `;
};

export const SeqMsg = styled.g<{ $kind: SeqStyle; $state: SeqState }>`
  ${({ $state }) => ($state === "later" ? "opacity: 0.18;" : $state === "done" ? "opacity: 0.55;" : "")}
  path {
    stroke: ${t.text};
    stroke-width: 1.8;
    fill: none;
  }
  ${({ $state }) =>
    $state === "on" &&
    css`
      path {
        stroke: ${t.accent};
        stroke-width: 3;
      }
    `}
  ${({ $kind }) =>
    $kind === "lost" &&
    css`
      path {
        stroke: ${t.bad};
        stroke-dasharray: 4 4;
      }
    `}
  ${({ $state }) =>
    $state === "on" &&
    css`
      path {
        ${march}
      }
    `}
  ${({ $kind }) =>
    $kind === "error" &&
    css`
      ${Packet} {
        fill: ${t.bad};
        filter: drop-shadow(0 0 4px ${t.bad});
      }
    `}
`;

export const SeqLabel = styled.text<{ $kind: SeqStyle; $state: SeqState }>`
  font-size: 12.5px;
  ${haloText}
  ${({ $kind, $state }) => seqLabelLook($kind, $state)}
`;

export const SeqHead = styled.path<{ $tone: "call" | "reply" | "error" }>`
  fill: ${({ $tone }) => ($tone === "error" ? t.bad : $tone === "reply" ? t.muted : t.text)};
`;

/* ---- flowchart ---- */

export type FlowState = "" | "dim" | "on" | "failed";
export type FlowNodeType = "start" | "end" | "step" | "decision";

export const FlowHead = styled.path`
  fill: ${t.muted};
`;

export const FlowEdgeLabel = styled.text`
  fill: ${t.muted};
  font-size: 12px;
  font-weight: 600;
  ${haloText}
`;

export const FlowEdge = styled.g<{ $state: FlowState; $no?: boolean }>`
  ${({ $state }) => $state === "dim" && "opacity: 0.25;"}
  path {
    stroke: ${({ $no }) => ($no ? t.bad : t.muted)};
    stroke-width: 1.8;
    fill: none;
  }
  ${({ $state }) =>
    $state === "on"
      ? css`
          path {
            stroke: ${t.accent};
            stroke-width: 3;
            ${march}
          }
          ${FlowEdgeLabel} {
            fill: ${t.accent};
          }
        `
      : $state === "failed"
        ? css`
            path {
              stroke: ${t.bad};
              stroke-dasharray: 6 5;
            }
          `
        : ""}
`;

export const FlowNode = styled.g<{
  $type: FlowNodeType;
  $tone?: string;
  $state: FlowState;
}>`
  ${({ $state }) => $state === "dim" && "opacity: 0.25;"}
  rect,
  path {
    fill: ${t.panel};
    stroke: ${t.accent};
    stroke-width: 2;
  }
  ${({ $type }) =>
    $type === "start" || $type === "end"
      ? css`
          rect {
            fill: ${t.accentSoft};
          }
        `
      : ""}
  ${({ $type }) =>
    $type === "decision"
      ? css`
          path {
            stroke: ${t.warn};
            fill: color-mix(in srgb, ${t.warn} 10%, ${t.panel});
          }
        `
      : ""}
  ${({ $type }) =>
    $type === "end" &&
    css`
      rect {
        stroke: ${t.ok};
      }
    `}
  text {
    fill: ${t.text};
    font-size: 13px;
    font-weight: 600;
  }
  ${({ $state }) =>
    $state === "on" &&
    css`
      rect,
      path {
        stroke-width: 3.5;
        filter: drop-shadow(0 0 6px ${t.accentSoft});
      }
    `}
  ${({ $tone }) =>
    $tone === "good"
      ? css`
          rect,
          path {
            stroke: ${t.ok};
          }
        `
      : $tone === "bad"
        ? css`
            rect,
            path {
              stroke: ${t.bad};
              fill: color-mix(in srgb, ${t.bad} 8%, ${t.panel});
            }
          `
        : ""}
  ${({ $state }) =>
    $state === "failed" &&
    css`
      rect,
      path {
        stroke: ${t.bad};
        stroke-dasharray: 6 4;
      }
    `}
`;
