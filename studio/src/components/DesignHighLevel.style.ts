import styled, { css } from "styled-components";
import { fadeUp, pop } from "../theme/animations";
import { t } from "../theme/theme";

// ------------------------------------------------------------------ version pills

export const Pills = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
`;

export const PillWrap = styled.span`
  display: inline-flex;
  align-items: center;
`;

export const Arrow = styled.span`
  color: ${t.muted};
  margin: 0 4px;
`;

export const Pill = styled.button<{ $on: boolean }>`
  position: relative;
  border-radius: 999px;
  font-weight: 700;
  padding: 4px 14px;
  font-variant-numeric: tabular-nums;
  ${({ $on }) =>
    $on &&
    css`
      background: linear-gradient(120deg, #4f46e5, #7c3aed);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      animation: ${pop} 0.25s ease both;
    `}
`;

export const Dot = styled.span<{ $kind: "bad" | "warn" }>`
  position: absolute;
  top: -2px;
  right: ${({ $kind }) => ($kind === "warn" ? "8px" : "-2px")};
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid ${t.panel};
  background: ${({ $kind }) => ($kind === "bad" ? t.bad : t.warn)};
`;

// ------------------------------------------------------------------ toolbar

export const Seg = styled.div`
  display: inline-flex;
  border: 1px solid ${t.border};
  border-radius: 10px;
  overflow: hidden;
`;

export const SegButton = styled.button<{ $on: boolean }>`
  border: none;
  border-radius: 0;
  ${({ $on }) =>
    $on &&
    css`
      background: ${t.accentSoft};
      color: ${t.accent};
      font-weight: 600;
    `}
`;

// ------------------------------------------------------------------ why, diff

export const WhyField = styled.label<{ $missing: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 340px;
  margin: 0;
  input {
    flex: 1;
    ${({ $missing }) => $missing && `border-color: ${t.warn};`}
  }
`;

export const WhyTag = styled.span<{ $missing: boolean }>`
  font-weight: 700;
  font-size: 0.85em;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${({ $missing }) =>
    $missing ? `color-mix(in srgb, ${t.warn} 18%, transparent)` : t.accentSoft};
  color: ${({ $missing }) => ($missing ? t.warn : t.accent)};
`;

export const DiffStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 0;
`;

export const DiffChip = styled.span<{ $kind: "add" | "del" }>`
  font-size: 0.8em;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  animation: ${pop} 0.25s ease both;
  ${({ $kind }) =>
    $kind === "add"
      ? css`
          background: color-mix(in srgb, ${t.ok} 15%, transparent);
          color: ${t.ok};
        `
      : css`
          background: color-mix(in srgb, ${t.bad} 12%, transparent);
          color: ${t.bad};
          text-decoration: line-through;
        `}
`;

// ------------------------------------------------------------------ smells

export const Smells = styled.section<{ $clean: boolean }>`
  margin: 0 0 12px;
  padding: 8px 12px;
  font-size: 0.9em;
  border-radius: 12px;
  border: 1px dashed ${t.bad};
  background: color-mix(in srgb, ${t.bad} 6%, ${t.panel});
  animation: ${fadeUp} 0.3s ease both;
  ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
  ${({ $clean }) =>
    $clean &&
    css`
      border-color: color-mix(in srgb, ${t.ok} 60%, transparent);
      background: color-mix(in srgb, ${t.ok} 6%, ${t.panel});
    `}
`;

export const OkLine = styled.p`
  margin: 4px 0 0;
  color: ${t.ok};
  font-size: 0.85em;
`;

export const SmellNode = styled.span`
  font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
  font-size: 0.8em;
  padding: 0 6px;
  margin-left: 4px;
  border-radius: 6px;
  border: 1px dashed ${t.bad};
  color: ${t.bad};
`;

// ------------------------------------------------------------------ JSON tab

export const Json = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  /* the code editor takes the height that is left */
  > div:first-child {
    flex: 1;
    height: auto;
    min-height: 0;
  }
`;

export const JsonActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;
