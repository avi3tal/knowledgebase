import type {
  ArrayState,
  ArrayViewSpec,
  Json,
  MapState,
  MapViewSpec,
  VarsState,
  VarsViewSpec,
} from "../trace";
import { changedKeys, changedVars, inWindow } from "../trace";

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
      <div className="array" style={{ width: Math.max(1, state.values.length) * CELL }}>
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
