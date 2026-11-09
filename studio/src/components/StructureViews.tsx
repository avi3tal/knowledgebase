import type {
  CallStackState,
  CallStackViewSpec,
  GraphState,
  GraphViewSpec,
  GridState,
  GridViewSpec,
  HeapViewSpec,
  IntervalsState,
  IntervalsViewSpec,
  Json,
  TreeState,
  TreeViewSpec,
  ArrayState,
} from "../trace";
import { useId } from "react";
import { graphEdgeOn, heapAsTree, intervalBounds, layoutTree, packRows } from "../trace";
import { Muted } from "../theme/primitives";
import { t } from "../theme/theme";
import * as S from "./StructureViews.style";
import * as TV from "./TraceViews.style";

const show = (v: Json | undefined): string =>
  v === undefined || v === null ? "·" : typeof v === "string" ? v : JSON.stringify(v);

const SLOT = 46;
const LEVEL = 62;
const R = 17;
const GROUP_COLORS = [t.warn, t.ok, t.accent, t.bad];

/** Node radius / slot width that fit the longest label (tuples in heaps, e.g. "[9,6]"). */
export function nodeSize(labels: string[]): { r: number; slot: number } {
  const longest = Math.max(1, ...labels.map((l) => l.length));
  const r = Math.min(34, Math.max(R, 6 + longest * 3.6));
  return { r, slot: Math.max(SLOT, 2 * r + 10) };
}

function TreeSvg({
  state,
  pointers = {},
}: {
  state: TreeState;
  pointers?: Record<string, number | null>;
}) {
  const placed = layoutTree(state);
  if (placed.length === 0) return <Muted>empty</Muted>;
  const { r: radius, slot } = nodeSize(placed.map((p) => show(p.val)));
  const pos = new Map(placed.map((p) => [p.id, p]));
  const cx = (x: number) => x * slot + slot / 2;
  const cy = (d: number) => d * LEVEL + radius + 22;
  const width = placed.length * slot;
  const height = (Math.max(...placed.map((p) => p.depth)) + 1) * LEVEL + 20;
  const groupOf = new Map<number, number>();
  Object.values(state.groups ?? {}).forEach((ids, g) => ids.forEach((id) => groupOf.set(id, g)));
  const pointerLabels = new Map<number, string[]>();
  for (const [name, id] of Object.entries(pointers)) {
    if (id !== null) pointerLabels.set(id, [...(pointerLabels.get(id) ?? []), name]);
  }
  return (
    <S.Svg width={width} height={height}>
      {placed.map((p) => {
        const parent = p.parent === null ? undefined : pos.get(p.parent);
        return parent ? (
          <S.Edge
            key={`e${p.id}`}
            x1={cx(parent.x)}
            y1={cy(parent.depth)}
            x2={cx(p.x)}
            y2={cy(p.depth)}
          />
        ) : null;
      })}
      {placed.map((p) => {
        const g = groupOf.get(p.id);
        const labels = pointerLabels.get(p.id);
        return (
          <g key={p.id}>
            <S.Node
              cx={cx(p.x)}
              cy={cy(p.depth)}
              r={radius}
              $pointed={!!labels}
              $stroke={g === undefined ? undefined : GROUP_COLORS[g % GROUP_COLORS.length]}
            />
            <S.NodeText x={cx(p.x)} y={cy(p.depth) + 4} textAnchor="middle">
              {show(p.val)}
            </S.NodeText>
            {labels && (
              <S.NodeTag x={cx(p.x)} y={cy(p.depth) - radius - 6} textAnchor="middle">
                {labels.join(", ")} ▼
              </S.NodeTag>
            )}
          </g>
        );
      })}
    </S.Svg>
  );
}

export function TreeView({ spec, state }: { spec: TreeViewSpec; state: TreeState }) {
  const groups = Object.entries(state.groups ?? {});
  return (
    <TV.Block>
      <TV.Label>{spec.label ?? spec.var}</TV.Label>
      <TreeSvg state={state} pointers={state.pointers} />
      {groups.length > 0 && (
        <S.Legend>
          {groups.map(([name, ids], g) => {
            const vals = new Map(state.nodes.map((n) => [n.id, n.val]));
            return (
              <S.LegendItem key={name} $color={GROUP_COLORS[g % GROUP_COLORS.length] ?? t.muted}>
                ● {name}: [{ids.map((id) => show(vals.get(id))).join(", ")}]
              </S.LegendItem>
            );
          })}
        </S.Legend>
      )}
    </TV.Block>
  );
}

export function HeapView({ spec, state }: { spec: HeapViewSpec; state: ArrayState }) {
  const pointers = Object.fromEntries(
    Object.entries(state.pointers).map(([k, v]) => [k, typeof v === "number" ? v : null]),
  );
  return (
    <TV.Block>
      <TV.Label>
        {spec.label ?? spec.var} (heap: array ↔ tree, children of i at 2i+1, 2i+2)
      </TV.Label>
      <TreeSvg state={heapAsTree(state.values)} pointers={pointers} />
      <S.HeapArray>
        {state.values.map((v, i) => (
          <TV.Cell as="span" key={i} $small $on={i === 0}>
            <TV.CellValue>{show(v)}</TV.CellValue>
            <TV.CellIndex>{i}</TV.CellIndex>
          </TV.Cell>
        ))}
      </S.HeapArray>
    </TV.Block>
  );
}

export function GridView({ spec, state }: { spec: GridViewSpec; state: GridState }) {
  const marked = new Set(state.marked.map(([r, c]) => `${r},${c}`));
  const cursor = new Map<string, string>();
  for (const [name, cell] of Object.entries(state.cells)) {
    if (cell)
      cursor.set(
        `${cell[0]},${cell[1]}`,
        [cursor.get(`${cell[0]},${cell[1]}`), name].filter(Boolean).join(","),
      );
  }
  // DP tables are usually (len+1) x (len+1): labels then sit on rows/cols 1..n.
  const rowOffset = state.row_labels && state.rows.length === state.row_labels.length + 1 ? 1 : 0;
  const colOffset =
    state.col_labels && (state.rows[0]?.length ?? 0) === state.col_labels.length + 1 ? 1 : 0;
  return (
    <TV.Block>
      <TV.Label>{spec.label ?? spec.var}</TV.Label>
      <S.Grid>
        {state.col_labels && (
          <thead>
            <tr>
              {state.row_labels && <th />}
              {(state.rows[0] ?? []).map((_, c) => (
                <th key={c}>
                  {c - colOffset >= 0 ? show(state.col_labels?.[c - colOffset]) : "∅"}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {state.rows.map((row, r) => (
            <tr key={r}>
              {state.row_labels && (
                <th>{r - rowOffset >= 0 ? show(state.row_labels[r - rowOffset]) : "∅"}</th>
              )}
              {row.map((v, c) => {
                const key = `${r},${c}`;
                const cur = cursor.get(key);
                return (
                  <S.GridCell key={c} $marked={marked.has(key)} $cursor={!!cur} title={cur}>
                    {show(v)}
                  </S.GridCell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </S.Grid>
    </TV.Block>
  );
}

export function IntervalsView({ spec, state }: { spec: IntervalsViewSpec; state: IntervalsState }) {
  const [lo, hi] = intervalBounds(state);
  const W = 420;
  const ROW = 24;
  const sx = (v: number) => ((v - lo) / (hi - lo)) * W;
  const first = Object.keys(state.lanes)[0];
  const pointed = new Set(
    Object.values(state.pointers).filter((v): v is number => typeof v === "number"),
  );
  return (
    <TV.Block>
      {spec.label && <TV.Label>{spec.label}</TV.Label>}
      <S.Intervals $width={W + 90}>
        {Object.entries(state.lanes).map(([lane, ivs]) => {
          const rows = packRows(ivs);
          const height = Math.max(1, ...rows.map((r) => r + 1)) * ROW + 2;
          return (
            <S.Lane key={lane}>
              <S.LaneName>{lane}</S.LaneName>
              <S.LaneTrack $width={W} $height={height}>
                {ivs.map(([s, e], i) => (
                  <S.Bar
                    key={i}
                    $pointed={lane === first && pointed.has(i)}
                    $left={sx(s)}
                    $width={Math.max(4, sx(e) - sx(s))}
                    $top={3 + (rows[i] ?? 0) * ROW}
                    title={`[${s}, ${e}]`}
                  >
                    {s}–{e}
                  </S.Bar>
                ))}
              </S.LaneTrack>
            </S.Lane>
          );
        })}
        <S.Axis $width={W}>
          <span>{lo}</span>
          <span>{hi}</span>
        </S.Axis>
      </S.Intervals>
    </TV.Block>
  );
}

/** A general graph at authored positions: weights mid-edge, arrows when directed, labels below. */
export function GraphView({ spec, state }: { spec: GraphViewSpec; state: GraphState }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  if (state.nodes.length === 0) return <Muted>empty</Muted>;
  // circles grow to fit the longest node id (prefixes, names), like tree nodes do
  const { r: R } = nodeSize(state.nodes.map((n) => n.id));
  const pad = R + 26;
  const minX = Math.min(...state.nodes.map((n) => n.x));
  const minY = Math.min(...state.nodes.map((n) => n.y));
  const pos = new Map(state.nodes.map((n) => [n.id, { x: n.x - minX + pad, y: n.y - minY + pad }]));
  const width = Math.max(...[...pos.values()].map((p) => p.x)) + pad;
  const height = Math.max(...[...pos.values()].map((p) => p.y)) + pad;
  const litNodes = new Set(state.highlight.nodes);
  return (
    <TV.Block>
      {spec.label && <TV.Label>{spec.label}</TV.Label>}
      <S.Svg width={width} height={height}>
        <defs>
          <marker
            id={`${uid}-arrow`}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <S.ArrowHead d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>
        {state.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const ux = (b.x - a.x) / len;
          const uy = (b.y - a.y) / len;
          const on = graphEdgeOn(state, e);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <S.Edge
                $on={on}
                x1={a.x + ux * R}
                y1={a.y + uy * R}
                x2={b.x - ux * (R + 2)}
                y2={b.y - uy * (R + 2)}
                markerEnd={e.directed ? `url(#${uid}-arrow)` : undefined}
              />
              {e.w !== null && e.w !== undefined && (
                <S.Weight $on={on} x={mx - uy * 10} y={my + ux * 10 + 4} textAnchor="middle">
                  {show(e.w)}
                </S.Weight>
              )}
            </g>
          );
        })}
        {state.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const label = state.labels[n.id];
          return (
            <g key={n.id}>
              <S.Node cx={p.x} cy={p.y} r={R} $pointed={litNodes.has(n.id)} />
              <S.NodeText x={p.x} y={p.y + 4} textAnchor="middle">
                {n.id}
              </S.NodeText>
              {label && (
                <S.NodeTag x={p.x} y={p.y + R + 15} textAnchor="middle">
                  {label}
                </S.NodeTag>
              )}
            </g>
          );
        })}
      </S.Svg>
    </TV.Block>
  );
}

export function CallStackView({ spec, state }: { spec: CallStackViewSpec; state: CallStackState }) {
  return (
    <TV.Block>
      <TV.Label>{spec.label ?? "call stack (top = current)"}</TV.Label>
      <S.CallStack>
        {[...state.frames].reverse().map((f, i) => (
          <S.Frame key={state.frames.length - i} $top={i === 0}>
            {f.fn}(
            {Object.entries(f.args)
              .map(([k, v]) => `${k}=${show(v)}`)
              .join(", ")}
            )
          </S.Frame>
        ))}
      </S.CallStack>
    </TV.Block>
  );
}
