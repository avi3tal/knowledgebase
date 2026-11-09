import styled, { css } from "styled-components";
import { float, glowPulse, pop } from "../theme/animations";
import { t } from "../theme/theme";
import { AddButton } from "./DesignShared.style";

const PINK = "#db2777"; // TODO(token)

// ------------------------------------------------------------------ toolbar

export const PartChips = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const PartChip = styled.button<{ $on: boolean; $i: number }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 4px;
  border-radius: 999px;
  max-width: 230px;
  animation: ${pop} 0.25s ease both;
  animation-delay: ${({ $i }) => $i * 30}ms;
  ${({ $on }) =>
    $on &&
    css`
      border-color: ${PINK};
      box-shadow: 0 0 0 2px color-mix(in srgb, ${PINK} 25%, transparent);
    `}
`;

export const PcId = styled.span`
  font-weight: 800;
  font-size: 0.78em;
  padding: 1px 7px;
  border-radius: 999px;
  background: ${PINK};
  color: #fff;
`;

export const PcTitle = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88em;
`;

export const PcState = styled.span<{ $composed: boolean }>`
  font-size: 0.75em;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(
    in srgb,
    ${({ $composed }) => ($composed ? t.ok : t.warn)} 18%,
    transparent
  );
  color: ${({ $composed }) => ($composed ? t.ok : t.warn)};
`;

export const PartAdd = styled(AddButton)`
  margin: 0;
`;

export const ComposeButton = styled.button`
  background-image: linear-gradient(120deg, ${PINK}, #ea580c);
  border: none;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  &:not(:disabled) {
    animation: ${glowPulse} 2.4s ease-in-out infinite;
    @media (prefers-reduced-motion: reduce) {
      animation: none !important;
    }
  }
`;

export const ComposeCount = styled.span`
  margin-left: 6px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.85em;
`;

export const Status = styled.span<{ $tone: "muted" | "ok" | "warn" }>`
  font-size: 0.88em;
  ${({ $tone }) =>
    $tone === "ok"
      ? css`
          color: ${t.ok};
          font-weight: 600;
        `
      : $tone === "warn"
        ? css`
            color: ${t.warn};
          `
        : css`
            color: ${t.muted};
            font-size: 0.85em;
          `}
  code {
    margin-left: 4px;
  }
`;

// ------------------------------------------------------------------ empty state

export const Empty = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  padding: 24px;
  background-image: radial-gradient(
    color-mix(in srgb, ${t.muted} 30%, transparent) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
`;

export const EmptyCard = styled.div`
  max-width: 480px;
  text-align: center;
  padding: 24px 28px;
  border-radius: 18px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  box-shadow: ${t.shadowLift};
  animation: ${pop} 0.3s ease both;
`;

export const EmptyIcon = styled.div`
  font-size: 2.4em;
  animation: ${float} 3s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;

// ------------------------------------------------------------------ drawer

export const Drawer = styled.div`
  flex: none;
  border-top: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  max-height: 38%;
`;

export const DrawerToggle = styled.button`
  border: 0;
  border-radius: 0;
  background: ${t.panel2};
  text-align: left;
  font-weight: 600;
  font-size: 0.88em;
  padding: 6px 12px;
`;

export const DrawerBody = styled.div`
  overflow: auto;
  padding: 10px 14px 14px;
  scrollbar-width: thin;
`;

export const PartRemove = styled.div`
  margin-top: 10px;
`;

// ------------------------------------------------------------------ part sheet

export const Sheet = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
`;

export const Fields = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-start;
`;

export const TitleField = styled.label`
  flex: 1 1 240px;
`;

export const ChoiceField = styled.label`
  flex: 1 1 240px;
`;

export const WhyField = styled.label`
  flex: 1;
`;

export const Covers = styled.div`
  flex: 2 1 300px;
`;

export const Half = styled.div`
  flex: 1;
`;

export const CoverChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 3px;
`;

const COVER_COLORS: Record<string, string> = {
  n: t.cyan,
  a: "#ca8a04", // TODO(token)
};

export const CoverChip = styled.button<{ $kind: string; $on: boolean }>`
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.8em;
  font-weight: 700;
  ${({ $kind, $on }) => {
    const c = COVER_COLORS[$kind] ?? t.accent;
    return $on
      ? css`
          background: ${c};
          color: #fff;
          border-color: ${c};
          animation: ${pop} 0.2s ease both;
        `
      : css`
          color: ${c};
          border-color: color-mix(in srgb, ${c} 40%, ${t.border});
        `;
  }}
`;

export const ChooseButton = styled.button<{ $on: boolean }>`
  padding: 2px 8px;
  color: ${t.warn};
  font-size: 1.05em;
  ${({ $on }) =>
    $on &&
    css`
      background: color-mix(in srgb, ${t.warn} 18%, transparent);
      border-color: ${t.warn};
    `}
`;

export const ChipInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${t.border};
  border-radius: 10px;
  background: ${t.panel};
  margin-top: 3px;
  input {
    flex: 1;
    min-width: 120px;
    border: 0;
    padding: 3px 4px;
    background: transparent;
  }
  input:focus {
    outline: none;
  }
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px 1px 9px;
  border-radius: 999px;
  font-size: 0.82em;
  background: ${t.accentSoft};
  color: ${t.accent};
  animation: ${pop} 0.2s ease both;
  button {
    border: 0;
    background: none;
    padding: 0 4px;
    color: inherit;
    cursor: pointer;
  }
`;
