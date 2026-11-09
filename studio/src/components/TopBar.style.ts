import styled, { css } from "styled-components";
import { fadeUp } from "../theme/animations";
import { t } from "../theme/theme";
import { Svg } from "./Icon.style";

export const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: ${t.s2};
  height: ${t.topbarH};
  padding: 0 ${t.s4};
  background: color-mix(in srgb, ${t.panel} 92%, transparent);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid ${t.border};
`;

export const Brand = styled.a`
  display: flex;
  align-items: center;
  margin-right: ${t.s1};
  &:hover {
    text-decoration: none;
  }
`;

export const BrandMark = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${t.text};
  color: ${t.panel};
  font-weight: 800;
  font-size: 13px;
  letter-spacing: -0.02em;
`;

export const Switch = styled.div`
  position: relative;
`;

const quietButton = css`
  height: 32px;
  border-color: transparent;
  background: transparent;
  &:hover:not(:disabled) {
    background: ${t.panel2};
    border-color: transparent;
  }
  &:active:not(:disabled) {
    transform: none;
  }
`;

export const SwitchButton = styled.button<{ $dim: boolean }>`
  ${quietButton}
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-weight: 600;
  color: ${({ $dim }) => ($dim ? t.muted : t.text)};
`;

export const SubjectIcon = styled.span`
  font-size: 15px;
  line-height: 1;
`;

export const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 300px;
  padding: 6px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: ${t.shadowLift};
  animation: ${fadeUp} 0.14s ease both;
`;

export const MenuItem = styled.a<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: ${t.radiusSm};
  color: ${t.text};
  background: ${({ $on }) => ($on ? t.panel2 : "transparent")};
  &:hover {
    background: ${t.panel2};
    text-decoration: none;
  }
  ${Svg} {
    color: ${t.muted};
  }
`;

export const MenuText = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  span {
    font-size: 12px;
    color: ${t.muted};
  }
`;

export const Sections = styled.nav`
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: 2px;
  margin-left: ${t.s2};
  padding-left: ${t.s3};
  border-left: 1px solid ${t.border};
`;

export const Section = styled.a<{ $on: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: ${({ $on }) => ($on ? t.text : t.muted)};
  font-weight: 500;
  &:hover {
    color: ${t.text};
    text-decoration: none;
  }
  ${({ $on }) =>
    $on &&
    css`
      &::after {
        content: "";
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: -1px;
        height: 2px;
        border-radius: 2px;
        background: ${t.text};
      }
    `}
`;

export const Search = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  height: 32px;
  color: ${t.muted};
  background: ${t.panel2};
  border-color: transparent;
  &:hover:not(:disabled) {
    border-color: ${t.borderStrong};
  }
  kbd {
    margin-left: auto;
  }
  @media (max-width: 900px) {
    width: auto;
    span,
    kbd {
      display: none;
    }
  }
`;

export const BarLink = styled.a<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: ${t.radiusSm};
  color: ${({ $on }) => ($on ? t.text : t.muted)};
  background: ${({ $on }) => ($on ? t.panel2 : "transparent")};
  font-weight: 500;
  &:hover {
    color: ${t.text};
    background: ${t.panel2};
    text-decoration: none;
  }
  @media (max-width: 900px) {
    display: none;
  }
`;

export const IconButton = styled.button`
  ${quietButton}
  display: grid;
  place-items: center;
  width: 32px;
  padding: 0;
  color: ${t.muted};
  &:hover:not(:disabled) {
    color: ${t.text};
  }
`;
