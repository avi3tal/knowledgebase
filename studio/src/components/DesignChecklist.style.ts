import styled, { css } from "styled-components";
import { fadeUp, justPassed, markPop, pop } from "../theme/animations";
import { t } from "../theme/theme";

export const Root = styled.div`
  animation: ${fadeUp} 0.35s ease both;
`;

export const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

export const Bar = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${t.panel2};
  overflow: hidden;
  margin-top: 6px;
`;

export const BarFill = styled.span<{ $pct: number }>`
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${t.ok}, #0ea5e9);
  width: ${({ $pct }) => $pct}%;
  transition: width 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
`;

export const Group = styled.section<{ $current?: boolean }>`
  margin-top: 10px;
  ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  ${({ $current }) =>
    $current &&
    css`
      padding: 4px 6px 6px;
      margin-left: -6px;
      margin-right: -6px;
      border-radius: 12px;
      background: color-mix(in srgb, ${t.accent} 6%, transparent);
    `}
`;

/** A stage heading; a button that jumps to the stage unless `$static`. */
export const Stage = styled.button<{ $static?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 2px 0;
  font-weight: 700;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${t.muted};
  text-align: left;
  &:hover:not(:disabled) {
    color: ${t.accent};
  }
  ${({ $static }) => $static && "cursor: default;"}
`;

export const Count = styled.span<{ $ok?: boolean }>`
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  ${({ $ok }) => $ok && `color: ${t.ok};`}
`;

export const Mark = styled.span<{ $pass: boolean }>`
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.8em;
  font-weight: 900;
  color: #fff;
  background: ${({ $pass }) => ($pass ? t.ok : t.bad)};
  margin-top: 1px;
  ${({ $pass }) =>
    $pass &&
    css`
      animation: ${pop} 0.3s ease both;
    `}
`;

export const Item = styled.li<{ $flash?: boolean }>`
  display: flex;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 8px;
  font-size: 0.9em;
  transition: background 0.2s;
  & + & {
    border-top: 1px dashed ${t.border};
  }
  ${({ $flash }) =>
    $flash &&
    css`
      animation: ${justPassed} 1.6s ease both;
      ${Mark} {
        animation: ${markPop} 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.6) both;
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none !important;
        ${Mark} {
          animation: none !important;
        }
      }
    `}
`;

export const TipButton = styled.button`
  margin-top: 4px;
  font-size: 0.8em;
  padding: 2px 10px;
  border-radius: 999px;
  border-color: color-mix(in srgb, ${t.warn} 50%, ${t.border});
  &:hover:not(:disabled) {
    border-color: ${t.warn};
    background: color-mix(in srgb, ${t.warn} 10%, transparent);
  }
`;

export const TipText = styled.div<{ $level: string }>`
  margin-top: 4px;
  padding: 6px 9px;
  border-radius: 8px;
  font-size: 0.9em;
  animation: ${pop} 0.25s ease both;
  ${({ $level }) =>
    $level === "show"
      ? css`
          border-left: 3px solid ${t.bad};
          background: color-mix(in srgb, ${t.bad} 8%, ${t.panel});
        `
      : css`
          border-left: 3px solid ${$level === "hint" ? "#f97316" : t.warn}; /* TODO(token) */
          background: color-mix(in srgb, ${t.warn} 10%, ${t.panel});
        `}
`;
