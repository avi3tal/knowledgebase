import styled from "styled-components";
import { fadeUp, pop } from "../theme/animations";
import { t } from "../theme/theme";
import { ChipRow } from "./DesignReaderPanes.style";

// ---------------------------------------------------------------- reveal gate

export const Gate = styled.section`
  position: relative;
  overflow: hidden;
  max-width: 560px;
  margin: 40px auto;
  padding: 28px 30px;
  text-align: center;
  border-radius: 18px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadowLift};
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 5px;
    background: ${t.accent};
  }
  h2 {
    margin: 6px 0 10px;
  }
`;

export const GateIcon = styled.div`
  font-size: 2.4em;
  animation: ${pop} 0.5s ease both;
`;

export const GateActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
`;

// ---------------------------------------------------------------- solution

export const Band = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: ${t.radius};
  border: 1px solid ${t.border};
  background: linear-gradient(
    120deg,
    color-mix(in srgb, ${t.tech} 10%, ${t.panel}),
    color-mix(in srgb, ${t.pattern} 10%, ${t.panel})
  );
`;

export const BandPattern = styled.div`
  flex-basis: 100%;
  p {
    margin: 2px 0 0;
  }
`;

export const Label = styled.span<{ $inline?: boolean }>`
  display: ${({ $inline }) => ($inline ? "inline" : "block")};
  font-size: 0.7em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${t.muted};
  margin-bottom: ${({ $inline }) => ($inline ? "0" : "3px")};
  ${({ $inline }) => $inline && "margin-right: 6px;"}
`;

const figureBase = `
  margin: 14px 0 22px;
  border-radius: 12px;
  border: 1px solid ${t.border};
  background: ${t.panel};
  box-shadow: ${t.shadow};
  overflow: hidden;
`;

export const Fig = styled.figure`
  ${figureBase}
  animation: ${fadeUp} 0.4s ease both;
  figcaption {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 8px 12px;
    border-top: 1px solid ${t.border};
    font-size: 0.9em;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const FigCanvas = styled.div`
  background: ${t.bg};
`;

export const VTag = styled.span`
  flex: 0 0 auto;
  padding: 0 8px;
  border-radius: 99px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(120deg, ${t.accent}, ${t.pattern});
`;

export const Why = styled.span`
  flex: 1;
  color: ${t.muted};
`;

export const NewTag = styled.span`
  flex: 0 0 auto;
  font-size: 0.8em;
  font-weight: 700;
  color: ${t.ok};
`;

export const Part = styled.figure`
  ${figureBase}
  animation: ${fadeUp} 0.4s ease both;
  border-left: 4px solid ${t.pattern};
  ${FigCanvas} {
    border-top: 1px solid ${t.border};
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const PartHeader = styled.header`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px 0;
  ${ChipRow} {
    margin: 0;
  }
`;

export const PartId = styled.span`
  font-weight: 800;
  font-size: 0.8em;
  padding: 1px 8px;
  border-radius: 6px;
  color: #fff;
  background: ${t.pattern};
`;

export const PartTitle = styled.span`
  font-weight: 700;
`;

export const PartChoice = styled.p`
  margin: 8px 12px;
  font-size: 0.92em;
`;

export const PartChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  padding: 0 12px 10px;
  ${ChipRow} {
    margin: 0;
  }
`;
