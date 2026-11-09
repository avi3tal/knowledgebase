import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { filterPalette, kindShape, kindStyle, paletteGroups } from "../design";
import * as S from "./ShapePalette.style";

type Drag = { kind: string; sx: number; sy: number; x: number; y: number; over: boolean } | null;
const MOVED = 5;

/**
 * The Visio-style shapes stencil (left pane on the diagram stages). Tiles pointer-drag onto the
 * canvas (a ghost follows the pointer; `onDrop` gets the screen point and returns whether it landed)
 * and add in the middle of the canvas on click or Enter, so the stencil works from the keyboard too.
 */
export function ShapePalette({
  palette,
  onAdd,
  onDrop,
  onHover,
  disabled = false,
  note,
}: {
  palette: string[];
  onAdd: (kind: string) => void;
  onDrop?: (kind: string, clientX: number, clientY: number) => boolean;
  /** the drag moved over (x, y), or ended (null); returns whether that point accepts a drop */
  onHover?: (clientX: number | null, clientY?: number) => boolean;
  disabled?: boolean;
  note?: string;
}) {
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<Drag>(null);
  const groups = useMemo(() => paletteGroups(palette), [palette]);
  const shown = useMemo(() => filterPalette(groups, q), [groups, q]);
  const moved = (d: NonNullable<Drag>, x: number, y: number) =>
    Math.hypot(x - d.sx, y - d.sy) > MOVED;
  let i = 0;
  const ghost = drag && moved(drag, drag.x, drag.y) ? kindStyle(drag.kind) : null;
  return (
    <S.Root $dragging={Boolean(ghost)}>
      {ghost &&
        drag &&
        createPortal(
          <S.Ghost $x={drag.x} $y={drag.y} $color={ghost.color} $over={drag.over}>
            <S.TileIcon $shape={kindShape(drag.kind)}>{ghost.icon}</S.TileIcon> {ghost.label}
          </S.Ghost>,
          document.body,
        )}
      <S.Filter
        type="search"
        placeholder="🔍 Filter shapes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          const only = shown.length === 1 && shown[0]!.kinds.length === 1;
          if (e.key === "Enter" && only && !disabled) onAdd(shown[0]!.kinds[0]!);
          if (e.key === "Escape") setQ("");
        }}
        aria-label="filter shapes"
      />
      {note && <S.Note>{note}</S.Note>}
      {shown.length === 0 && <S.Empty>No shape matches “{q}”.</S.Empty>}
      {shown.map((g) => (
        <S.Group key={g.title}>
          <h4>
            <span>{g.icon}</span> {g.title}
          </h4>
          <S.Grid $off={disabled}>
            {g.kinds.map((k) => {
              const s = kindStyle(k);
              return (
                <S.Tile
                  key={k}
                  $color={s.color}
                  $i={i++}
                  disabled={disabled}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || disabled) return;
                    e.preventDefault(); // no text selection while dragging
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // synthetic events have no active pointer
                    }
                    setDrag({
                      kind: k,
                      sx: e.clientX,
                      sy: e.clientY,
                      x: e.clientX,
                      y: e.clientY,
                      over: false,
                    });
                  }}
                  onPointerMove={(e) => {
                    if (drag?.kind !== k) return;
                    const over = moved(drag, e.clientX, e.clientY)
                      ? (onHover?.(e.clientX, e.clientY) ?? false)
                      : false;
                    setDrag({ ...drag, x: e.clientX, y: e.clientY, over });
                  }}
                  onPointerUp={(e) => {
                    if (drag?.kind !== k) return;
                    setDrag(null);
                    onHover?.(null);
                    if (!moved(drag, e.clientX, e.clientY)) onAdd(k);
                    else onDrop?.(k, e.clientX, e.clientY);
                  }}
                  onPointerCancel={() => {
                    setDrag(null);
                    onHover?.(null);
                  }}
                  onClick={(e) => {
                    if (e.detail === 0) onAdd(k); // keyboard activation (Enter / Space)
                  }}
                  title={`${s.label}: drag onto the canvas, or click / Enter to add it`}
                >
                  <S.TileIcon $shape={kindShape(k)} aria-hidden>
                    {s.icon}
                  </S.TileIcon>
                  <S.TileLabel>{s.label}</S.TileLabel>
                </S.Tile>
              );
            })}
          </S.Grid>
        </S.Group>
      ))}
      <S.Foot>
        Drag a shape onto the grid, or click it to drop it in the middle. Connect shapes from the ●
        handle on their right edge.
      </S.Foot>
    </S.Root>
  );
}
