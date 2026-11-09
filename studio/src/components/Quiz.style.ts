import styled, { css } from "styled-components";
import { t } from "../theme/theme";

export const Root = styled.section`
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 12px;
  padding: 16px 18px;
  margin: 22px 0;
`;

export const Item = styled.div`
  border-top: 1px solid ${t.border};
  padding: 8px 0;
`;

export const Options = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const Option = styled.button<{ $state?: "right" | "wrong" | "dim" }>`
  ${({ $state }) =>
    $state === "right"
      ? css`
          border-color: ${t.ok};
          background: color-mix(in srgb, ${t.ok} 18%, transparent);
        `
      : $state === "wrong"
        ? css`
            border-color: ${t.bad};
            background: color-mix(in srgb, ${t.bad} 18%, transparent);
          `
        : $state === "dim"
          ? css`
              opacity: 0.5;
            `
          : ""}
`;

/** Explanation under a question; `$right` picks the colour (false also styles errors). */
export const Why = styled.p<{ $right: boolean }>`
  color: ${({ $right }) => ($right ? t.ok : t.bad)};
`;

export const Score = styled.p`
  font-weight: 600;
`;

export const Retake = styled.button`
  background: none;
  border: none;
  color: ${t.accent};
  margin-left: 8px;
`;
