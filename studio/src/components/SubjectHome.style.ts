import styled, { css } from "styled-components";
import { lbRise } from "../theme/animations";
import { Pill } from "../theme/primitives";
import { t } from "../theme/theme";
import { LearnCard, RdButton } from "./LearnBenchParts.style";

export const Home = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 8px 0 6px;
`;

export const Filter = styled.input`
  flex: 1;
  min-width: 260px;
  padding: 7px 12px;
`;

/** "with lesson" toggle: a bordered pill around a checkbox. */
export const LessonsOnly = styled(Pill)`
  border: 1px solid ${t.border};
  input {
    margin: 0;
  }
`;

export const ChipLink = styled.a`
  border: 1px solid ${t.border};
  background: ${t.panel};
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 0.88em;
  transition:
    background 0.15s,
    border-color 0.15s;
  &:hover {
    background: ${t.accentSoft};
    border-color: ${t.accent};
    text-decoration: none;
  }
`;

/** "Quick start" card: buttons stacked and centred. */
export const Quick = styled(LearnCard)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${RdButton} {
    text-align: center;
    text-decoration: none;
    justify-content: center;
  }
`;

/* ---- right pane */

export const SuggList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SuggItem = styled.li<{ $i: number }>`
  animation: ${lbRise} 0.3s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
`;

export const SuggLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  border-radius: 8px;
  color: ${t.text};
  text-decoration: none;
  transition:
    background 0.15s,
    transform 0.15s;
  &:hover {
    background: ${t.accentSoft};
    transform: translateX(2px);
  }
`;

export const SuggIcon = styled.span`
  flex: 0 0 auto;
`;

export const SuggName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
`;

export const SuggWhy = styled.span<{ $tone: "due" | "weak" | "start" }>`
  flex: 0 0 auto;
  font-size: 0.72em;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  background: ${t.panel2};
  color: ${t.muted};
  ${({ $tone }) => {
    const c = $tone === "due" ? t.warn : $tone === "weak" ? t.bad : t.ok;
    return css`
      background: color-mix(in srgb, ${c} ${$tone === "due" ? 18 : 15}%, transparent);
      color: ${c};
    `;
  }}
`;
