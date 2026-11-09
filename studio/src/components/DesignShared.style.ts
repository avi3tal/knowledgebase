import styled, { css } from "styled-components";
import { fadeUp, pop } from "../theme/animations";
import { InlineError } from "../theme/primitives";
import { t } from "../theme/theme";

/** Building blocks shared by the design console's stage editors, inspector and parts drawer. */

/** Monospace text in an input / label. */
export const monoText = css`
  font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
  font-size: 0.88em;
`;

/** A short id like F1 / N2 / E3 in the accent colour (or `$color`). */
export const IdChip = styled.span<{ $color?: string }>`
  display: inline-block;
  ${monoText}
  font-size: 0.78em;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
  background: ${({ $color }) =>
    $color ? `color-mix(in srgb, ${$color} 15%, transparent)` : t.accentSoft};
  color: ${({ $color }) => $color ?? t.accent};
`;

/** × button that removes a row. */
export const RemoveX = styled.button`
  border: none;
  background: none;
  color: ${t.muted};
  font-size: 1.15em;
  padding: 2px 6px;
  line-height: 1;
  &:hover:not(:disabled) {
    color: ${t.bad};
  }
`;

/** Dashed "＋ Row" button under a list. */
export const AddButton = styled.button<{ $big?: boolean }>`
  border-style: dashed;
  color: ${t.accent};
  background: transparent;
  margin-top: 8px;
  &:hover:not(:disabled) {
    background: ${t.accentSoft};
  }
  ${({ $big }) =>
    $big &&
    css`
      width: 100%;
      padding: 12px;
      border-radius: ${t.radius};
    `}
`;

export const SheetWrap = styled.div`
  overflow-x: auto;
`;

/** The spreadsheet-like tables of the stage editors. */
export const Sheet = styled.table<{ $readonly?: boolean }>`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.92em;
  th {
    text-align: left;
    font-size: 0.78em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${t.muted};
    padding: 4px 6px;
    border-bottom: 2px solid ${t.border};
  }
  td {
    padding: ${({ $readonly }) => ($readonly ? "6px 8px" : "4px 4px")};
    border-bottom: 1px solid ${t.border};
    vertical-align: top;
  }
  tbody tr {
    animation: ${fadeUp} 0.25s ease both;
  }
  tbody tr:hover td {
    background: ${t.accentSoft};
  }
  input,
  select,
  textarea {
    width: 100%;
    min-width: 70px;
  }
`;

/** A table row; `$chosen` (picked option) and `$error` tint its cells. */
export const Row = styled.tr<{ $chosen?: boolean; $error?: boolean }>`
  ${({ $error }) =>
    $error &&
    css`
      td {
        background: color-mix(in srgb, ${t.bad} 6%, transparent);
      }
    `}
  ${({ $chosen }) =>
    $chosen &&
    css`
      td {
        background: color-mix(in srgb, ${t.ok} 12%, transparent);
      }
    `}
`;

/** Right-aligned numeric header. */
export const NumTh = styled.th`
  && {
    text-align: right;
  }
  white-space: nowrap;
`;

export const MonoInput = styled.input<{ $wide?: boolean }>`
  ${monoText}
  ${({ $wide }) =>
    $wide &&
    css`
      && {
        min-width: 220px;
      }
    `}
`;

export const MonoTextarea = styled.textarea`
  ${monoText}
`;

/** Error line used in toolbars, forms and headers. */
export const ErrorLine = styled(InlineError)<{ $flat?: boolean }>`
  font-size: 0.88em;
  margin: ${({ $flat }) => ($flat ? "0" : "6px 0")};
  white-space: pre-wrap;
  animation: ${pop} 0.2s ease both;
`;

/** A labelled field: small muted caption above a control. */
export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

/** The accent-filled action button (the console's "primary"). */
export const AccentButton = styled.button`
  background: ${t.accent};
  color: ${t.onAccent};
  border-color: ${t.accent};
  font-weight: 600;
`;

export const GhostButton = styled.button`
  background: transparent;
`;

/** Destructive button; `$ghost` drops the fill. */
export const DangerButton = styled.button<{ $ghost?: boolean }>`
  color: ${t.bad};
  ${({ $ghost }) => $ghost && "background: transparent;"}
  &:hover:not(:disabled) {
    border-color: ${t.bad};
  }
`;

/** Bar above a diagram canvas (versions, parts, mode switch). */
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 12px;
  background: ${t.panel};
  border-bottom: 1px solid ${t.border};
`;

/** Second bar: the "why" field, diff chips and status. */
export const Subbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 12px;
  background: color-mix(in srgb, ${t.panel} 70%, ${t.bg});
  border-bottom: 1px solid ${t.border};
  min-height: 40px;
`;

/** Fills what is left of the flush centre column. */
export const CanvasFill = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

/** Info box (the global `.callout`); `$info` swaps the warm edge for the accent. */
export const Callout = styled.div<{ $info?: boolean; $small?: boolean }>`
  background: ${t.panel2};
  border-left: 3px solid ${({ $info }) => ($info ? t.accent : t.warn)};
  padding: 10px 14px;
  border-radius: 6px;
  margin: 12px 0;
  ${({ $small }) => $small && "font-size: 0.85em;"}
`;
