import styled from "styled-components";
import { pop } from "../theme/animations";
import { Card } from "../theme/primitives";
import { t } from "../theme/theme";

// ---------------------------------------------------------------- stage strip

export const Stages = styled.section`
  margin: 0 0 18px;
  padding: 14px 16px;
  border-radius: ${t.radius};
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  h3 {
    margin: 0 0 10px;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${t.muted};
  }
  ol {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }
`;

export const Step = styled.li<{ $core: boolean; $i: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  flex: 1 1 0;
  padding: 8px 4px;
  border-radius: 10px;
  background: ${t.panel2};
  text-align: center;
  animation: ${pop} 0.35s ease both;
  animation-delay: ${({ $i }) => $i * 50}ms;
  &:not(:last-child)::after {
    content: "→";
    position: absolute;
    right: -9px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    font-size: 0.8em;
    color: ${t.muted};
  }
  ${({ $core }) =>
    $core &&
    `
    color: #fff;
    background: linear-gradient(135deg, ${t.pattern}, ${t.core});
    box-shadow: 0 4px 14px color-mix(in srgb, ${t.core} 35%, transparent);
  `}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StepIcon = styled.span`
  font-size: 1.3em;
`;

export const StepLabel = styled.span`
  font-weight: 700;
  font-size: 0.82em;
`;

export const StepCount = styled.span`
  font-size: 0.72em;
  opacity: 0.75;
`;

// ---------------------------------------------------------------- right pane

export const PracticeCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// ---------------------------------------------------------------- attempts

export const Attempts = styled.div`
  > h3 {
    margin: 0 0 8px;
  }
`;

export const StartRow = styled.div`
  display: flex;
  gap: 8px;
  input {
    flex: 1;
    min-width: 0;
  }
`;

export const StartButton = styled.button`
  background: ${t.accent};
  color: ${t.onAccent};
  border-color: ${t.accent};
  font-weight: 600;
`;

export const SmallLink = styled.a`
  font-size: 0.85em;
`;
