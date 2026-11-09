/**
 * Styles shared by the Learn / Progress pages (home, lesson, topic, map, dashboard): cards, the
 * stacked right-pane column, topic cards, tiles, difficulty badges and the page footer.
 * Component-specific styles live in each component's own `.style.ts`.
 */
import styled, { css } from "styled-components";
import { fadeUp, lbPop, lbRise } from "../theme/animations";
import { t } from "../theme/theme";

/** Difficulty tint (the old `.badge`: small uppercase pill). */
const badgeColor = (d: string): string =>
  d === "easy" ? t.easy : d === "medium" ? t.medium : d === "hard" ? t.hard : t.muted;

export const Badge = styled.span<{ $difficulty: string }>`
  font-size: 0.72em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 700;
  color: ${({ $difficulty }) => badgeColor($difficulty)};
  background: color-mix(in srgb, ${({ $difficulty }) => badgeColor($difficulty)} 20%, transparent);
`;

/** Bordered card of the side panes. */
export const RdCard = styled.section`
  border: 1px solid ${t.border};
  border-radius: 12px;
  padding: 10px 12px;
  background: ${t.bg};
  h4,
  h3 {
    margin: 0 0 8px;
    font-size: 0.74em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${t.muted};
  }
`;

/** A Learn page side card: rises in; `$color` adds the group stripe. */
export const LearnCard = styled(RdCard)<{ $color?: string }>`
  animation: ${lbRise} 0.35s ease both;
  ${({ $color }) =>
    $color &&
    css`
      border-left: 3px solid ${$color};
    `}
  h4 {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  p {
    margin: 0;
  }
`;

/** Vertical stack of side cards. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/** The big count in a stats row ("12 problems"). */
export const Stats = styled.div`
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

/** Reading column of a Learn page; wide figures and traces break out of it. */
export const LbCenter = styled.div`
  max-width: ${t.readW};
  margin: 0 auto;
  animation: ${lbRise} 0.3s ease both;
  /* TODO(lead): figures / traces are still matched by their old class names until they migrate */
  .fig:not(.expanded),
  .trace {
    --wide: min(1040px, calc(100cqw - 48px));
    width: var(--wide);
    max-width: none;
    margin-left: calc(50% - var(--wide) / 2);
  }
`;

/** Page footer line: counts separated by gaps. */
export const Footer = styled.div`
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  b {
    color: ${t.text};
  }
`;

/** Large button (links and buttons in side panes and hero cards). */
export const RdButton = styled.button<{ $variant?: "default" | "primary" | "ghost" }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 8px 16px;
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

/** Group colour dot with a halo (tabs, filters, card headings). */
export const Swatch = styled.span<{ $color?: string }>`
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $color }) => $color ?? t.accent};
  box-shadow: 0 0 0 3px color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 20%, transparent);
`;

/** Plain group colour dot (group titles). */
export const Dot = styled.span<{ $color?: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color ?? t.accent};
`;

/** Tab label that takes the group colour while its tab is on. */
export const TabLabel = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  ${({ $color }) =>
    $color &&
    css`
      color: ${$color};
    `}
`;

export const GroupTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15em;
  margin: 26px 0 10px;
`;

/** Notice bar with a warning edge; `$row` lays its content out in a wrapping row. */
export const Callout = styled.div<{ $row?: boolean }>`
  background: ${t.panel2};
  border-left: 3px solid ${t.warn};
  padding: 10px 14px;
  border-radius: 6px;
  margin: 12px 0;
  ${({ $row }) =>
    $row &&
    css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    `}
`;

/* ------------------------------------------------------------------ topic cards */

export const CardGrid = styled.div<{ $min?: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ $min }) => $min ?? 240}px, 1fr));
  gap: 14px;
`;

/** A topic (or design problem) card; `$color` is the group colour. */
export const TopicCard = styled.a<{ $color?: string; $i: number; $planned?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 12px;
  border-radius: ${t.radius};
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  color: ${t.text};
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s;
  animation: ${fadeUp} 0.4s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 30) * 18}ms;
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    ${({ $color }) =>
      $color &&
      css`
        background: ${$color};
      `}
  }
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${t.shadowLift};
    ${({ $color }) =>
      $color &&
      css`
        border-color: ${$color};
      `}
    text-decoration: none;
  }
  ${({ $planned }) =>
    $planned &&
    css`
      opacity: 0.55;
      cursor: default;
      pointer-events: none;
    `}
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
`;

export const CardIcon = styled.span<{ $color?: string }>`
  font-size: 1.4em;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  ${({ $color }) =>
    $color &&
    css`
      background: color-mix(in srgb, ${$color} 14%, transparent);
    `}
  transition: transform 0.25s ease;
  ${TopicCard}:hover & {
    transform: rotate(-8deg) scale(1.08);
  }
`;

export const CardOrder = styled.span<{ $color?: string }>`
  font-size: 0.78em;
  font-weight: 700;
  color: ${({ $color }) => $color ?? "inherit"};
`;

export const CardName = styled.div`
  font-weight: 700;
  font-size: 1.02em;
`;

export const CardUsage = styled.div`
  color: ${t.muted};
  font-size: 0.86em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardFoot = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
`;

export const CardPill = styled.span<{ $kind?: "lesson" | "due"; $color?: string }>`
  font-size: 0.75em;
  border-radius: 999px;
  padding: 1px 9px;
  background: ${t.panel2};
  color: ${t.muted};
  ${({ $kind, $color }) =>
    $kind === "lesson"
      ? css`
          background: ${$color ?? t.accent};
          color: #fff;
          font-weight: 600;
        `
      : $kind === "due"
        ? css`
            background: color-mix(in srgb, ${t.warn} 20%, transparent);
            color: ${t.warn};
          `
        : ""}
`;

/* ------------------------------------------------------------------ tiles */

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
`;

export const tileCss = css`
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  border-radius: ${t.radius};
  padding: 12px 14px;
`;

/** A topic tile linking to its page (knowledge map grid). */
export const TopicTile = styled.a<{ $planned?: boolean }>`
  ${tileCss}
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${t.text};
  &:hover {
    border-color: ${t.accent};
    text-decoration: none;
  }
  ${({ $planned }) =>
    $planned &&
    css`
      opacity: 0.55;
      cursor: default;
      pointer-events: none;
    `}
`;

export const Small = styled.span`
  font-size: 0.85em;
`;

/* ------------------------------------------------------------------ topic links */

export const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 4px 0;
`;

export const Link = styled.a<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 35%, transparent);
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 10%, transparent);
  color: ${t.text};
  font-size: 0.85em;
  text-decoration: none;
  transition:
    transform 0.15s,
    background 0.15s;
  &:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 20%, transparent);
    text-decoration: none;
  }
`;

export const LinkTag = styled.span<{ $color?: string }>`
  font-size: 0.72em;
  font-weight: 700;
  color: ${({ $color }) => $color ?? t.accent};
`;

/** Hero ring (pops in); used in page headers. */
export const HeroRing = styled.div`
  flex: 0 0 auto;
  animation: ${lbPop} 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);
`;
