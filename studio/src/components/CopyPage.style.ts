import styled from "styled-components";
import { Button } from "../theme/primitives";
import { t } from "../theme/theme";

export const Group = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

export const CopyButton = styled(Button)<{ $tone?: "ok" | "bad" }>`
  color: ${({ $tone }) => ($tone === "ok" ? t.ok : $tone === "bad" ? t.bad : t.muted)};
  gap: 6px;
`;

/** The raw markdown URL: what an agent fetches without a clipboard. */
export const RawLink = styled.a`
  font-family: ${t.fontMono};
  font-size: 12px;
  color: ${t.muted};
  padding: 4px 6px;
  border-radius: ${t.radiusSm};
  text-decoration: none;
  &:hover {
    color: ${t.accent};
    text-decoration: underline;
  }
`;
