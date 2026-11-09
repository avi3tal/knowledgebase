import styled from "styled-components";
import { fadeUp } from "../theme/animations";
import { t } from "../theme/theme";

// ---------------------------------------------------------------- items

export const Rationale = styled.ul`
  background: ${t.panel};
  border: 1px dashed ${t.border};
  border-radius: 12px;
  padding: 10px 14px 10px 32px;
  margin: 0 0 12px;
`;

export const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// TODO(token): "started" indigo
const STATE_EDGE: Record<string, string> = {
  solved: t.ok,
  attempted: t.warn,
  started: "#6366f1",
};

export const Item = styled.div<{ $state: string; $i: number }>`
  display: grid;
  grid-template-columns: 44px 1fr 90px;
  gap: 14px;
  align-items: center;
  padding: 12px 16px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  ${({ $state }) => STATE_EDGE[$state] && `border-left: 4px solid ${STATE_EDGE[$state]};`}
  border-radius: ${t.radius};
  box-shadow: ${t.shadow};
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${({ $i }) => $i * 40}ms;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ItemNum = styled.div<{ $solved: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: ${({ $solved }) => ($solved ? t.ok : t.panel2)};
  ${({ $solved }) => $solved && "color: #fff;"}
`;

export const ItemTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;

export const ItemActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
  font-size: 0.85em;
`;

export const AttemptLink = styled.a`
  border: 1px solid ${t.border};
  border-radius: 4px;
  padding: 0 6px;
  color: ${t.text};
`;

export const CopyCmd = styled.code`
  cursor: copy;
`;

export const ItemScore = styled.div<{ $band: string }>`
  font-size: 1.6em;
  font-weight: 800;
  text-align: right;
  color: ${({ $band }) =>
    $band === "high" ? t.ok : $band === "mid" ? t.warn : $band === "low" ? t.bad : t.muted};
  span {
    font-size: 0.45em;
    color: ${t.muted};
    font-weight: 600;
  }
`;

// ---------------------------------------------------------------- materials

export const Materials = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

// TODO(token): materials accent indigo
export const Material = styled.a`
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-left: 4px solid #6366f1;
  box-shadow: ${t.shadow};
  color: ${t.text};
  min-width: 200px;
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-2px);
    text-decoration: none;
  }
`;

// ---------------------------------------------------------------- results

export const MutedCell = styled.td<{ $small?: boolean }>`
  color: ${t.muted};
  ${({ $small }) => $small && "font-size: 0.85em;"}
`;

export const Results = styled.section`
  h3 {
    margin: 18px 0 6px;
  }
`;

export const History = styled.ol`
  margin: 0;
  padding: 0 0 0 4px;
  list-style: none;
  border-left: 2px solid ${t.border};
  li {
    position: relative;
    padding: 3px 0 3px 12px;
  }
  li > span:first-child {
    margin-left: -19px;
    margin-right: 6px;
  }
`;

// ---------------------------------------------------------------- right pane

export const Recent = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9em;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  a {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
