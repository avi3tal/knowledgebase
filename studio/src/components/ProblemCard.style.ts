import styled from "styled-components";
import { t } from "../theme/theme";
import { Article, Review } from "./DesignReaderPanes.style";

// ---------------------------------------------------------------- compact card (lesson pages)

export const CompactCard = styled.div`
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  border-radius: ${t.radius};
  padding: 10px 14px;
  margin: 10px 0;
`;

export const CardHead = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.85em;
`;

export const Attempt = styled.a<{ $state: "ok" | "fail" | "none" }>`
  border: 1px solid
    ${({ $state }) => ($state === "ok" ? t.ok : $state === "fail" ? t.bad : t.border)};
  border-radius: 4px;
  padding: 0 6px;
  color: ${t.text};
`;

export const OpenEditor = styled.a`
  font-weight: 600;
`;

// ---------------------------------------------------------------- problem page

/** Description / hints article: collapsible hints in the Markdown get a warm card look. */
export const ProblemArticle = styled(Article)`
  details {
    margin: 8px 0;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid ${t.border};
    background: ${t.panel};
    transition: box-shadow 0.15s;
  }
  details[open] {
    box-shadow: ${t.shadow};
    border-color: color-mix(in srgb, ${t.warn} 45%, ${t.border});
  }
  summary {
    cursor: pointer;
    font-weight: 700;
    color: ${t.warn};
  }
`;

export const Note = styled.p`
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.9em;
  background: color-mix(in srgb, ${t.warn} 12%, transparent);
  border-left: 3px solid ${t.warn};
`;

export const AttemptRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const AttemptReview = styled(Review)`
  summary {
    color: ${t.pattern};
  }
`;
