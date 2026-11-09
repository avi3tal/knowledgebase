import styled, { css } from "styled-components";
import { fadeUp, pbIn, pop, pulse } from "../theme/animations";
import { t } from "../theme/theme";
import { RdCard, tileCss } from "./LearnBenchParts.style";

export const Center = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  animation: ${pbIn} 0.35s ease both;
`;

export const Group = styled.section`
  margin-bottom: 20px;
`;

export const TabDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const Tile = styled.div<{ $color: string; $i: number; $current: boolean }>`
  ${tileCss}
  position: relative;
  border-top: 3px solid ${({ $color }) => $color};
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  ${({ $current, $i }) =>
    $current
      ? css`
          animation: ${pop} 0.5s ease both;
        `
      : css`
          animation: ${fadeUp} 0.35s ease both;
          animation-delay: ${Math.min($i, 20) * 30}ms;
        `}
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${t.shadowLift};
  }
  ${({ $current, $color }) =>
    $current &&
    css`
      outline: 2px solid ${$color};
      outline-offset: 2px;
    `}
`;

export const TileHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

export const Mastery = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

/** Slot for the stacked status bar inside a tile. */
export const TileBar = styled.div`
  margin: 8px 0 4px;
`;

export const Advice = styled.ul`
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 0.88em;
`;

/* ---- right pane */

export const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  & > ${RdCard} {
    animation: ${fadeUp} 0.35s ease both;
  }
  & > ${RdCard}:nth-child(2) {
    animation-delay: 60ms;
  }
  & > ${RdCard}:nth-child(3) {
    animation-delay: 120ms;
  }
  & > ${RdCard}:nth-child(4) {
    animation-delay: 180ms;
  }
`;

export const DueCard = styled(RdCard)`
  border-color: color-mix(in srgb, ${t.warn} 45%, ${t.border});
`;

export const Rank = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9em;
  counter-reset: rank;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  li::before {
    counter-increment: rank;
    content: counter(rank);
    width: 1.4em;
    font-size: 0.8em;
    font-weight: 800;
    color: ${t.muted};
  }
  a {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Recent = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9em;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  a {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Num = styled.span<{ $tone: "ok" | "bad" }>`
  font-variant-numeric: tabular-nums;
  font-size: 0.82em;
  font-weight: 700;
  color: ${({ $tone }) => ($tone === "ok" ? t.ok : t.bad)};
`;

export const StatusMark = styled.span<{ $status: string }>`
  width: 1.2em;
  text-align: center;
  font-weight: 700;
  color: ${({ $status }) => ($status === "solved" ? t.ok : $status === "failing" ? t.bad : t.muted)};
`;

export const DueChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 4px 0;
`;

export const DueChip = styled.a`
  display: inline-block;
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 0.82em;
  font-weight: 600;
  color: ${t.accent};
  background: color-mix(in srgb, ${t.accent} 12%, transparent);
  border: 1px solid color-mix(in srgb, ${t.accent} 30%, transparent);
  transition:
    background 0.15s,
    transform 0.15s;
  &:hover {
    text-decoration: none;
    background: color-mix(in srgb, ${t.accent} 22%, transparent);
    transform: translateY(-1px);
  }
`;

/* ---- footer and empty state */

export const Footer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

/** Footer slot for the status bar: a bar that fills it, legend beside. */
export const FooterBar = styled.div`
  flex: 0 1 260px;
  display: flex;
  align-items: center;
  gap: 10px;
  & > * {
    flex: 1;
  }
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
