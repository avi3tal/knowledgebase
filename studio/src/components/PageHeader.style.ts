import styled from "styled-components";
import { t } from "../theme/theme";

export const Root = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${t.s3};
  min-width: 0;
`;

export const IconTile = styled.div<{ $color?: string }>`
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: ${t.radius};
  font-size: 20px;
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 12%, ${t.panel});
  border: 1px solid color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 22%, transparent);
`;

export const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 650;
  letter-spacing: -0.015em;
`;

/** The title's quieter suffix, e.g. "Problems · Two Pointers". */
export const TitleSub = styled.span`
  color: ${t.muted};
  font-weight: 500;
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 4px;
  margin-top: 6px;
  color: ${t.muted};
  font-size: 13px;
  a {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: ${t.muted};
  }
  a:hover {
    color: ${t.text};
  }
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  & > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  & + &::before {
    content: "";
    width: 3px;
    height: 3px;
    margin: 0 10px;
    border-radius: 50%;
    background: ${t.faint};
  }
`;

/** The topic group name in a meta line, in the group's colour. */
export const Group = styled.span<{ $color?: string }>`
  color: ${({ $color }) => $color ?? t.muted};
  font-weight: 600;
`;

export const Sub = styled.p`
  margin: 8px 0 0;
  max-width: 90ch;
  color: ${t.muted};
  font-size: 13.5px;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.s2};
  flex: none;
`;

export const Tags = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const Tag = styled.span`
  padding: 1px 8px;
  border-radius: 99px;
  background: ${t.panel2};
  color: ${t.muted};
  font-size: 12px;
  font-weight: 500;
  a&:hover {
    color: ${t.text};
    text-decoration: none;
  }
`;

export const PrevNext = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${t.s4};
  width: 100%;
`;

export const PrevNextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 45%;
  color: ${t.muted};
  font-weight: 500;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &:hover {
    color: ${t.text};
    text-decoration: none;
  }
`;
