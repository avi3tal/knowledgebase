import styled from "styled-components";
import { pop } from "../theme/animations";
import { t } from "../theme/theme";

/** Right-pane inspector card; `$color` is the selected shape's colour (accent for a connection). */
export const Root = styled.section<{ $color?: string }>`
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 45%, ${t.border});
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 7%, ${t.panel});
  animation: ${pop} 0.2s ease both;
`;

export const Head = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

export const Icon = styled.span<{ $color?: string }>`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 18px;
  background: color-mix(in srgb, ${({ $color }) => $color ?? t.accent} 20%, transparent);
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 8px;
  font-size: 0.85em;
  > span {
    color: ${t.muted};
  }
`;

export const Conn = styled.div`
  ul {
    list-style: none;
    margin: 2px 0 8px;
    padding: 0;
    font-size: 0.88em;
  }
  li {
    padding: 2px 0;
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;
