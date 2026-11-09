import styled from "styled-components";
import { lbRise } from "../theme/animations";
import { t } from "../theme/theme";
import { RdCard } from "./LearnBenchParts.style";

export const HeroCard = styled.section`
  padding: 16px 18px;
  border-radius: ${t.radius};
  background: ${t.panel};
  border: 1px solid ${t.border};
  h2 {
    margin-top: 0;
  }
`;

export const Lead = styled.p`
  font-size: 1.08em;
  line-height: 1.55;
`;

export const HeroActions = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 0;
`;

export const Planned = styled(RdCard)`
  border-left: 4px solid ${t.border};
`;

export const Diff = styled.div`
  h3 {
    margin: 18px 0 8px;
  }
`;

export const ProblemGrid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 8px;
`;

export const ProblemItem = styled.li<{ $i: number }>`
  animation: ${lbRise} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 12) * 30}ms;
`;

export const ProblemLink = styled.a<{ $color: string }>`
  display: block;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid ${t.border};
  border-left: 4px solid ${({ $color }) => $color};
  background: ${t.panel};
  color: ${t.text};
  font-weight: 600;
  text-decoration: none;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${t.shadowLift};
  }
`;
