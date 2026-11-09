import styled, { css } from "styled-components";
import { fadeUp } from "../theme/animations";
import { Card } from "../theme/primitives";
import { t } from "../theme/theme";
import { Filter } from "./DesignReaderPanes.style";
import { Badge } from "./PracticeBench.style";

// ---------------------------------------------------------------- toolbar

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

export const Search = styled(Filter)`
  position: static;
  flex: 1 1 220px;
  width: auto;
`;

export const Seg = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  background: ${t.panel2};
`;

export const SegButton = styled.button<{ $on: boolean; $kind: string }>`
  border: 0;
  background: none;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: 600;
  color: ${t.muted};
  transition:
    background 0.15s,
    color 0.15s;
  ${({ $on, $kind }) =>
    $on &&
    css`
      background: ${t.panel};
      color: ${$kind === "solved" ? t.ok : $kind === "failing" ? t.bad : t.text};
      box-shadow: ${t.shadow};
    `}
`;

// ---------------------------------------------------------------- table

export const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: ${t.radius};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: ${t.shadow};
  overflow: hidden;
  th,
  td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid ${t.border};
  }
  th {
    color: ${t.muted};
    font-weight: 600;
    font-size: 0.85em;
  }
`;

const rowTone = (status: string) =>
  status === "solved" ? t.ok : status === "failing" ? t.bad : "transparent";

export const Row = styled.tr<{ $status: string; $i: number }>`
  transition: background 0.15s;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 25) * 14}ms;
  &:hover {
    background: ${t.accentSoft};
  }
  td:first-child {
    box-shadow: inset 3px 0 0 ${({ $status }) => rowTone($status)};
    transition: box-shadow 0.15s;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Title = styled.a`
  font-weight: 600;
  color: ${t.text};
  tr:hover & {
    color: ${t.accent};
  }
`;

export const Tag = styled.span`
  font-size: 0.7em;
  border-radius: 4px;
  padding: 0 5px;
  margin-left: 6px;
  border: 1px solid ${t.warn};
  color: ${t.warn};
`;

export const TopicLink = styled.a`
  margin-right: 8px;
`;

export const PatternCell = styled.td`
  color: ${t.muted};
  font-size: 0.85em;
`;

export const StatusCell = styled.td<{ $status: string }>`
  white-space: nowrap;
  font-weight: 500;
  color: ${({ $status }) => ($status === "solved" ? t.ok : $status === "failing" ? t.bad : t.muted)};
`;

export const CountCell = styled.td`
  color: ${t.muted};
`;

// ---------------------------------------------------------------- right pane

export const DiffRow = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: 8px;
  color: ${t.text};
  transition: background 0.15s;
  &:hover {
    text-decoration: none;
    background: ${t.panel2};
  }
`;

export const DiffBadge = styled(Badge)`
  width: 64px;
  text-align: center;
`;

export const Num = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 0.82em;
  font-weight: 700;
  color: ${t.muted};
`;

export const NextCard = styled(Card)`
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: next;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const NextItem = styled.li<{ $i: number }>`
  position: relative;
  padding-left: 28px;
  counter-increment: next;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
  &::before {
    content: counter(next);
    position: absolute;
    left: 0;
    top: 1px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 0.75em;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(135deg, ${t.accent}, ${t.pattern});
  }
  a {
    font-weight: 600;
    margin-right: 6px;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ---------------------------------------------------------------- footer

export const Filters = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const FilterPill = styled.span`
  padding: 0 8px;
  border-radius: 99px;
  font-size: 0.85em;
  font-weight: 600;
  color: ${t.accent};
  background: ${t.accentSoft};
`;
