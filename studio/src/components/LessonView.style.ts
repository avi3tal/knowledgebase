import styled from "styled-components";
import { lbRise } from "../theme/animations";
import { t } from "../theme/theme";
import { LearnCard } from "./LearnBenchParts.style";

/** A lesson section (Learn / Quiz / Practice / Resources); only the active one shows. */
export const Section = styled.div`
  &[hidden] {
    display: none;
  }
  &:not([hidden]) {
    animation: ${lbRise} 0.3s ease both;
  }
`;

export const Article = styled.article`
  max-width: none;
`;

/** A block of a lesson (trace, quiz, resources, practice) that anchors scroll into view. */
export const Block = styled.div`
  scroll-margin-top: 12px;
`;

/** Side cards inside the On this page pane sit 10px apart. */
export const SideCard = styled(LearnCard)`
  margin-top: 10px;
`;

export const ProblemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.88em;
  li {
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
`;

export const More = styled.a`
  display: inline-block;
  margin-top: 10px;
  font-size: 0.85em;
`;

export const NextSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 24px 0 8px;
`;

export const ErrorText = styled.p`
  color: ${t.bad};
`;
