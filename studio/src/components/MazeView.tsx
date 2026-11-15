import type { ReactNode } from "react";
import { useId } from "react";
import type { Cell, MazeState, MazeViewSpec } from "../trace";
import { cellKey, frontierOrder, heatOf } from "../maze";
import * as TV from "./TraceViews.style";
import type { SwatchKind } from "./MazeView.style";
import * as S from "./MazeView.style";

/** Top-left corner of a cell / centre of a cell, in SVG units. */
const at = (c: Cell) => ({ $x: c[1] * S.MAZE_CELL, $y: c[0] * S.MAZE_CELL });
const centre = (c: Cell) => ({
  x: c[1] * S.MAZE_CELL + S.MAZE_CELL / 2,
  y: c[0] * S.MAZE_CELL + S.MAZE_CELL / 2,
});

export interface MazeExtras {
  /** discovery rank of every visited cell (heat tint) */
  rank?: Map<string, number>;
  /** region (e.g. island) of every visited cell, when the search numbers its regions */
  groups?: Map<string, number>;
  /** Predict mode: hide queue numbers (that would give the answer away) */
  hideOrder?: boolean;
  /** Predict mode: a floor cell was clicked */
  onPick?: (c: Cell) => void;
  /** the route to draw (found at this step or earlier); defaults to the state's own */
  route?: Cell[] | null;
  /** feedback on the last prediction */
  flash?: { cell: Cell; ok: boolean } | null;
}

type Theme = "maze" | "terrain";

/** One cell: wall / water, floor / land (clickable in Predict mode), plus a rock on rubble. */
function Tile({
  ch,
  theme,
  hatch,
  onClick,
}: {
  ch: string;
  theme: Theme;
  hatch: string;
  onClick?: () => void;
}) {
  if (ch === "#")
    return theme === "terrain" ? (
      <>
        <S.Water />
        <S.Waves />
      </>
    ) : (
      <>
        <S.Wall />
        <S.WallHatch $pattern={hatch} />
      </>
    );
  const Ground = theme === "terrain" ? S.Land : S.Floor;
  return (
    <>
      <Ground $pickable={!!onClick} onClick={onClick} />
      {ch === "o" && <S.Rock />}
    </>
  );
}

function Tiles({
  state,
  theme,
  onPick,
}: {
  state: MazeState;
  theme: Theme;
  onPick?: (c: Cell) => void;
}) {
  const hatch = `hatch-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  return (
    <>
      <defs>
        <S.Hatch id={hatch}>
          <S.HatchLine />
        </S.Hatch>
      </defs>
      {state.walls.flatMap((row, r) =>
        [...row].map((ch, c) => (
          <S.At key={`${r},${c}`} {...at([r, c])}>
            <Tile
              ch={ch}
              theme={theme}
              hatch={hatch}
              onClick={onPick ? () => onPick([r, c]) : undefined}
            />
          </S.At>
        )),
      )}
    </>
  );
}

/** Visited cells (heat) and the frontier (dashed, numbered by queue order unless hidden). */
function Search({ state, rank, groups, hideOrder }: { state: MazeState } & MazeExtras) {
  const order = frontierOrder(state);
  return (
    <>
      {state.visited.map((c) => (
        <S.At key={cellKey(c)} {...at(c)}>
          <S.Visited $heat={rank ? heatOf(rank, c) : 0.5} $group={groups?.get(cellKey(c))} />
        </S.At>
      ))}
      {[...order.entries()].map(([k, n]) => (
        <S.At key={k} {...at(k.split(",").map(Number) as Cell)}>
          <S.Frontier />
          {!hideOrder && <S.Order>{n}</S.Order>}
        </S.At>
      ))}
    </>
  );
}

function Markers({ state }: { state: MazeState }) {
  return (
    <>
      {state.start && (
        <S.At {...at(state.start)}>
          <S.Start />
        </S.At>
      )}
      {state.goal && (
        <S.At {...at(state.goal)}>
          <S.GoalPole />
          <S.GoalFlag />
        </S.At>
      )}
    </>
  );
}

/** The shortest route draws itself, then a runner travels it once. */
function Route({ path }: { path: Cell[] }) {
  const pts = path.map(centre);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  return (
    <g key={d}>
      <S.Route points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
      <S.Runner $path={d} $cells={path.length} />
    </g>
  );
}

function Item({ kind, children }: { kind: SwatchKind; children: ReactNode }) {
  return (
    <span>
      <S.Swatch $kind={kind} />
      {children}
    </span>
  );
}

/** What the colours mean, for this theme and the cells this maze actually has. */
function Legend({
  spec,
  theme,
  state,
  hideOrder,
}: {
  spec: MazeViewSpec;
  theme: Theme;
  state: MazeState;
  hideOrder?: boolean;
}) {
  const has = (ch: string) => state.walls.some((row) => row.includes(ch));
  return (
    <S.Legend>
      <Item kind="explorer">expanding</Item>
      {spec.frontier && (
        <Item kind="frontier">
          {hideOrder ? "waiting (order hidden)" : "waiting (1 = expanded next)"}
        </Item>
      )}
      {theme === "terrain" && (
        <>
          <Item kind="land">land</Item>
          <Item kind="water">water</Item>
        </>
      )}
      {spec.visited &&
        (spec.group ? (
          <Item kind="island">visited, one colour per region</Item>
        ) : (
          <Item kind="early">
            visited early → <S.Swatch $kind="late" />
            late
          </Item>
        ))}
      {has("o") && <Item kind="rock">obstacle (costs 1 removal)</Item>}
      {state.goal && <Item kind="route">{spec.parent ? "route it found" : "cheapest route"}</Item>}
    </S.Legend>
  );
}

/** A grid search drawn as a place: walls, start, goal flag, explorer, frontier, heat, route. */
export function MazeView({
  spec,
  state,
  ...extras
}: { spec: MazeViewSpec; state: MazeState } & MazeExtras) {
  const rows = state.walls.length;
  const cols = state.walls[0]?.length ?? 0;
  const { flash } = extras;
  const theme: Theme = spec.theme ?? "maze";
  const route = extras.route ?? state.path;
  return (
    <TV.Block>
      {spec.label && <TV.Label>{spec.label}</TV.Label>}
      <S.Scene>
        <S.Svg
          viewBox={`0 0 ${cols * S.MAZE_CELL} ${rows * S.MAZE_CELL}`}
          $cols={cols}
          role="img"
          aria-label="maze"
        >
          <Tiles state={state} theme={theme} onPick={extras.onPick} />
          <Search state={state} {...extras} />
          <Markers state={state} />
          {route && <Route path={route} />}
          {state.current && <S.Explorer {...at(state.current)} />}
          {flash && (
            <S.At key={`${cellKey(flash.cell)}-${flash.ok}`} {...at(flash.cell)}>
              <S.Flash $ok={flash.ok} />
            </S.At>
          )}
        </S.Svg>
        <Legend spec={spec} theme={theme} state={state} hideOrder={extras.hideOrder} />
      </S.Scene>
    </TV.Block>
  );
}
