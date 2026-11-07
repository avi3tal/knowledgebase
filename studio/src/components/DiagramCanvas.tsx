import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Diagram } from "../api";
import type { Highlight, Point } from "../design";
import {
  NODE_H,
  NODE_W,
  addEdge,
  addNode,
  bounds,
  center,
  edgeKey,
  edgePath,
  hitNode,
  kindStyle,
  moveNode,
  relabelEdge,
  relabelNode,
  removeEdge,
  removeNode,
  reverseEdge,
  snap,
  truncate,
  withPositions,
  zoomAt,
} from "../design";

type View = { x: number; y: number; k: number };
type Selection = { type: "node" | "edge"; id: string } | null;
type Gesture =
  | { kind: "drag"; id: string; offX: number; offY: number; x: number; y: number; moved: boolean }
  | { kind: "connect"; from: string; p: Point }
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | null;

const NONE: Highlight = { nodes: new Set(), edges: new Set() };
const DRAG_MIME = "text/x-kb-kind";

/**
 * Visio-like SVG canvas for a design diagram. Editable when `onChange` is given: drag shapes from
 * the palette, move nodes, connect from a node's handle (or connect mode), label/delete edges.
 * Read-only otherwise (reference diagrams use the same renderer).
 */
export function DiagramCanvas({
  diagram,
  palette = [],
  onChange,
  highlight = NONE,
  smells,
  height = 540,
}: {
  diagram: Diagram;
  palette?: string[];
  onChange?: (d: Diagram) => void;
  highlight?: Highlight;
  smells?: Map<string, string[]>;
  height?: number;
}) {
  const editable = Boolean(onChange);
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [sel, setSel] = useState<Selection>(null);
  const [gesture, setGesture] = useState<Gesture>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const nodes = useMemo(() => withPositions(diagram.nodes), [diagram.nodes]);
  const shown = useMemo(
    () =>
      gesture?.kind === "drag"
        ? nodes.map((n) => (n.id === gesture.id ? { ...n, x: gesture.x, y: gesture.y } : n))
        : nodes,
    [nodes, gesture],
  );
  const byId = useMemo(() => new Map(shown.map((n) => [n.id, n])), [shown]);
  const edgeKeys = useMemo(() => new Set(diagram.edges.map(edgeKey)), [diagram.edges]);

  const change = (d: Diagram) => onChange?.(d);

  // Fit runs on mount (the parent re-keys the canvas per version) and from the ⤢ button.
  const latest = useRef(diagram.nodes);
  useEffect(() => {
    latest.current = diagram.nodes;
  }, [diagram.nodes]);
  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height: h } = svg.getBoundingClientRect();
    if (!width || !h) return;
    const b = bounds(withPositions(latest.current));
    const k = Math.min(1.15, Math.max(0.3, Math.min(width / b.w, h / b.h)));
    setView({ k, x: (width - b.w * k) / 2 - b.x * k, y: (h - b.h * k) / 2 - b.y * k });
  }, []);
  useLayoutEffect(fit, [fit]);

  // Wheel: pinch / ⌘ / Ctrl zooms around the cursor, plain wheel pans (needs a non-passive listener).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const p = { x: e.clientX - r.left, y: e.clientY - r.top };
        setView((v) => zoomAt(v, p, v.k * Math.exp(-e.deltaY * 0.01)));
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const toWorld = (clientX: number, clientY: number): Point => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (clientX - r.left - view.x) / view.k, y: (clientY - r.top - view.y) / view.k };
  };

  const capture = (e: React.PointerEvent) => {
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // synthetic events have no active pointer
    }
  };

  const onBackgroundDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setSel(null);
    setConnectFrom(null);
    capture(e);
    setGesture({ kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y });
    wrapRef.current?.focus({ preventScroll: true });
  };

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    wrapRef.current?.focus({ preventScroll: true });
    if (editable && connectMode) {
      if (!connectFrom) setConnectFrom(id);
      else {
        const next = addEdge(diagram, connectFrom, id);
        if (next !== diagram) {
          change(next);
          setSel({ type: "edge", id: `${connectFrom}->${id}` });
        }
        setConnectFrom(null);
      }
      return;
    }
    setSel({ type: "node", id });
    const n = byId.get(id);
    if (!editable || !n) return;
    const w = toWorld(e.clientX, e.clientY);
    capture(e);
    setGesture({
      kind: "drag",
      id,
      offX: w.x - n.x,
      offY: w.y - n.y,
      x: n.x,
      y: n.y,
      moved: false,
    });
  };

  const onHandleDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0 || !editable) return;
    e.stopPropagation();
    capture(e);
    setSel({ type: "node", id });
    setGesture({ kind: "connect", from: id, p: toWorld(e.clientX, e.clientY) });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!gesture) return;
    if (gesture.kind === "pan") {
      setView((v) => ({
        ...v,
        x: gesture.vx + e.clientX - gesture.sx,
        y: gesture.vy + e.clientY - gesture.sy,
      }));
    } else if (gesture.kind === "drag") {
      const w = toWorld(e.clientX, e.clientY);
      const x = snap(w.x - gesture.offX);
      const y = snap(w.y - gesture.offY);
      if (x !== gesture.x || y !== gesture.y) setGesture({ ...gesture, x, y, moved: true });
    } else {
      setGesture({ ...gesture, p: toWorld(e.clientX, e.clientY) });
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (gesture?.kind === "drag" && gesture.moved) {
      change(moveNode(diagram, gesture.id, gesture.x, gesture.y));
    } else if (gesture?.kind === "connect") {
      const target = hitNode(shown, toWorld(e.clientX, e.clientY));
      if (target && target.id !== gesture.from) {
        const next = addEdge(diagram, gesture.from, target.id);
        if (next !== diagram) {
          change(next);
          setSel({ type: "edge", id: `${gesture.from}->${target.id}` });
        }
      }
    }
    setGesture(null);
  };

  const deleteSelection = () => {
    if (!sel || !editable) return;
    change(sel.type === "node" ? removeNode(diagram, sel.id) : removeEdge(diagram, sel.id));
    setSel(null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== wrapRef.current) return; // never while typing in the inspector
    if ((e.key === "Delete" || e.key === "Backspace") && sel) {
      e.preventDefault();
      deleteSelection();
    } else if (e.key === "Escape") {
      setSel(null);
      setConnectFrom(null);
      setConnectMode(false);
    }
  };

  const drop = (kind: string, at: Point) => {
    if (!editable) return;
    const [next, id] = addNode(diagram, kind, snap(at.x - NODE_W / 2), snap(at.y - NODE_H / 2));
    change(next);
    setSel({ type: "node", id });
    wrapRef.current?.focus({ preventScroll: true });
  };

  const addAtCentre = (kind: string) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const jitter = (diagram.nodes.length % 5) * 24;
    drop(kind, { x: c.x + jitter, y: c.y + jitter });
  };

  const zoomBy = (f: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (r) setView((v) => zoomAt(v, { x: r.width / 2, y: r.height / 2 }, v.k * f));
  };

  const selNode = sel?.type === "node" ? diagram.nodes.find((n) => n.id === sel.id) : undefined;
  const selEdge =
    sel?.type === "edge" ? diagram.edges.find((x) => edgeKey(x) === sel.id) : undefined;
  const pending = connectMode ? connectFrom : null;

  return (
    <div className={`dg ${editable ? "editable" : "readonly"}`}>
      {editable && (
        <aside className="dg-palette" aria-label="shapes">
          <div className="dg-palette-title">Shapes</div>
          {palette.map((k, i) => {
            const s = kindStyle(k);
            return (
              <button
                key={k}
                className="dg-shape"
                draggable
                style={{ ["--kc" as string]: s.color, ["--i" as string]: i }}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_MIME, k);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => addAtCentre(k)}
                title={`Drag onto the canvas (or click) to add a ${s.label}`}
              >
                <span className="dg-shape-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </aside>
      )}
      <div className="dg-main">
        <div
          ref={wrapRef}
          className={`dg-stage ${gesture?.kind ?? ""} ${connectMode ? "connecting" : ""}`}
          tabIndex={0}
          style={{ height }}
          onKeyDown={onKey}
          onDragOver={(e) => {
            if (editable && e.dataTransfer.types.includes(DRAG_MIME)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            const kind = e.dataTransfer.getData(DRAG_MIME);
            if (!kind) return;
            e.preventDefault();
            drop(kind, toWorld(e.clientX, e.clientY));
          }}
          aria-label="diagram canvas"
        >
          <svg
            ref={svgRef}
            className="dg-svg"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => setGesture(null)}
          >
            <defs>
              <pattern
                id={`grid-${uid}`}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${view.x} ${view.y}) scale(${view.k})`}
              >
                <circle cx={1} cy={1} r={1} className="dg-grid-dot" />
              </pattern>
              <pattern
                id={`grid-major-${uid}`}
                width={100}
                height={100}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${view.x} ${view.y}) scale(${view.k})`}
              >
                <path d="M100 0 L0 0 0 100" className="dg-grid-line" />
              </pattern>
              {(["plain", "new", "sel"] as const).map((m) => (
                <marker
                  key={m}
                  id={`arrow-${m}-${uid}`}
                  viewBox="0 0 10 10"
                  refX={8}
                  refY={5}
                  markerWidth={7}
                  markerHeight={7}
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" className={`dg-arrow ${m}`} />
                </marker>
              ))}
            </defs>
            <rect
              className="dg-bg"
              width="100%"
              height="100%"
              fill={`url(#grid-${uid})`}
              onPointerDown={onBackgroundDown}
            />
            <rect
              className="dg-bg-major"
              width="100%"
              height="100%"
              fill={`url(#grid-major-${uid})`}
              pointerEvents="none"
            />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {diagram.edges.map((ed) => {
                const a = byId.get(ed.from);
                const b = byId.get(ed.to);
                if (!a || !b) return null;
                const key = edgeKey(ed);
                const bend = edgeKeys.has(`${ed.to}->${ed.from}`) ? 22 : 0;
                const { d, mid } = edgePath(a, b, bend);
                const isNew = highlight.edges.has(key);
                const isSel = sel?.type === "edge" && sel.id === key;
                const marker = isSel ? "sel" : isNew ? "new" : "plain";
                const label = ed.label ? truncate(ed.label, 28) : "";
                return (
                  <g
                    key={key}
                    className={`dg-edge ${isNew ? "is-new" : ""} ${isSel ? "selected" : ""}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSel({ type: "edge", id: key });
                      wrapRef.current?.focus({ preventScroll: true });
                    }}
                    onDoubleClick={() => {
                      if (editable) setTimeout(() => labelRef.current?.select(), 0);
                    }}
                  >
                    <path d={d} className="dg-edge-hit" />
                    <path
                      d={d}
                      className="dg-edge-line"
                      markerEnd={`url(#arrow-${marker}-${uid})`}
                    />
                    {label && (
                      <g className="dg-edge-label" transform={`translate(${mid.x} ${mid.y})`}>
                        <rect
                          x={-(label.length * 3.4 + 8)}
                          y={-10}
                          width={label.length * 6.8 + 16}
                          height={20}
                          rx={10}
                        />
                        <text textAnchor="middle" dominantBaseline="central">
                          {label}
                        </text>
                      </g>
                    )}
                    {ed.label && <title>{ed.label}</title>}
                  </g>
                );
              })}
              {gesture?.kind === "connect" &&
                (() => {
                  const a = byId.get(gesture.from);
                  if (!a) return null;
                  const c = center(a);
                  return (
                    <path
                      className="dg-temp-edge"
                      d={`M${c.x},${c.y} L${gesture.p.x},${gesture.p.y}`}
                      markerEnd={`url(#arrow-sel-${uid})`}
                    />
                  );
                })()}
              {shown.map((n, i) => {
                const s = kindStyle(n.kind);
                const isNew = highlight.nodes.has(n.id);
                const smell = smells?.get(n.id);
                const isSel = sel?.type === "node" && sel.id === n.id;
                return (
                  <g
                    key={n.id}
                    className={[
                      "dg-node",
                      isSel ? "selected" : "",
                      isNew ? "is-new" : "",
                      smell ? "smelly" : "",
                      pending === n.id ? "pending" : "",
                      gesture?.kind === "drag" && gesture.id === n.id ? "dragging" : "",
                    ].join(" ")}
                    transform={`translate(${n.x} ${n.y})`}
                    style={{ ["--kc" as string]: s.color, ["--i" as string]: i }}
                    onPointerDown={(e) => onNodeDown(e, n.id)}
                    onDoubleClick={() => {
                      if (!editable) return;
                      setSel({ type: "node", id: n.id });
                      setTimeout(() => labelRef.current?.select(), 0);
                    }}
                  >
                    <g className="dg-node-body">
                      {smell && (
                        <rect
                          className="dg-smell-ring"
                          x={-6}
                          y={-6}
                          width={NODE_W + 12}
                          height={NODE_H + 12}
                          rx={16}
                        />
                      )}
                      <rect className="dg-card" width={NODE_W} height={NODE_H} rx={12} />
                      <rect className="dg-card-tint" width={NODE_W} height={NODE_H} rx={12} />
                      <rect
                        className="dg-stripe"
                        x={0}
                        y={10}
                        width={4}
                        height={NODE_H - 20}
                        rx={2}
                      />
                      <circle className="dg-icon-bg" cx={30} cy={NODE_H / 2} r={18} />
                      <text className="dg-icon" x={30} y={NODE_H / 2 + 1}>
                        {s.icon}
                      </text>
                      <text className="dg-label" x={56} y={25}>
                        {truncate(n.label || n.id, 15)}
                      </text>
                      <text className="dg-kind" x={56} y={43}>
                        {truncate(`${s.label} · ${n.id}`, 22)}
                      </text>
                      {isNew && (
                        <g className="dg-new-badge" transform={`translate(${NODE_W - 30} -9)`}>
                          <rect width={38} height={18} rx={9} />
                          <text x={19} y={9}>
                            NEW
                          </text>
                        </g>
                      )}
                      {smell && (
                        <g className="dg-smell-badge" transform="translate(-10 -10)">
                          <circle cx={10} cy={10} r={10} />
                          <text x={10} y={10}>
                            !
                          </text>
                        </g>
                      )}
                      {editable && (
                        <circle
                          className="dg-handle"
                          cx={NODE_W}
                          cy={NODE_H / 2}
                          r={7}
                          onPointerDown={(e) => onHandleDown(e, n.id)}
                        >
                          <title>Drag to another shape to connect</title>
                        </circle>
                      )}
                    </g>
                    <title>
                      {`${n.label || n.id} (${s.label}, id ${n.id})${smell ? `\n⚠ ${smell.join("\n⚠ ")}` : ""}`}
                    </title>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="dg-tools">
            {editable && (
              <button
                className={connectMode ? "on" : ""}
                onClick={() => {
                  setConnectMode((m) => !m);
                  setConnectFrom(null);
                }}
                title="Connect mode: click a source, then a target"
              >
                🔗 Connect
              </button>
            )}
            <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out" aria-label="zoom out">
              −
            </button>
            <span className="dg-zoom">{Math.round(view.k * 100)}%</span>
            <button onClick={() => zoomBy(1.2)} title="Zoom in" aria-label="zoom in">
              +
            </button>
            <button onClick={fit} title="Fit to screen" aria-label="fit">
              ⤢
            </button>
          </div>
          {editable && diagram.nodes.length <= 1 && (
            <div className="dg-empty-hint">
              Drag shapes from the left onto the grid, then drag from a shape’s ● handle to another
              shape to connect them.
            </div>
          )}
          {connectMode && (
            <div className="dg-mode-hint">
              {connectFrom ? `From ${connectFrom}: now click the target` : "Click the source shape"}
            </div>
          )}
        </div>
        {editable && (
          <div className={`dg-inspector ${sel ? "on" : ""}`}>
            {selNode && (
              <>
                <span
                  className="dg-insp-kind"
                  style={{ ["--kc" as string]: kindStyle(selNode.kind).color }}
                >
                  {kindStyle(selNode.kind).icon} {kindStyle(selNode.kind).label}
                </span>
                <code>{selNode.id}</code>
                <label className="grow">
                  <span className="muted small">label</span>
                  <input
                    ref={labelRef}
                    value={selNode.label ?? ""}
                    placeholder={selNode.id}
                    onChange={(e) => change(relabelNode(diagram, selNode.id, e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && wrapRef.current?.focus()}
                  />
                </label>
                <button className="danger" onClick={deleteSelection}>
                  🗑 Delete
                </button>
              </>
            )}
            {selEdge && (
              <>
                <span className="dg-insp-kind">↗ edge</span>
                <code>
                  {selEdge.from} → {selEdge.to}
                </code>
                <label className="grow">
                  <span className="muted small">label</span>
                  <input
                    ref={labelRef}
                    value={selEdge.label ?? ""}
                    placeholder="e.g. read-through, GET /{code}"
                    onChange={(e) => {
                      change(relabelEdge(diagram, edgeKey(selEdge), e.target.value));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && wrapRef.current?.focus()}
                  />
                </label>
                <button
                  onClick={() => {
                    const next = reverseEdge(diagram, edgeKey(selEdge));
                    if (next === diagram) return;
                    change(next);
                    setSel({ type: "edge", id: `${selEdge.to}->${selEdge.from}` });
                  }}
                >
                  ⇄ Reverse
                </button>
                <button className="danger" onClick={deleteSelection}>
                  🗑 Delete
                </button>
              </>
            )}
            {!sel && (
              <span className="muted small">
                Click a shape or an arrow to edit it · double-click a shape to rename · Delete
                removes the selection · drag the background to pan · ⌘/Ctrl + wheel zooms
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
