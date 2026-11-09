import styled, { css } from "styled-components";
import { fadeUp, heroShift, pop } from "../theme/animations";
import { t } from "../theme/theme";

export const Callout = styled.div`
  background: ${t.panel2};
  border-left: 3px solid ${t.warn};
  padding: 10px 14px;
  border-radius: 6px;
  margin: 12px 0;
  font-size: 0.85em;
`;

/** Block-level error / notice of the reference view (full size, unlike the in-diagram notes). */
export const Notice = styled(Callout)`
  font-size: inherit;
`;

export const MdDiagram = styled.figure`
  margin: 10px 0 16px;
  figcaption {
    margin-top: 6px;
    font-size: 0.88em;
    color: ${t.muted};
  }
`;

export const WhyTag = styled.span`
  font-weight: 700;
  font-size: 0.85em;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${t.accentSoft};
  color: ${t.accent};
  white-space: nowrap;
`;

export const WhyRead = styled.p`
  margin: 8px 0;
`;

export const RefView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

// TODO(token): amber-pink-violet hero gradient
export const PatternCard = styled.section`
  padding: 16px 20px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(120deg, #f59e0b 0%, #db2777 55%, #7c3aed 100%);
  background-size: 200% 200%;
  animation: ${heroShift} 14s ease infinite;
  box-shadow: ${t.shadowLift};
  p {
    margin: 6px 0 0;
    font-size: 1.05em;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PatternKicker = styled.span`
  font-weight: 800;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.95;
`;

export const Sheet = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.92em;
`;

export const Row = styled.tr`
  animation: ${fadeUp} 0.25s ease both;
  &:hover td {
    background: ${t.accentSoft};
  }
`;

export const Cell = styled.td<{ $mono?: boolean; $num?: boolean; $muted?: boolean }>`
  padding: 6px 8px;
  border-bottom: 1px solid ${t.border};
  vertical-align: top;
  ${({ $mono }) => $mono && `font-family: ${t.fontMono}; font-size: 0.88em;`}
  ${({ $num }) =>
    $num && "text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums;"}
  ${({ $muted }) => $muted && `color: ${t.muted};`}
`;

export const Answers = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Answer = styled.li`
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: ${t.panel2};
  animation: ${fadeUp} 0.3s ease both;
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
  margin-top: 1px;
  background: ${({ $pass }) => ($pass ? t.ok : t.bad)};
  ${({ $pass }) =>
    $pass &&
    css`
      animation: ${pop} 0.3s ease both;
    `}
`;

export const Walkthrough = styled.section`
  border-top: 1px solid ${t.border};
  padding-top: 8px;
`;
