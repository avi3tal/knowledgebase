import styled from "styled-components";
import { lbRise } from "../theme/animations";
import { difficultyColor } from "../theme/primitives";
import { t } from "../theme/theme";

export const Role = styled.div`
  h3 {
    margin: 14px 0 8px;
    font-size: 0.95rem;
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

export const ProblemItem = styled.li<{ $difficulty: string; $i: number }>`
  animation: ${lbRise} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 12) * 30}ms;
  a {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid ${t.border};
    border-left: 4px solid ${({ $difficulty }) => difficultyColor($difficulty)};
    background: ${t.panel};
    color: ${t.text};
    font-weight: 600;
    text-decoration: none;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  a:hover {
    transform: translateY(-2px);
    box-shadow: ${t.shadowLift};
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const ProbTop = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ProbTitle = styled.span`
  flex: 1;
  min-width: 0;
`;

export const ProbWith = styled.span`
  font-weight: 400;
  color: ${t.muted};
  font-size: 0.85em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0;
`;

export const LinkTag = styled.span`
  font-size: 0.72em;
  font-weight: 700;
  color: ${t.accent};
`;

export const Link = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, ${t.accent} 35%, transparent);
  background: color-mix(in srgb, ${t.accent} 10%, transparent);
  color: ${t.text};
  font-size: 0.85em;
  text-decoration: none;
  transition:
    transform 0.15s,
    background 0.15s;
  &:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, ${t.accent} 20%, transparent);
    text-decoration: none;
  }
`;

export const Similar = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  a {
    font-weight: 600;
  }
`;
