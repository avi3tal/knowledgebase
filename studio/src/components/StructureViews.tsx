import type {
  CallStackState,
  CallStackViewSpec,
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
import { heapAsTree, intervalBounds, layoutTree, packRows } from "../trace";

const show = (v: Json | undefined): string =>
  v === undefined || v === null ? "·" : typeof v === "string" ? v : JSON.stringify(v);

const SLOT = 46;
const LEVEL = 62;
const R = 17;
const GROUP_COLORS = ["var(--warn)", "var(--ok)", "var(--accent)", "var(--bad)"];

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
  if (placed.length === 0) return <span className="muted">empty</span>;
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
    <svg className="tree" width={width} height={height}>
      {placed.map((p) => {
        const parent = p.parent === null ? undefined : pos.get(p.parent);
        return parent ? (
          <line
            key={`e${p.id}`}
            className="edge"
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
          <g key={p.id} className="tree-node">
            <circle
              cx={cx(p.x)}
              cy={cy(p.depth)}
              r={radius}
              className={labels ? "pointed" : ""}
              style={
                g === undefined
                  ? undefined
                  : { stroke: GROUP_COLORS[g % GROUP_COLORS.length], strokeWidth: 3 }
              }
            />
            <text
              x={cx(p.x)}
              y={cy(p.depth) + 4}
              textAnchor="middle"
              className={radius > R ? "long" : ""}
            >
              {show(p.val)}
            </text>
            {labels && (
              <text
                x={cx(p.x)}
                y={cy(p.depth) - radius - 6}
                textAnchor="middle"
                className="node-pointer"
              >
                {labels.join(", ")} ▼
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function TreeView({ spec, state }: { spec: TreeViewSpec; state: TreeState }) {
  const groups = Object.entries(state.groups ?? {});
  return (
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? spec.var}</div>
      <TreeSvg state={state} pointers={state.pointers} />
      {groups.length > 0 && (
        <div className="legend">
          {groups.map(([name, ids], g) => {
            const vals = new Map(state.nodes.map((n) => [n.id, n.val]));
            return (
              <span key={name} style={{ color: GROUP_COLORS[g % GROUP_COLORS.length] }}>
                ● {name}: [{ids.map((id) => show(vals.get(id))).join(", ")}]
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function HeapView({ spec, state }: { spec: HeapViewSpec; state: ArrayState }) {
  const pointers = Object.fromEntries(
    Object.entries(state.pointers).map(([k, v]) => [k, typeof v === "number" ? v : null]),
  );
  return (
    <div className="viz-block">
      <div className="viz-label">
        {spec.label ?? spec.var} (heap: array ↔ tree, children of i at 2i+1, 2i+2)
      </div>
      <TreeSvg state={heapAsTree(state.values)} pointers={pointers} />
      <div className="heap-array">
        {state.values.map((v, i) => (
          <span key={i} className={`cell small-cell ${i === 0 ? "in-window" : ""}`}>
            <span className="cell-value">{show(v)}</span>
            <span className="cell-index">{i}</span>
          </span>
        ))}
      </div>
    </div>
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
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? spec.var}</div>
      <table className="dp-grid">
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
                  <td
                    key={c}
                    className={`${marked.has(key) ? "marked" : ""} ${cur ? "cursor" : ""}`}
                    title={cur}
                  >
                    {show(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div className="viz-block">
      {spec.label && <div className="viz-label">{spec.label}</div>}
      <div className="intervals" style={{ width: W + 90 }}>
        {Object.entries(state.lanes).map(([lane, ivs]) => {
          const rows = packRows(ivs);
          const height = Math.max(1, ...rows.map((r) => r + 1)) * ROW + 2;
          return (
            <div key={lane} className="lane">
              <span className="lane-name">{lane}</span>
              <div className="lane-track" style={{ width: W, height }}>
                {ivs.map(([s, e], i) => (
                  <div
                    key={i}
                    className={`bar ${lane === first && pointed.has(i) ? "pointed" : ""}`}
                    style={{
                      left: sx(s),
                      width: Math.max(4, sx(e) - sx(s)),
                      top: 3 + (rows[i] ?? 0) * ROW,
                    }}
                    title={`[${s}, ${e}]`}
                  >
                    {s}–{e}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="axis" style={{ marginLeft: 90, width: W }}>
          <span>{lo}</span>
          <span>{hi}</span>
        </div>
      </div>
    </div>
  );
}

export function CallStackView({ spec, state }: { spec: CallStackViewSpec; state: CallStackState }) {
  return (
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? "call stack (top = current)"}</div>
      <div className="callstack">
        {[...state.frames].reverse().map((f, i) => (
          <div key={state.frames.length - i} className={`frame ${i === 0 ? "top" : ""}`}>
            {f.fn}(
            {Object.entries(f.args)
              .map(([k, v]) => `${k}=${show(v)}`)
              .join(", ")}
            )
          </div>
        ))}
      </div>
    </div>
  );
}
