import styled, { css } from "styled-components";
import { t } from "../theme/theme";

const NARROW = "@media (max-width: 1100px)";

export const Root = styled.div<{ $top: number }>`
  display: flex;
  flex-direction: column;
  height: calc(100dvh - ${({ $top }) => $top}px);
  min-height: 520px;
  background: ${t.bg};
`;

/** PageHeader on top, the tabs on its bottom edge: one block, one border. */
export const Header = styled.header<{ $tabs: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${t.s3};
  padding: ${t.s4} ${t.s5} ${({ $tabs }) => ($tabs ? "0" : t.s4)};
  background: ${t.panel};
  border-bottom: 1px solid ${t.border};
`;

export const Tabs = styled.nav`
  display: flex;
  gap: ${t.s1};
  margin: 0 calc(-1 * ${t.s2});
  overflow-x: auto;
  scrollbar-width: none;
`;

export const Tab = styled.button<{ $on: boolean; $color?: string }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px ${t.s2} 10px;
  margin: 0 2px;
  border: 0;
  border-radius: 0;
  background: none;
  color: ${({ $on }) => ($on ? t.text : t.muted)};
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  &:hover:not(:disabled) {
    color: ${t.text};
    text-decoration: none;
  }
  &:active:not(:disabled) {
    transform: none;
  }
  &::after {
    content: "";
    position: absolute;
    left: ${t.s2};
    right: ${t.s2};
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: ${({ $color }) => $color ?? t.text};
    transform: scaleX(${({ $on }) => ($on ? 1 : 0)});
    transition: transform 0.18s ease;
  }
`;

export const TabBadge = styled.span<{ $done: boolean }>`
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  padding: 0 6px;
  border-radius: 99px;
  ${({ $done }) =>
    $done
      ? css`
          background: color-mix(in srgb, ${t.ok} 16%, transparent);
          color: ${t.ok};
        `
      : css`
          background: ${t.panel2};
          color: ${t.muted};
        `}
`;

export const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  ${NARROW} {
    position: relative;
  }
`;

export const Pane = styled.aside<{ $side: "left" | "right"; $width: number }>`
  width: ${({ $width }) => $width}px;
  flex: 0 0 ${({ $width }) => $width}px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${t.panel};
  ${({ $side }) =>
    $side === "left"
      ? `border-right: 1px solid ${t.border};`
      : `border-left: 1px solid ${t.border};`}
  ${NARROW} {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 20;
    box-shadow: ${t.shadowLift};
    ${({ $side }) => ($side === "left" ? "left: 0;" : "right: 0;")}
  }
`;

export const PaneHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 ${t.s2} 0 ${t.s4};
  font-size: 12px;
  font-weight: 600;
  color: ${t.muted};
`;

export const Collapse = styled.button`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: none;
  color: ${t.faint};
  cursor: pointer;
  &:hover:not(:disabled) {
    color: ${t.text};
    background: ${t.panel2};
  }
`;

export const PaneBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0 ${t.s3} ${t.s4};
  scrollbar-width: thin;
`;

/** The center scrolls on its own; it is the container wide figures size against (cqw). */
export const Center = styled.main<{ $flush: boolean }>`
  flex: 1;
  min-width: 0;
  container-type: inline-size;
  ${({ $flush }) =>
    $flush
      ? css`
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        `
      : css`
          overflow: auto;
          padding: 18px 26px 40px;
          scroll-behavior: smooth;
        `}
`;

export const Rail = styled.button<{ $side: "left" | "right" }>`
  flex: 0 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border: 0;
  border-radius: 0;
  background: ${t.panel};
  color: ${t.muted};
  cursor: pointer;
  font: inherit;
  ${({ $side }) =>
    $side === "left"
      ? `border-right: 1px solid ${t.border};`
      : `border-left: 1px solid ${t.border};`}
  &:hover:not(:disabled) {
    color: ${t.text};
    background: ${t.panel2};
  }
  &:active:not(:disabled) {
    transform: none;
  }
`;

export const RailTitle = styled.span`
  writing-mode: vertical-rl;
  font-size: 12px;
  font-weight: 500;
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 40px;
  padding: 6px ${t.s5};
  background: ${t.panel};
  border-top: 1px solid ${t.border};
  font-size: 13px;
  color: ${t.muted};
`;
