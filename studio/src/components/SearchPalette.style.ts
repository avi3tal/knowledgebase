import styled from "styled-components";
import { fade, pop } from "../theme/animations";
import { t } from "../theme/theme";

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 17, 23, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 12vh;
  animation: ${fade} 0.15s ease both;
`;

export const Palette = styled.div`
  width: min(680px, 92vw);
  background: ${t.panel};
  border-radius: 16px;
  box-shadow: ${t.shadowLift};
  border: 1px solid ${t.border};
  overflow: hidden;
  animation: ${pop} 0.18s ease both;
`;

export const Input = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid ${t.border};
  border-radius: 0;
  padding: 16px 18px;
  font-size: 1.05em;
  &:focus {
    outline: none;
  }
`;

export const Results = styled.ul`
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 55vh;
  overflow-y: auto;
`;

export const Result = styled.li<{ $on: boolean }>`
  display: grid;
  grid-template-columns: 30px auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $on }) => ($on ? t.accentSoft : "transparent")};
`;

export const Hint = styled.li`
  padding: 8px 10px;
  color: ${t.muted};
`;

export const ResultIcon = styled.span`
  font-size: 1.15em;
  text-align: center;
`;

export const ResultTitle = styled.span`
  font-weight: 600;
  white-space: nowrap;
`;

export const Detail = styled.span`
  color: ${t.muted};
  font-size: 0.85em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const Subject = styled.span<{ $locked: boolean }>`
  font-size: 0.75em;
  color: ${({ $locked }) => ($locked ? t.muted : t.accent)};
  background: ${({ $locked }) => ($locked ? t.panel2 : t.accentSoft)};
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
`;
