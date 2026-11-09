import type { CSSProperties } from "react";
import styled from "styled-components";
import { t } from "../theme/theme";

export const Figure = styled.figure<{ $plain?: boolean }>`
  position: relative;
  margin: 1em 0;
  background: ${({ $plain }) => ($plain ? t.panel2 : t.panel)};
  border: 1px solid ${({ $plain }) => ($plain ? "transparent" : t.border)};
  border-radius: 10px;
  overflow: hidden;
`;

export const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 0 6px 0 14px;
  background: ${t.panel2};
  border-bottom: 1px solid ${t.border};
  font-size: 12px;
  color: ${t.muted};
`;

export const Lang = styled.span`
  opacity: 0.7;
  margin-right: auto;
`;

export const Title = styled.span`
  font-weight: 500;
  letter-spacing: 0.01em;
  &:not(:has(+ ${Lang})) {
    margin-right: auto;
  }
`;

export const CopyBtn = styled.button<{ $done?: boolean }>`
  font: inherit;
  font-size: 12px;
  color: ${({ $done }) => ($done ? t.accent : t.muted)};
  background: transparent;
  border: 0;
  border-radius: 6px;
  padding: 3px 9px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
  &:hover {
    color: ${({ $done }) => ($done ? t.accent : t.text)};
    background: ${t.accentSoft};
  }
`;

export const Tabs = styled.div`
  display: flex;
  gap: 2px;
  margin-right: auto;
  margin-left: -8px;
`;

export const Tab = styled.button<{ $on?: boolean }>`
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $on }) => ($on ? t.text : t.muted)};
  background: transparent;
  border: 0;
  border-bottom: 2px solid ${({ $on }) => ($on ? t.accent : "transparent")};
  padding: 8px 10px 6px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover {
    color: ${t.text};
  }
`;

export const Body = styled.div`
  overflow-x: auto;
`;

/** `&&` outranks the generic `pre` rule of the surrounding prose. */
export const Pre = styled.pre<{ $plain?: boolean }>`
  && {
    margin: 0;
    padding: ${({ $plain }) => ($plain ? "10px 0" : "12px 0")};
    border: 0;
    border-radius: 0;
    background: transparent;
    overflow: visible;
    font-family: ${t.fontMono};
    font-size: ${({ $plain }) => ($plain ? "13px" : "13.5px")};
    line-height: 1.6;
    tab-size: 4;
    color: ${t.text};
    outline: none;
  }
`;

export const Code = styled.code`
  display: block;
  width: max-content;
  min-width: 100%;
  font: inherit;
  background: none;
  border: 0;
  padding: 0;
`;

export const Line = styled.span<{ $hl?: boolean }>`
  display: block;
  padding: 0 16px;
  white-space: pre;
  border-left: 2px solid ${({ $hl }) => ($hl ? t.accent : "transparent")};
  background: ${({ $hl }) => ($hl ? t.accentSoft : "none")};
`;

export const LineNo = styled.span`
  display: inline-block;
  min-width: 2.2em;
  margin-right: 14px;
  text-align: right;
  color: ${t.muted};
  opacity: 0.6;
  user-select: none;
`;

export const Caption = styled.figcaption`
  padding: 8px 16px 0;
  font-size: 12px;
  color: ${t.muted};
`;

/** Copy button of plain blocks: floats in the corner, shown on hover / focus. */
export const Float = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  ${Figure}:hover &,
  ${Figure}:focus-within & {
    opacity: 1;
  }
`;

/**
 * One syntax token. Shiki's dual-theme variables (`--shiki-light` / `--shiki-dark`) arrive as the
 * token's own style (library data); the theme picks which one colours the text.
 */
export const Tok = styled.span.attrs<{ $vars?: CSSProperties }>(({ $vars }) => ({
  style: $vars,
}))<{ $vars?: CSSProperties }>`
  color: var(--shiki-light);
  :root[data-theme="dark"] & {
    color: var(--shiki-dark);
  }
`;
