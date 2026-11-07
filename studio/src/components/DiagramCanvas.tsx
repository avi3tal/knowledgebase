import type { Ref } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Diagram } from "../api";
import type { Highlight, Point } from "../design";
import {
  NODE_H,
  NODE_W,
  SHAPE_MIME,
  addEdge,
  addNode,
  bounds,
  center,
  edgeKey,
  edgePath,
  freeSpot,
  hitNode,
  kindShape,
  kindStyle,
  moveNode,
  removeEdge,
  removeNode,
  snap,
  truncate,
  withPositions,
  zoomAt,
} from "../design";

type View = { x: number; y: number; k: number };
export type Selection = { type: "node" | "edge"; id: string } | null;
type Gesture =
  | { kind: "drag"; id: string; offX: number; offY: number; x: number; y: number; moved: boolean }
  | { kind: "connect"; from: string; p: Point }
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number }
  | null;

/** What the console can do to a mounted canvas (the stencil lives outside it). */
export interface CanvasHandle {
  /** Add a shape of `kind` in the middle of the visible area (stencil click / Enter). */
  addAtCentre: (kind: string) => void;
  fit: () => void;
  /** Pointer-drag from the stencil ended at a screen point: add there if it is over the canvas. */
  dropAt: (kind: string, clientX: number, clientY: number) => boolean;
  /** A stencil drag is over (x, y), or ended (null): highlight the drop target. */
  hover: (clientX: number | null, clientY?: number) => boolean;
}

const NONE: Highlight = { nodes: new Set(), edges: new Set() };

/** The outline of a node: card, cylinder (stores), capsule (messaging) or pill (people). */
function Outline({ kind, className }: { kind: string; className: string }) {
  const shape = kindShape(kind);
  if (shape === "store") {
    const ry = 7;
    return (
      <path
        className={className}
        d={`M0,${ry} A${NODE_W / 2},${ry} 0 0 1 ${NODE_W},${ry} L${NODE_W},${NODE_H - ry} A${NODE_W / 2},${ry} 0 0 1 0,${NODE_H - ry} Z`}
      />
    );
  }
  const rx = shape === "pipe" ? NODE_H / 2 : shape === "person" ? 22 : 12;
  return <rect className={className} width={NODE_W} height={NODE_H} rx={rx} />;
}

function Decor({ kind }: { kind: string }) {
  const shape = kindShape(kind);
  if (shape === "store")
    return <ellipse className="dg-rim" cx={NODE_W / 2} cy={7} rx={NODE_W / 2} ry={7} />;
  if (shape === "pipe")
    return (
      <g className="dg-slots">
        {[30, 22, 14].map((dx) => (
          <line key={dx} x1={NODE_W - dx} x2={NODE_W - dx} y1={16} y2={NODE_H - 16} />
        ))}
      </g>
    );
  return <rect className="dg-stripe" x={0} y={10} width={4} height={NODE_H - 20} rx={2} />;
}

/**
 * Visio-like SVG canvas for a design diagram. Editable when `onChange` is given: drop shapes from the
 * stencil (HTML5 drag with SHAPE_MIME, or `handle.addAtCentre`), move nodes, connect from a node's
 * handle (or connect mode), delete with the keyboard. Selection is reported through `onSelect`; the
 * inspector lives outside. Read-only otherwise (reference diagrams use the same renderer).
 * `height="fill"` makes the canvas fill its flex parent.
 */
export function DiagramCanvas({
  diagram,
  onChange,
  highlight = NONE,
  smells,
  height = 540,
  selection,
  onSelect,
  onRename,
  handle,
  reservedIds,
}: {
  diagram: Diagram;
  /** @deprecated the stencil lives outside the canvas now; ignored */
  palette?: string[];
  onChange?: (d: Diagram) => void;
  highlight?: Highlight;
  smells?: Map<string, string[]>;
  height?: number | "fill";
  /** controlled selection (else internal) */
  selection?: Selection;
  onSelect?: (s: Selection) => void;
  /** double-click on a shape or arrow: the inspector should focus its label */
  onRename?: () => void;
  handle?: Ref<CanvasHandle>;
  /** ids new shapes must not take (see addNode) */
  reservedIds?: string[];
}) {
  const editable = Boolean(onChange);
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [inner, setInner] = useState<Selection>(null);
  const sel = selection !== undefined ? selection : inner;
  const setSel = (s: Selection) => {
    if (selection === undefined) setInner(s);
    onSelect?.(s);
  };
  const [gesture, setGesture] = useState<Gesture>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

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

  // Fit when the canvas first gets a size (the parent re-keys it per version / part) and from ⤢.
  const latest = useRef(diagram.nodes);
  useEffect(() => {
    latest.current = diagram.nodes;
  }, [diagram.nodes]);
  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return false;
    const { width, height: h } = svg.getBoundingClientRect();
    if (!width || !h) return false;
    const b = bounds(withPositions(latest.current));
    const k = Math.min(1.15, Math.max(0.3, Math.min(width / b.w, h / b.h)));
    setView({ k, x: (width - b.w * k) / 2 - b.x * k, y: (h - b.h * k) / 2 - b.y * k });
    return true;
  }, []);
  useEffect(() => {
    if (fit()) return;
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (fit()) ro.disconnect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // Pinch / ⌘ / Ctrl + wheel zooms around the cursor (needs a non-passive listener).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      // Plain wheel keeps scrolling the page; drag the background to pan.
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      setView((v) => zoomAt(v, p, v.k * Math.exp(-e.deltaY * 0.01)));
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
    } else if (e.key.startsWith("Arrow") && sel?.type === "node" && editable) {
      const n = byId.get(sel.id);
      if (!n) return;
      e.preventDefault();
      const step = e.shiftKey ? 50 : 10;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      change(moveNode(diagram, n.id, n.x + dx, n.y + dy));
    } else if (e.key === "Enter" && sel) {
      onRename?.();
    }
  };

  const drop = (kind: string, at: Point) => {
    if (!editable) return;
    const [next, id] = addNode(
      diagram,
      kind,
      snap(at.x - NODE_W / 2),
      snap(at.y - NODE_H / 2),
      reservedIds,
    );
    change(next);
    setSel({ type: "node", id });
    wrapRef.current?.focus({ preventScroll: true });
  };

  const addAtCentre = (kind: string) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const at = freeSpot(diagram.nodes, { x: c.x - NODE_W / 2, y: c.y - NODE_H / 2 });
    drop(kind, { x: at.x + NODE_W / 2, y: at.y + NODE_H / 2 });
  };

  const contains = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    return Boolean(
      r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom,
    );
  };

  useImperativeHandle(handle, () => ({
    addAtCentre,
    fit: () => void fit(),
    dropAt: (kind, clientX, clientY) => {
      setDropping(false);
      if (!editable || !contains(clientX, clientY)) return false;
      drop(kind, toWorld(clientX, clientY));
      return true;
    },
    hover: (clientX, clientY) => {
      const over = editable && clientX !== null && contains(clientX, clientY ?? 0);
      setDropping((d) => (d === over ? d : over));
      return over;
    },
  }));

  const zoomBy = (f: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (r) setView((v) => zoomAt(v, { x: r.width / 2, y: r.height / 2 }, v.k * f));
  };

  const isShapeDrag = (e: React.DragEvent) => editable && e.dataTransfer.types.includes(SHAPE_MIME);
  const pending = connectMode ? connectFrom : null;
  const fill = height === "fill";

  return (
    <div className={`dg ${editable ? "editable" : "readonly"} ${fill ? "fill" : ""}`}>
      <div
        ref={wrapRef}
        className={`dg-stage ${gesture?.kind ?? ""} ${connectMode ? "connecting" : ""} ${dropping ? "dropping" : ""}`}
        tabIndex={0}
        style={fill ? undefined : { height }}
        onKeyDown={onKey}
        aria-label="diagram canvas"
        onDragOver={(e) => {
          if (!isShapeDrag(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (!dropping) setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
        }}
        onDrop={(e) => {
          setDropping(false);
          const kind = e.dataTransfer.getData(SHAPE_MIME);
          if (!editable || !kind) return;
          e.preventDefault();
          drop(kind, toWorld(e.clientX, e.clientY));
        }}
      >
        <svg
          ref={svgRef}
          className="dg-svg"
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setGesture(null)}
          // Handled here, not on the node/edge: pointer capture retargets dblclick to the svg.
          onDoubleClick={(e) => {
            if (!editable) return;
            const hit = hitNode(shown, toWorld(e.clientX, e.clientY));
            if (hit) setSel({ type: "node", id: hit.id });
            else if (sel?.type !== "edge") return;
            onRename?.();
          }}
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
                  style={{ ["--kc" as string]: kindStyle(a.kind).color }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSel({ type: "edge", id: key });
                    wrapRef.current?.focus({ preventScroll: true });
                  }}
                >
                  <path d={d} className="dg-edge-hit" />
                  <path d={d} className="dg-edge-line" markerEnd={`url(#arrow-${marker}-${uid})`} />
                  <path d={d} className="dg-edge-flow" />
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
                    `shape-${kindShape(n.kind)}`,
                    isSel ? "selected" : "",
                    isNew ? "is-new" : "",
                    smell ? "smelly" : "",
                    pending === n.id ? "pending" : "",
                    gesture?.kind === "drag" && gesture.id === n.id ? "dragging" : "",
                  ].join(" ")}
                  transform={`translate(${n.x} ${n.y})`}
                  style={{ ["--kc" as string]: s.color, ["--i" as string]: i }}
                  onPointerDown={(e) => onNodeDown(e, n.id)}
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
                    <Outline kind={n.kind} className="dg-card" />
                    <Outline kind={n.kind} className="dg-card-tint" />
                    <Decor kind={n.kind} />
                    <circle className="dg-icon-bg" cx={25} cy={NODE_H / 2 + 2} r={15} />
                    <text className="dg-icon" x={25} y={NODE_H / 2 + 3}>
                      {s.icon}
                    </text>
                    <text className="dg-label" x={46} y={26}>
                      {truncate(n.label || n.id, 13)}
                    </text>
                    <text className="dg-kind" x={46} y={41}>
                      {truncate(`${s.label} · ${n.id}`, 17)}
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
          {editable && (
            <button
              onClick={deleteSelection}
              disabled={!sel}
              title="Delete the selection (Delete key)"
              aria-label="delete selection"
            >
              🗑
            </button>
          )}
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out" aria-label="zoom out">
            −
          </button>
          <span className="dg-zoom">{Math.round(view.k * 100)}%</span>
          <button onClick={() => zoomBy(1.2)} title="Zoom in" aria-label="zoom in">
            +
          </button>
          <button onClick={() => void fit()} title="Fit to screen" aria-label="fit">
            ⤢
          </button>
        </div>
        {editable && diagram.nodes.length <= 1 && (
          <div className="dg-empty-hint">
            Drag shapes from the stencil on the left onto the grid (or click one), then drag from a
            shape’s ● handle to another shape to connect them.
          </div>
        )}
        {dropping && <div className="dg-drop-hint">Drop to add</div>}
        {connectMode && (
          <div className="dg-mode-hint">
            {connectFrom ? `From ${connectFrom}: now click the target` : "Click the source shape"}
          </div>
        )}
        {editable && !connectMode && diagram.nodes.length > 1 && (
          <div className="dg-help muted small">
            drag background to pan · ⌘/Ctrl + wheel zooms · Delete removes · arrows nudge ·
            double-click renames
          </div>
        )}
      </div>
    </div>
  );
}
