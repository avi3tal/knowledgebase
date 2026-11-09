import styled, { css } from "styled-components";
import { fadeUp, rdIn } from "../theme/animations";
import { Card, difficultyColor } from "../theme/primitives";
import { t } from "../theme/theme";

// ---------------------------------------------------------------- left pane

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/** Search box of the problem lists (also reused by the problems page toolbar). */
export const Filter = styled.input`
  position: sticky;
  top: -12px;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  border-radius: 9px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.9em;
  cursor: text;
  &:focus {
    outline: none;
    border-color: ${t.accent};
    box-shadow: 0 0 0 3px ${t.accentSoft};
  }
`;

export const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
`;

export const Count = styled.span`
  margin-left: auto;
  padding: 0 7px;
  border-radius: 99px;
  background: color-mix(in srgb, currentColor 15%, transparent);
`;

export const Group = styled.section<{ $difficulty: string }>`
  --group: ${({ $difficulty }) => difficultyColor($difficulty)};
  h4 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 4px;
    font-size: 0.74em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--group);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
`;

export const Item = styled.li<{ $i: number }>`
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 18}ms;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Prob = styled.a<{ $current: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  border-left: 3px solid transparent;
  color: ${t.text};
  font-size: 0.9em;
  transition:
    background 0.15s,
    padding 0.15s;
  &:hover {
    text-decoration: none;
    background: ${t.panel2};
    padding-left: 11px;
  }
  ${({ $current }) =>
    $current &&
    css`
      background: color-mix(in srgb, var(--group) 14%, transparent);
      border-left-color: var(--group);
      font-weight: 700;
    `}
`;

export const ProbTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProbCount = styled.span`
  font-size: 0.75em;
  color: ${t.muted};
  background: ${t.panel2};
  border-radius: 99px;
  padding: 0 6px;
`;

export const ProbStatus = styled.span<{ $status: string }>`
  width: 1.2em;
  text-align: center;
  font-weight: 700;
  color: ${({ $status }) => ($status === "solved" ? t.ok : $status === "failing" ? t.bad : t.muted)};
`;

// ---------------------------------------------------------------- chips

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 4px 0;
`;

export const Chip = styled.span<{
  $kind: "topic" | "tech" | "pattern" | "covers";
  $plain?: boolean;
}>`
  --chip: ${({ $kind }) =>
    $kind === "tech"
      ? t.tech
      : $kind === "pattern"
        ? t.pattern
        : $kind === "covers"
          ? t.warn
          : t.accent};
  display: inline-block;
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 0.82em;
  font-weight: 600;
  color: var(--chip);
  background: color-mix(in srgb, var(--chip) 12%, transparent);
  border: 1px ${({ $plain }) => ($plain ? "dashed" : "solid")}
    color-mix(in srgb, var(--chip) 30%, transparent);
  transition:
    background 0.15s,
    transform 0.15s;
  ${({ $kind }) =>
    $kind === "covers" &&
    css`
      font-family: ${t.fontMono};
      font-size: 0.75em;
    `}
  a&:hover {
    text-decoration: none;
    background: color-mix(in srgb, var(--chip) 22%, transparent);
    transform: translateY(-1px);
  }
`;

// ---------------------------------------------------------------- right pane

export const Otp = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  & > ${Card} {
    margin-top: 0;
  }
`;

export const Progress = styled.div`
  height: 6px;
  border-radius: 99px;
  background: ${t.panel2};
  overflow: hidden;
`;

/** Scales with the reading progress; set through attrs so scrolling does not mint a class per value. */
export const ProgressBar = styled.div.attrs<{ $progress: number }>(({ $progress }) => ({
  style: { transform: `scaleX(${$progress})` },
}))<{ $progress: number }>`
  height: 100%;
  transform-origin: left;
  background: ${t.accent};
  transition: transform 0.25s ease-out;
`;

export const Toc = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 2px solid ${t.border};
`;

export const TocItem = styled.li<{ $on: boolean }>`
  margin-left: -2px;
  border-left: 2px solid ${({ $on }) => ($on ? t.accent : "transparent")};
  transition: border-color 0.2s;
`;

export const TocButton = styled.button<{ $level: number; $on: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  padding: 3px ${({ $level }) => ($level === 3 ? "22px" : "10px")};
  font: inherit;
  font-size: ${({ $level }) => ($level === 3 ? "0.8em" : "0.86em")};
  line-height: 1.35;
  color: ${t.muted};
  cursor: pointer;
  border-radius: 0 6px 6px 0;
  transition:
    color 0.15s,
    background 0.15s;
  &:hover:not(:disabled) {
    color: ${t.text};
    background: ${t.panel2};
  }
  ${({ $on }) =>
    $on &&
    css`
      &,
      &:hover:not(:disabled) {
        color: ${t.accent};
        font-weight: 700;
        background: ${t.accentSoft};
      }
    `}
`;

// ---------------------------------------------------------------- centre column (shared by the readers)

/** The reading column of a reader page. */
export const Center = styled.div`
  max-width: ${t.readW};
  margin: 0 auto;
  animation: ${rdIn} 0.35s ease both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * The article wrapper around rendered Markdown. The doubled `&&` keeps these reader-specific
 * element rules ahead of the Markdown component's own typography.
 */
export const Article = styled.article`
  && h2,
  && h3 {
    scroll-margin-top: 12px;
  }
  && h2:first-child {
    margin-top: 0.4em;
  }
  && table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 12px 0 16px;
    font-size: 0.92em;
    border: 1px solid ${t.border};
    border-radius: 10px;
    overflow: hidden;
    background: ${t.panel};
    box-shadow: ${t.shadow};
  }
  && th {
    text-align: left;
    padding: 8px 12px;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${t.muted};
    background: ${t.panel2};
    border-bottom: 1px solid ${t.border};
  }
  && td {
    padding: 8px 12px;
    vertical-align: top;
    border-bottom: 1px solid ${t.border};
  }
  && tr:last-child td {
    border-bottom: 0;
  }
  && tbody tr:nth-child(even) td {
    background: color-mix(in srgb, ${t.panel2} 45%, transparent);
  }
  && tbody tr:hover td {
    background: ${t.accentSoft};
  }
  /* Options tables: the chosen option is bold in the first column. */
  && td:first-child:has(strong) {
    box-shadow: inset 3px 0 0 ${t.ok};
  }
  && tr:has(td:first-child strong) td {
    background: color-mix(in srgb, ${t.ok} 9%, transparent);
  }
  && blockquote {
    border-left-color: ${t.accent};
    background: ${t.accentSoft};
    padding: 8px 14px;
    border-radius: 0 8px 8px 0;
  }
`;

// ---------------------------------------------------------------- attempts list (shared by the readers)

export const AttemptList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export type AttemptState = "done" | "fail" | "none" | "";

export const AttemptItem = styled.li<{ $i: number; $stacked?: boolean }>`
  display: ${({ $stacked }) => ($stacked ? "block" : "flex")};
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 30}ms;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateX(3px);
    box-shadow: ${t.shadow};
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const AttemptDot = styled.span<{ $state: AttemptState }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $state }) =>
    $state === "done" ? t.ok : $state === "fail" ? t.bad : $state === "none" ? t.muted : t.warn};
`;

export const AttemptName = styled.a`
  flex: 1;
  min-width: 0;
  font-family: ${t.fontMono};
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Tag = styled.span<{ $tone?: "ok" | "bad" }>`
  font-size: 0.75em;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 99px;
  color: ${({ $tone }) => ($tone === "ok" ? t.ok : $tone === "bad" ? t.bad : t.warn)};
  background: color-mix(
    in srgb,
    ${({ $tone }) => ($tone === "ok" ? t.ok : $tone === "bad" ? t.bad : t.warn)} 15%,
    transparent
  );
`;

export const VsCode = styled.a`
  font-size: 0.82em;
  color: ${t.muted};
`;

export const OpenLink = styled.a`
  font-weight: 600;
  font-size: 0.88em;
`;

/** "Start a new attempt" card. */
export const NewAttempt = styled(Card)`
  margin-bottom: 18px;
  h3 {
    margin: 0 0 8px;
    font-size: 0.74em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${t.muted};
  }
`;

/** Tutor review under an attempt (collapsible). */
export const Review = styled.details`
  margin: 10px 0;
  border: 1px solid ${t.border};
  border-left: 4px solid ${t.violet};
  border-radius: 12px;
  padding: 6px 14px;
  background: color-mix(in srgb, ${t.violet} 5%, ${t.panel});
  summary {
    cursor: pointer;
    font-weight: 700;
  }
`;
