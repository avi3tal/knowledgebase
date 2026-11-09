import type {
  ArrayState,
  ArrayViewSpec,
  Json,
  LinkedListState,
  LinkedListViewSpec,
  MapState,
  MapViewSpec,
  VarsState,
  VarsViewSpec,
} from "../trace";
import { changedKeys, changedVars, inWindow, linkKind } from "../trace";

const show = (v: Json | undefined): string =>
  v === undefined || v === null ? "—" : typeof v === "string" ? v : JSON.stringify(v);

const CELL = 48; // px — keep in sync with .cell width + gap in styles.css

export function ArrayView({ spec, state }: { spec: ArrayViewSpec; state: ArrayState }) {
  const pointers = Object.entries(state.pointers).filter(
    (e): e is [string, number] => typeof e[1] === "number",
  );
  const win = state.window;
  return (
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? spec.var}</div>
      <div
        className="array"
        style={{
          width: Math.max(1, state.values.length) * CELL,
          // room for every pointer row (labels stack 22px apart under the cells)
          paddingBottom: Math.max(56, 12 + Object.keys(state.pointers).length * 22),
        }}
      >
        {win && (
          <div
            className="window-frame"
            style={{ left: win[0] * CELL, width: (win[1] - win[0] + 1) * CELL - 6 }}
          />
        )}
        {state.values.map((v, i) => (
          <div key={i} className={`cell ${inWindow(state, i) ? "in-window" : ""}`}>
            <span className="cell-value">{show(v)}</span>
            <span className="cell-index">{i}</span>
          </div>
        ))}
        {pointers.map(([name, idx], k) => (
          <div
            key={name}
            className={`pointer pointer-${k % 3}`}
            style={{ transform: `translateX(${idx * CELL}px)`, top: 64 + k * 22 }}
          >
            ▲ {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MapView({
  spec,
  state,
  prev,
}: {
  spec: MapViewSpec;
  state: MapState;
  prev?: MapState;
}) {
  const changed = changedKeys(prev, state);
  return (
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? spec.var}</div>
      <div className="map">
        {state.entries.length === 0 && <span className="muted">empty</span>}
        {state.entries.map(([k, v]) => (
          <div
            key={JSON.stringify(k)}
            className={`chip ${changed.has(JSON.stringify(k)) ? "changed" : ""}`}
          >
            <b>{show(k)}</b>
            {v !== null && <span> → {show(v)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VarsView({
  spec,
  state,
  prev,
}: {
  spec: VarsViewSpec;
  state: VarsState;
  prev?: VarsState;
}) {
  const changed = changedVars(prev, state);
  return (
    <div className="viz-block">
      {spec.label && <div className="viz-label">{spec.label}</div>}
      <div className="vars">
        {Object.entries(state.values).map(([k, v]) => (
          <div key={k} className={`var ${changed.has(k) ? "changed" : ""}`}>
            <span className="var-name">{k}</span>
            <span className="var-value">{show(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NODE_W = 46;
const NODE_STEP = 78;
const NODE_TOP = 58;
const NODE_H = 38;

export function LinkedListView({
  spec,
  state,
}: {
  spec: LinkedListViewSpec;
  state: LinkedListState;
}) {
  const pos = new Map(state.nodes.map((n, i) => [n.id, i]));
  const x = (i: number) => i * NODE_STEP;
  const pointers = Object.entries(state.pointers);
  const width = Math.max(1, state.nodes.length) * NODE_STEP;
  return (
    <div className="viz-block">
      <div className="viz-label">{spec.label ?? spec.var}</div>
      <div className="linked-list" style={{ width, height: NODE_TOP + NODE_H + 46 }}>
        <svg className="links" width={width} height={NODE_TOP + NODE_H + 46}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {state.nodes.map((n, i) => {
            const kind = linkKind(state, i);
            const from = x(i) + NODE_W;
            const midY = NODE_TOP + NODE_H / 2;
            if (kind === "none") {
              return (
                <text key={n.id} x={from + 6} y={midY + 4} className="null-link">
                  ∅
                </text>
              );
            }
            const target = n.next === null ? 0 : (pos.get(n.next) ?? 0);
            if (kind === "forward") {
              return (
                <path
                  key={n.id}
                  className="link"
                  d={`M ${from} ${midY} L ${x(target) - 2} ${midY}`}
                  markerEnd="url(#arrow)"
                />
              );
            }
            // Curved arrow below the row for reversed links / cycles, above for forward skips.
            const back = kind === "back";
            const startX = x(i) + NODE_W / 2;
            const endX = x(target) + NODE_W / 2;
            const y0 = back ? NODE_TOP + NODE_H : NODE_TOP;
            const bend = back ? NODE_TOP + NODE_H + 34 : NODE_TOP - 26;
            return (
              <path
                key={n.id}
                className={`link ${back ? "back" : "skip"}`}
                d={`M ${startX} ${y0} C ${startX} ${bend}, ${endX} ${bend}, ${endX} ${y0 + (back ? 2 : -2)}`}
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>
        {state.nodes.map((n, i) => (
          <div
            key={n.id}
            className="list-node"
            style={{ left: x(i), top: NODE_TOP, width: NODE_W, height: NODE_H }}
          >
            {show(n.val)}
          </div>
        ))}
        {pointers.map(([name, id], k) => (
          <div
            key={name}
            className={`pointer pointer-${k % 3} ${id === null ? "pointer-null" : ""}`}
            style={{
              transform: `translateX(${id === null ? -NODE_STEP * 0.6 : x(pos.get(id) ?? 0)}px)`,
              top: k * 16,
              width: NODE_W,
            }}
          >
            {name}
            {id === null ? " = ∅" : " ▼"}
          </div>
        ))}
      </div>
    </div>
  );
}
