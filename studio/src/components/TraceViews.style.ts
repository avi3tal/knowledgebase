import styled, { css } from "styled-components";
import { popChange } from "../theme/animations";
import { PALETTE, t } from "../theme/theme";

const INDIGO = PALETTE[0];
const PINK = PALETTE[4];
const VIOLET = PALETTE[5];

/** One trace view (array, map, tree…): scrolls sideways inside the panel instead of overflowing. */
export const Block = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 2px 6px;
`;

export const Label = styled.div`
  font-size: 0.8em;
  color: ${t.muted};
  margin-bottom: 4px;
`;

/* ---------- array ---------- */

export const Cells = styled.div<{ $width: number; $paddingBottom: number }>`
  position: relative;
  display: flex;
  gap: 6px;
  width: ${({ $width }) => $width}px;
  padding-bottom: ${({ $paddingBottom }) => $paddingBottom}px;
`;

export const WindowFrame = styled.div<{ $left: number; $width: number }>`
  position: absolute;
  top: -5px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
  height: 62px;
  border: 2px solid ${VIOLET};
  border-radius: 9px;
  box-shadow: 0 0 0 4px color-mix(in srgb, ${VIOLET} 15%, transparent);
  transition:
    left 0.35s ease,
    width 0.35s ease;
  pointer-events: none;
`;

/** An array cell; `$small` is the compact form under a heap, `$on` the cell inside the window. */
export const Cell = styled.div<{ $on?: boolean; $small?: boolean }>`
  width: 42px;
  height: 52px;
  flex: none;
  border: 1px solid ${t.border};
  border-radius: 6px;
  background: ${t.panel2};
  box-shadow: ${t.shadow};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition:
    background 0.3s,
    border-color 0.3s;
  ${({ $small }) =>
    $small &&
    css`
      width: auto;
      min-width: 34px;
      height: 40px;
      padding: 0 5px;
      font-size: 0.85em;
    `}
  ${({ $on }) =>
    $on &&
    css`
      background: linear-gradient(
        180deg,
        color-mix(in srgb, ${INDIGO} 22%, ${t.panel}),
        color-mix(in srgb, ${PINK} 14%, ${t.panel})
      );
      border-color: ${t.accent};
      transform: translateY(-2px);
      transition:
        background 0.3s,
        border-color 0.3s,
        transform 0.3s;
    `}
`;

export const CellValue = styled.span`
  font-weight: 600;
`;

export const CellIndex = styled.span`
  font-size: 0.7em;
  color: ${t.muted};
`;

/** A named index marker under the cells (array) or above a node (linked list). */
export const Pointer = styled.div<{
  $k: number;
  $x: number;
  $top: number;
  $width?: number;
  $faded?: boolean;
}>`
  position: absolute;
  left: 0;
  top: ${({ $top }) => $top}px;
  width: ${({ $width }) => $width ?? 42}px;
  transform: translateX(${({ $x }) => $x}px);
  text-align: center;
  font-size: 0.75em;
  font-weight: 700;
  white-space: nowrap;
  overflow: visible;
  transition: transform 0.35s ease;
  color: ${({ $k }) => [t.ok, t.warn, "#7c3aed" /* TODO(token) */][$k % 3]};
  ${({ $faded }) => $faded && "opacity: 0.55;"}
`;

/* ---------- map / vars ---------- */

export const MapBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 30px;
`;

const changedLook = css`
  background: color-mix(in srgb, ${t.warn} 20%, transparent);
  border-color: ${t.warn};
  animation: ${popChange} 0.45s ease;
`;

export const MapEntry = styled.div<{ $changed?: boolean }>`
  background: ${t.panel2};
  border: 1px solid ${t.border};
  border-radius: 14px;
  padding: 2px 10px;
  transition: background 0.3s;
  ${({ $changed }) => $changed && changedLook}
`;

export const Vars = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Var = styled.div<{ $changed?: boolean }>`
  display: flex;
  gap: 8px;
  background: ${t.panel};
  border: 1px solid ${t.border};
  border-radius: 6px;
  padding: 3px 10px;
  box-shadow: ${t.shadow};
  transition: background 0.3s;
  ${({ $changed }) => $changed && changedLook}
`;

export const VarName = styled.span`
  color: ${t.muted};
`;

export const VarValue = styled.span`
  font-weight: 600;
`;

/* ---------- linked list ---------- */

export const LinkedList = styled.div<{ $width: number; $height: number }>`
  position: relative;
  color: ${t.muted};
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
`;

export const Links = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
`;

export const Link = styled.path<{ $kind: "forward" | "back" | "skip" }>`
  fill: none;
  stroke: ${({ $kind }) => ($kind === "back" ? t.warn : $kind === "skip" ? t.accent : t.muted)};
  color: ${({ $kind }) => ($kind === "back" ? t.warn : $kind === "skip" ? t.accent : "inherit")};
  stroke-width: 2;
  transition: d 0.35s ease;
`;

export const NullLink = styled.text`
  fill: ${t.muted};
  font-size: 14px;
`;

export const ListNode = styled.div<{
  $left: number;
  $top: number;
  $width: number;
  $height: number;
}>`
  position: absolute;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${t.border};
  border-radius: 8px;
  background: ${t.panel2};
  color: ${t.text};
  font-weight: 600;
`;
