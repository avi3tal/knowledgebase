/**
 * Shared styled building blocks used across pages (buttons, pills, status words, chips, muted text,
 * loaders). Component-specific styling lives in each component's own `.style.ts`.
 */
import styled, { css } from "styled-components";
import { spin } from "./animations";
import { t } from "./theme";

export type Difficulty = "easy" | "medium" | "hard";
export type Tone = "ok" | "bad" | "warn" | "accent" | "muted";

/** Colour of a tone, e.g. a status word or a count. */
export const toneColor = (tone: Tone | undefined): string =>
  tone === "ok"
    ? t.ok
    : tone === "bad"
      ? t.bad
      : tone === "warn"
        ? t.warn
        : tone === "accent"
          ? t.accent
          : t.muted;

/** Colour of a problem / session status word. */
export const statusTone = (status: string): Tone =>
  ["solved", "done", "ok", "submitted"].includes(status)
    ? "ok"
    : ["failing", "bad"].includes(status)
      ? "bad"
      : ["started", "progress", "active"].includes(status)
        ? "warn"
        : "muted";

export const difficultyColor = (d: string): string =>
  d === "easy" ? t.easy : d === "medium" ? t.medium : d === "hard" ? t.hard : t.muted;

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel};
  color: ${t.text};
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  &:hover:not(:disabled) {
    text-decoration: none;
    border-color: ${t.text};
  }
`;

const primary = css`
  background: ${t.text};
  border-color: ${t.text};
  color: ${t.panel};
  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${t.text} 85%, ${t.panel});
  }
`;

const ghost = css`
  background: transparent;
  border-color: transparent;
  color: ${t.muted};
  &:hover:not(:disabled) {
    color: ${t.text};
    background: ${t.panel2};
    border-color: transparent;
  }
`;

const danger = css`
  color: ${t.bad};
  &:hover:not(:disabled) {
    border-color: ${t.bad};
  }
`;

export type ButtonVariant = "default" | "primary" | "ghost" | "danger";
const VARIANT = { default: css``, primary, ghost, danger };

/** A button; `as="a"` for links that look like buttons. `$size="sm"` is the compact 28px form. */
export const Button = styled.button<{ $variant?: ButtonVariant; $size?: "sm" | "md" }>`
  ${buttonBase}
  ${({ $variant }) => VARIANT[$variant ?? "default"]}
  ${({ $size }) =>
    $size === "sm" &&
    css`
      height: 28px;
      padding: 0 10px;
      font-size: 13px;
    `}
`;

/** Text-only button (looks like a link). */
export const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${t.accent};
  font: inherit;
  cursor: pointer;
  &:hover:not(:disabled) {
    text-decoration: underline;
    border-color: transparent;
  }
`;

/** Rounded coloured label: difficulty (`$difficulty`) or any tone (`$color`). */
export const Pill = styled.span<{ $difficulty?: string; $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  ${({ $difficulty, $color }) => {
    const c = $color ?? ($difficulty ? difficultyColor($difficulty) : t.muted);
    return css`
      color: ${c};
      background: color-mix(in srgb, ${c} 13%, transparent);
    `;
  }}
`;

/** A coloured word (status, count, tone). */
export const Tinted = styled.span<{ $tone?: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: ${({ $tone }) => toneColor($tone)};
`;

/** Quiet secondary text; `$small` shrinks it. */
export const Muted = styled.span<{ $small?: boolean }>`
  color: ${t.muted};
  ${({ $small }) => $small && "font-size: 0.85em;"}
`;

export const MutedP = styled.p<{ $small?: boolean }>`
  color: ${t.muted};
  ${({ $small }) => $small && "font-size: 0.85em;"}
`;

/** Flex spacer. */
export const Grow = styled.span`
  flex: 1;
`;

/** Wrapping row of chips / tags. */
export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

/** Neutral rounded tag. */
export const Chip = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 99px;
  background: ${({ $color }) => ($color ? `color-mix(in srgb, ${$color} 12%, transparent)` : t.panel2)};
  color: ${({ $color }) => $color ?? t.muted};
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  a& {
    text-decoration: none;
  }
  a&:hover {
    color: ${t.text};
  }
`;

/** Bordered panel section (side-pane cards, list blocks). */
export const Card = styled.section`
  padding: 12px 14px;
  border-radius: ${t.radius};
  border: 1px solid ${t.border};
  background: ${t.panel};
  & + & {
    margin-top: 10px;
  }
  h4 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${t.muted};
  }
`;

export const Kbd = styled.kbd`
  font-size: 11px;
  border: 1px solid ${t.border};
  border-radius: 4px;
  padding: 0 5px;
  background: ${t.panel};
  color: ${t.muted};
`;

/** Spinning loader; `$small` for inside panes. */
export const Loader = styled.div<{ $small?: boolean }>`
  width: ${({ $small }) => ($small ? "22px" : "36px")};
  height: ${({ $small }) => ($small ? "22px" : "36px")};
  margin: ${({ $small }) => ($small ? "24px auto" : "60px auto")};
  border-radius: 50%;
  border: 3px solid ${t.panel2};
  border-top-color: ${t.accent};
  animation: ${spin} 0.8s linear infinite;
`;

/** Inline error line. */
export const InlineError = styled.div`
  color: ${t.bad};
  font-size: 13px;
`;
