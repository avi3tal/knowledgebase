/**
 * Styles of the shared Practice pieces (problems, problem, progress, sessions) plus the layout
 * blocks those pages share: centre column, side stack, footer row, empty state, score card.
 */
import styled, { css } from "styled-components";
import { fadeUp, growX, pbIn, pop, pulse } from "../theme/animations";
import { Card, difficultyColor } from "../theme/primitives";
import { t } from "../theme/theme";

// ---------------------------------------------------------------- layout blocks

/** The centre column of a Practice page. `$narrow` is the reader width (problem page). */
export const Center = styled.div<{ $narrow?: boolean }>`
  max-width: ${({ $narrow }) => ($narrow ? "920px" : "1100px")};
  margin: 0 auto;
  animation: ${pbIn} 0.35s ease both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Right-pane stack of cards; they rise in one after another. */
export const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  & > ${Card} {
    margin-top: 0;
    animation: ${fadeUp} 0.35s ease both;
  }
  & > ${Card}:nth-child(2) {
    animation-delay: 60ms;
  }
  & > ${Card}:nth-child(3) {
    animation-delay: 120ms;
  }
  & > ${Card}:nth-child(4) {
    animation-delay: 180ms;
  }
`;

/** Content of a Workbench footer: grows, wraps, centres its items. */
export const FooterRow = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Empty = styled.div`
  margin: 48px auto;
  max-width: 420px;
  text-align: center;
  color: ${t.muted};
  animation: ${fadeUp} 0.4s ease both;
`;

export const EmptyIcon = styled.div`
  font-size: 2.6em;
  animation: ${pulse} 2.4s ease-in-out infinite;
`;

/** Group heading above a list of cards / items. */
export const GroupTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15em;
  margin: 26px 0 10px;
`;

/** "3 attempts · 2 passing" counters of a practice card. */
export const PracticeStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: ${t.muted};
  b {
    display: block;
    font-size: 1.4em;
    color: ${t.text};
  }
`;

// ---------------------------------------------------------------- copyable commands

/** A command that copies itself on click. `$inline` is the narrow form inside attempt rows. */
export const Cmd = styled.code<{ $inline?: boolean }>`
  cursor: copy;
  display: ${({ $inline }) => ($inline ? "inline-block" : "block")};
  ${({ $inline }) => $inline && "max-width: 7em;"}
  padding: 4px 8px;
  border-radius: 7px;
  border: 1px dashed ${t.border};
  font-size: 0.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    border-color 0.15s,
    background 0.15s;
  &:hover {
    border-color: ${t.accent};
    background: ${t.accentSoft};
  }
`;

/** Commands stacked in a column (right pane, new-attempt card). */
export const CmdStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

// ---------------------------------------------------------------- status bar

/** `$inline` lays bar and legend out in one row (workbench footers). */
export const StatBar = styled.div<{ $inline?: boolean }>`
  flex: 1;
  min-width: 80px;
  ${({ $inline }) =>
    $inline &&
    css`
      flex: 0 1 260px;
      display: flex;
      align-items: center;
      gap: 10px;
    `}
`;

export const Bar = styled.div<{ $inline?: boolean }>`
  display: flex;
  height: 8px;
  border-radius: 99px;
  overflow: hidden;
  background: ${t.panel2};
  ${({ $inline }) => $inline && "flex: 1;"}
`;

/** Width is set through attrs: every count would otherwise mint its own class. */
export const BarFill = styled.span.attrs<{ $width: string }>(({ $width }) => ({
  style: { width: $width },
}))<{ $kind: "solved" | "failing"; $width: string }>`
  height: 100%;
  transform-origin: left;
  animation: ${growX} 0.6s ease both;
  background: ${({ $kind }) =>
    $kind === "solved"
      ? `linear-gradient(90deg, ${t.ok}, #14b8a6)` // TODO(token)
      : `linear-gradient(90deg, ${t.bad}, ${t.core})`};
`;

export const Legend = styled.div<{ $inline?: boolean }>`
  display: flex;
  gap: 10px;
  margin-top: ${({ $inline }) => ($inline ? "0" : "4px")};
  font-size: 0.8em;
  font-weight: 600;
`;

export const LegendItem = styled.span<{ $kind: "solved" | "failing" | "untried" }>`
  color: ${({ $kind }) => ($kind === "solved" ? t.ok : $kind === "failing" ? t.bad : t.muted)};
`;

export const LegendPct = styled.span`
  margin-left: auto;
  color: ${t.muted};
`;

/** A labelled number in a page header. */
export const StatBox = styled.span<{ $tone?: string }>`
  b {
    margin-right: 4px;
    font-size: 1.15em;
    color: ${({ $tone }) =>
      $tone === "ok"
        ? t.ok
        : $tone === "bad"
          ? t.bad
          : $tone === "warn"
            ? t.warn
            : $tone === "accent"
              ? t.accent
              : t.text};
  }
`;

// ---------------------------------------------------------------- sessions (shared by list and view)

export const ScoreCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
`;

export const ScoreRing = styled.div`
  display: grid;
  place-items: center;
  animation: ${pop} 0.45s ease both;
  text {
    font-size: 1.4em;
    font-weight: 800;
  }
`;

export const ProgressTrack = styled.div`
  height: 6px;
  border-radius: 6px;
  background: ${t.panel2};
  overflow: hidden;
`;

/** Amber-to-pink gradient: TODO(token) when the theme gets a session accent. */
export const ProgressFill = styled.span.attrs<{ $fraction: number }>(({ $fraction }) => ({
  style: { width: `${$fraction * 100}%` },
}))<{ $fraction: number }>`
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ec4899);
  border-radius: 6px;
  animation: ${growX} 0.9s ease both;
  transform-origin: left;
`;

export const StatusDot = styled.span<{ $status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: ${({ $status }) =>
    $status === "active"
      ? "#f59e0b" // TODO(token)
      : $status === "planned"
        ? "#6366f1" // TODO(token)
        : $status === "done"
          ? t.ok
          : t.muted};
  ${({ $status }) =>
    $status === "active" &&
    css`
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
      animation: ${pulse} 1.8s infinite;
    `}
`;

export const StatusBadge = styled.span`
  background: rgba(255, 255, 255, 0.95);
  color: #1c2233;
  border-radius: 999px;
  padding: 1px 10px;
  font-weight: 700;
  font-size: 0.85em;
`;

export const ScoreChip = styled.span<{ $band: string }>`
  font-size: 0.78em;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 10px;
  background: ${t.panel2};
  color: ${({ $band }) =>
    $band === "high" ? t.ok : $band === "mid" ? t.warn : $band === "low" ? t.bad : t.muted};
`;

/** State word of a session item (to do / started / attempted / solved). */
export const State = styled.span<{ $state: string }>`
  font-size: 0.72em;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 600;
  ${({ $state }) =>
    $state === "solved"
      ? css`
          background: color-mix(in srgb, ${t.ok} 18%, transparent);
          color: ${t.ok};
        `
      : $state === "attempted"
        ? css`
            background: color-mix(in srgb, ${t.warn} 18%, transparent);
            color: ${t.warn};
          `
        : css`
            background: ${t.panel2};
            color: ${t.muted};
          `}
`;

// ---------------------------------------------------------------- difficulty badge

/** Small uppercase difficulty label (the old `.badge`). */
export const Badge = styled.span<{ $difficulty: string }>`
  font-size: 0.72em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 700;
  color: ${({ $difficulty }) => difficultyColor($difficulty)};
  background: color-mix(
    in srgb,
    ${({ $difficulty }) => difficultyColor($difficulty)} 20%,
    transparent
  );
`;

// ---------------------------------------------------------------- action button (the old `.rd-btn`)

export const ActionButton = styled.button<{
  $variant?: "default" | "primary" | "ghost";
  $compact?: boolean;
}>`
  display: inline-flex;
  flex-direction: ${({ $compact }) => ($compact ? "row" : "column")};
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: ${({ $compact }) => ($compact ? "5px 14px" : "8px 16px")};
  border-radius: 10px;
  font-weight: 700;
  border: 1px solid ${t.border};
  background: ${t.panel};
  color: ${t.text};
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${t.shadowLift};
  }
  ${({ $variant }) =>
    $variant === "primary"
      ? css`
          border: 0;
          color: ${t.panel};
          background: ${t.text};
        `
      : $variant === "ghost"
        ? css`
            background: ${t.accentSoft};
            border-color: ${t.accent};
            color: ${t.accent};
          `
        : ""}
`;

// ---------------------------------------------------------------- plan with Claude

export const ClaudeCard = styled(Card)`
  p {
    margin: 0 0 6px;
    font-size: 0.85em;
  }
`;
