import styled, { css } from "styled-components";
import { t } from "../theme/theme";

export const Root = styled.section`
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadow};
  border-radius: ${t.radius};
  padding: 12px 18px;
  margin: 22px 0;
  ul {
    padding-left: 18px;
    margin: 6px 0;
  }
  li {
    margin: 6px 0;
  }
`;

export type TagKind = "free" | "trial" | "paid" | "local" | "core" | "warn";

const outlined = (c: string) => css`
  border: 1px solid ${c};
  color: ${c};
`;

export const Tag = styled.span<{ $kind: TagKind }>`
  font-size: 0.7em;
  border-radius: 4px;
  padding: 0 5px;
  margin-left: 6px;
  ${({ $kind }) =>
    $kind === "free"
      ? outlined(t.ok)
      : $kind === "trial" || $kind === "paid" || $kind === "warn"
        ? outlined(t.warn)
        : $kind === "local"
          ? outlined(t.accent)
          : css`
              background: color-mix(in srgb, ${t.ok} 18%, transparent);
              color: ${t.ok};
            `}
`;

export const Summary = styled.div`
  font-size: 0.85em;
  color: ${t.muted};
`;
