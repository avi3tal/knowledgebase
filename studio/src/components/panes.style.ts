import styled, { css } from "styled-components";
import { fadeUp } from "../theme/animations";
import { t } from "../theme/theme";

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Filter = styled.input`
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  padding: 7px 10px;
  border-radius: 9px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.9em;
  cursor: text;
  &:focus {
    outline: none;
    border-color: ${t.accent};
    box-shadow: 0 0 0 3px ${t.accentSoft};
  }
`;

export const Empty = styled.p`
  margin: 0;
  color: ${t.muted};
  font-size: 0.85em;
`;

export const Group = styled.section<{ $color: string }>`
  h4 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 4px;
    font-size: 0.74em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ $color }) => $color};
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
`;

export const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const Count = styled.span<{ $color: string }>`
  margin-left: auto;
  padding: 0 7px;
  border-radius: 99px;
  background: color-mix(in srgb, ${({ $color }) => $color} 15%, transparent);
`;

export const Item = styled.li<{ $i: number }>`
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 18}ms;
`;

export const Title = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Link = styled.a<{
  $color: string;
  $current: boolean;
  $muted: boolean;
  $disabled: boolean;
}>`
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
  ${({ $current, $color }) =>
    $current &&
    css`
      background: color-mix(in srgb, ${$color} 14%, transparent);
      border-left-color: ${$color};
      font-weight: 700;
    `}
  ${({ $muted }) =>
    $muted &&
    css`
      ${Title} {
        opacity: 0.6;
      }
    `}
  ${({ $disabled }) =>
    $disabled &&
    css`
      cursor: default;
      opacity: 0.55;
      &:hover {
        background: none;
        padding-left: 8px;
      }
    `}
`;

export const Status = styled.span`
  width: 1.2em;
  text-align: center;
  font-weight: 700;
  color: ${t.muted};
`;

export const Badge = styled.span`
  font-size: 0.75em;
  color: ${t.muted};
  background: ${t.panel2};
  border-radius: 99px;
  padding: 0 6px;
`;
