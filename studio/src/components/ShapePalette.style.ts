import styled, { css } from "styled-components";
import { fadeUp } from "../theme/animations";
import { t } from "../theme/theme";

export type TileShape = "store" | "pipe" | "person" | "card";

export const Filter = styled.input`
  width: 100%;
  margin-bottom: 8px;
`;

export const Note = styled.p`
  margin: 0 0 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: ${t.panel2};
  color: ${t.muted};
  font-size: 0.85em;
`;

export const Group = styled.section`
  margin-bottom: 12px;
  h4 {
    margin: 0 0 6px;
    font-size: 0.72em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${t.muted};
  }
`;

export const Grid = styled.div<{ $off: boolean }>`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  ${({ $off }) => $off && "opacity: 0.45;"}
`;

export const TileIcon = styled.span<{ $shape: TileShape }>`
  display: grid;
  place-items: center;
  width: 46px;
  height: 30px;
  font-size: 16px;
  border-radius: ${({ $shape }) =>
    $shape === "store"
      ? "50% / 22%"
      : $shape === "pipe"
        ? "999px"
        : $shape === "person"
          ? "14px"
          : "8px"};
  border: 2px solid var(--kc);
  background: color-mix(in srgb, var(--kc) 18%, ${t.panel});
`;

export const TileLabel = styled.span`
  font-weight: 600;
  text-align: center;
  line-height: 1.15;
`;

export const Tile = styled.button<{ $color: string; $i: number }>`
  --kc: ${({ $color }) => $color};
  touch-action: none;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px 6px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--kc) 30%, ${t.border});
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--kc) 10%, ${t.panel}),
    ${t.panel} 70%
  );
  cursor: grab;
  font-size: 0.8em;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $i }) => Math.min($i, 20) * 18}ms;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  &:hover:not(:disabled),
  &:focus-visible {
    transform: translateY(-2px);
    border-color: var(--kc);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--kc) 25%, transparent);
    @media (prefers-reduced-motion: reduce) {
      transform: none;
    }
  }
  &:active {
    cursor: grabbing;
    transform: scale(0.96);
  }
`;

/** While a tile is being dragged the whole stencil shows the grabbing cursor. */
export const Root = styled.div<{ $dragging: boolean }>`
  ${({ $dragging }) =>
    $dragging &&
    css`
      cursor: grabbing;
      ${Tile} {
        cursor: grabbing;
      }
    `}
`;

export const Foot = styled.p`
  margin-top: 8px;
  color: ${t.muted};
  font-size: 0.85em;
`;

export const Empty = styled.p`
  color: ${t.muted};
  font-size: 0.85em;
`;

/** The shape that follows the pointer during a drag; position comes from `$x` / `$y`. */
export const Ghost = styled.div.attrs<{ $x: number; $y: number }>(({ $x, $y }) => ({
  style: { left: $x, top: $y },
}))<{ $x: number; $y: number; $color: string; $over: boolean }>`
  --kc: ${({ $color }) => $color};
  position: fixed;
  z-index: 90;
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(-4deg);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 8px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.9em;
  background: ${t.panel};
  border: 2px solid var(--kc);
  box-shadow: ${t.shadowLift};
  opacity: 0.85;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
  ${({ $over }) =>
    $over &&
    css`
      opacity: 1;
      transform: translate(-50%, -50%) rotate(0deg) scale(1.08);
      box-shadow: 0 14px 30px color-mix(in srgb, var(--kc) 40%, transparent);
    `}
`;
