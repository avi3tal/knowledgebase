import styled, { css } from "styled-components";

/** The figure's drawing area: as wide as the figure; scrolls if the still is wider. */
export const Fit = styled.div<{ $expanded?: boolean }>`
  display: flex;
  justify-content: safe center;
  overflow-x: auto;
  ${({ $expanded }) =>
    $expanded &&
    css`
      height: 100%;
      align-items: safe center;
      overflow: auto;
    `}
`;

/** Reserves the scaled size in the layout (a transform alone doesn't). */
export const Scaled = styled.div<{ $w: number; $h: number }>`
  flex: none;
  width: ${({ $w }) => ($w ? `${$w}px` : "auto")};
  height: ${({ $h }) => ($h ? `${$h}px` : "auto")};
`;

/** The views of a data-structure still, stacked like in the trace player, at natural size. */
export const Views = styled.div<{ $scale?: number }>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: max-content;
  padding: 4px 8px;
  align-items: center;
  transform: scale(${({ $scale }) => $scale ?? 1});
  transform-origin: top left;
`;
