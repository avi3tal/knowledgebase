import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Figure, FlowchartFigure, SequenceFigure } from "../figures";
import {
  FLOW,
  SEQ,
  TONE_ICON,
  applyScenario,
  architectureDiagram,
  circled,
  edgeStepNumbers,
  flowCenter,
  flowEdgePath,
  flowSize,
  laneX,
  scenarioTabs,
  sequenceSize,
  stepFailed,
  stepHighlight,
  stepsOf,
} from "../figures";
import { kindStyle } from "../design";
import type { CanvasHandle } from "./DiagramCanvas";
import { DiagramCanvas } from "./DiagramCanvas";

const STEP_MS = 2600;
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A lesson figure: an animated diagram (architecture / sequence / flowchart). It auto-plays its
 * steps the first time it scrolls into view — request "packets" travel along the active arrows,
 * failures turn red with ✕ — and its scenario tabs replay the same system for failures, edge
 * cases, alternatives and risks.
 */
export function FigureView({ figure, number }: { figure: Figure; number?: number }) {
  const tabs = useMemo(() => scenarioTabs(figure), [figure]);
  const [scenario, setScenario] = useState(0);
  const shown = useMemo(() => applyScenario(figure, scenario), [figure, scenario]);
  const steps = useMemo(() => stepsOf(shown), [shown]);
  const [step, setStep] = useState(-1); // -1: whole picture, nothing highlighted
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);
  const canvas = useRef<CanvasHandle>(null);
  // a scenario may change the picture: re-fit the canvas (kept mounted so the page doesn't jump)
  useEffect(() => {
    const t = window.setTimeout(() => canvas.current?.fit(), 0);
    return () => window.clearTimeout(t);
  }, [scenario, expanded]);
  // Esc closes the expanded view
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // Auto-play once, the first time at least half of the figure is visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !started.current && steps.length > 0) {
          started.current = true;
          setStep(0);
          setPlaying(true);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [steps.length]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (step >= steps.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, step, steps.length]);

  const pick = (i: number) => {
    setScenario(i);
    setStep(0);
    setPlaying(!reducedMotion());
    started.current = true;
  };

  const current = step >= 0 ? steps[step] : undefined;
  let body;
  if (shown.kind === "architecture") {
    body = (
      <DiagramCanvas
        handle={canvas}
        diagram={architectureDiagram(shown)}
        highlight={stepHighlight(current)}
        failed={stepFailed(current)}
        height={expanded ? "fill" : Math.max(300, Math.max(...shown.nodes.map((n) => n.y)) + 170)}
        presentation
      />
    );
  } else if (shown.kind === "sequence") {
    body = <SequenceSvg f={shown} active={step} />;
  } else {
    body = <FlowchartSvg f={shown} active={step} />;
  }
  const tab = tabs[scenario];

  const view = (
    <figure
      ref={ref}
      className={`fig fig-${shown.kind} ${step >= 0 ? "stepping" : ""} ${expanded ? "expanded" : ""}`}
    >
      <figcaption className="fig-head">
        {number !== undefined && <span className="fig-num">Figure {number}</span>}
        <span className="fig-title">{figure.title}</span>
        <button
          className="fig-expand"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Close (Esc)" : "Expand to full screen"}
        >
          {expanded ? "✕ close" : "⛶ expand"}
        </button>
      </figcaption>
      {tabs.length > 1 && (
        <div className="fig-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.name}
              role="tab"
              aria-selected={i === scenario}
              className={`fig-tab tone-${t.tone} ${i === scenario ? "on" : ""}`}
              onClick={() => pick(i)}
            >
              <span aria-hidden="true">{TONE_ICON[t.tone]}</span> {t.name}
            </button>
          ))}
        </div>
      )}
      {tab?.summary && <p className={`fig-summary tone-${tab.tone}`}>{tab.summary}</p>}
      <div className="fig-body">{body}</div>
      {steps.length > 0 && (
        <div className="fig-steps">
          <div className="fig-controls">
            <button
              onClick={() => {
                setPlaying(false);
                setStep(Math.max(-1, step - 1));
              }}
              disabled={step < 0}
              aria-label="previous step"
            >
              ◀
            </button>
            <button
              className="primary"
              onClick={() => {
                if (playing) return setPlaying(false);
                if (step < 0 || step >= steps.length - 1) setStep(0);
                setPlaying(true);
              }}
            >
              {playing ? "❚❚ pause" : step >= steps.length - 1 ? "↻ replay" : "▶ play"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setStep(Math.min(steps.length - 1, step + 1));
              }}
              disabled={step >= steps.length - 1}
              aria-label="next step"
            >
              ▶
            </button>
            <span className="fig-dots">
              {steps.map((_, i) => (
                <button
                  key={i}
                  className={`fig-dot ${i === step ? "on" : i < step ? "done" : ""}`}
                  onClick={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  aria-label={`step ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </span>
            {playing && (
              <span
                className="fig-progress"
                key={`${scenario}-${step}`}
                style={{ ["--ms" as string]: `${STEP_MS}ms` }}
              />
            )}
          </div>
          <p className={`fig-narration ${current?.fail?.length ? "bad" : ""}`} aria-live="polite">
            {current ? (
              <>
                <b>{circled(step + 1)}</b> {current.text}
              </>
            ) : (
              <span className="muted">
                {steps.length} steps — press <b>play</b> or click a number.
              </span>
            )}
          </p>
        </div>
      )}
      {shown.caption && <p className="fig-caption">{shown.caption}</p>}
    </figure>
  );
  // expanded: render in a portal so no transformed ancestor traps `position: fixed`
  if (!expanded) return view;
  return (
    <>
      <div className="fig fig-placeholder" style={{ minHeight: 120 }}>
        <p className="muted small">Figure open in full screen — press Esc to close.</p>
      </div>
      {createPortal(view, document.body)}
    </>
  );
}

function SequenceSvg({ f, active }: { f: SequenceFigure; active: number }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const { width, height } = sequenceSize(f);
  const top = SEQ.pad;
  const bottom = height - SEQ.pad;
  return (
    <svg
      className="fig-svg"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width }}
      role="img"
    >
      <title>{f.title}</title>
      <defs>
        {(["call", "reply", "error"] as const).map((k) => (
          <marker
            key={k}
            id={`${uid}-${k}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="10"
            markerUnits="userSpaceOnUse"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className={`seq-head ${k}`} />
          </marker>
        ))}
      </defs>
      {f.actors.map((a) => {
        const x = laneX(f, a.id);
        const st = kindStyle(a.kind ?? "service");
        return (
          <g key={a.id}>
            <line className="seq-life" x1={x} y1={top + SEQ.head} x2={x} y2={bottom} />
            <g transform={`translate(${x - SEQ.boxW / 2} ${top})`}>
              <rect
                className="seq-actor"
                width={SEQ.boxW}
                height={SEQ.head - 8}
                rx={10}
                style={{ stroke: st.color }}
              />
              <text className="seq-actor-label" x={SEQ.boxW / 2} y={(SEQ.head - 8) / 2 + 5}>
                {a.kind ? `${st.icon} ` : ""}
                {a.label}
              </text>
            </g>
          </g>
        );
      })}
      {f.messages.map((m, i) => {
        const y = top + SEQ.head + (i + 1) * SEQ.rowH;
        const x1 = laneX(f, m.from);
        const x2 = laneX(f, m.to);
        const style = m.style ?? "call";
        const state = active < 0 ? "" : i === active ? "on" : i < active ? "done" : "later";
        const self = style === "self" || m.from === m.to;
        const lost = style === "lost";
        const end = lost ? (x1 + x2) / 2 : x2 + (x2 > x1 ? -2 : 2);
        const mid = self ? x1 + 46 : (x1 + x2) / 2;
        const head = style === "error" || lost ? "error" : style === "reply" ? "reply" : "call";
        const d = self ? `M${x1},${y - 10} h36 v20 h-34` : `M${x1},${y} L${end},${y}`;
        return (
          <g key={i} className={`seq-msg ${style} ${state}`}>
            <path d={d} markerEnd={lost ? undefined : `url(#${uid}-${head})`} />
            {lost && (
              <text className="seq-lost" x={end} y={y + 5} textAnchor="middle">
                ✕
              </text>
            )}
            {state === "on" && (
              <circle className="seq-packet" r={6}>
                <animateMotion dur="0.9s" repeatCount="indefinite" path={d} />
              </circle>
            )}
            <text
              className="seq-label"
              x={self ? x1 + 44 : lost ? (x1 + end) / 2 : mid}
              y={self ? y + 4 : y - 7}
              textAnchor={self ? "start" : "middle"}
            >
              {circled(i + 1)} {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FlowchartSvg({ f, active }: { f: FlowchartFigure; active: number }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const { width, height } = flowSize(f);
  const byId = new Map(f.nodes.map((n) => [n.id, n]));
  const step = active >= 0 ? f.steps?.[active] : undefined;
  const litNodes = new Set(step?.nodes ?? []);
  const litEdges = new Set(step?.edges ?? []);
  const failed = new Set(step?.fail ?? []);
  const nums = edgeStepNumbers(f.steps);
  const dim = active >= 0;
  const edgeClass = (key: string, label?: string) =>
    `flow-edge ${failed.has(key) ? "failed" : litEdges.has(key) ? "on" : dim ? "dim" : ""} ${/^no\b/i.test(label ?? "") ? "no" : ""}`;
  return (
    <svg
      className="fig-svg"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width }}
      role="img"
    >
      <title>{f.title}</title>
      <defs>
        <marker
          id={`${uid}-a`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="10"
          markerUnits="userSpaceOnUse"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="flow-head" />
        </marker>
      </defs>
      {f.edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const key = `${e.from}>${e.to}`;
        const d = flowEdgePath(a, b);
        return (
          <g key={key} className={edgeClass(key, e.label)}>
            <path d={d} markerEnd={`url(#${uid}-a)`} />
            {litEdges.has(key) && !failed.has(key) && (
              <circle className="flow-packet" r={5}>
                <animateMotion dur="1s" repeatCount="indefinite" path={d} />
              </circle>
            )}
          </g>
        );
      })}
      {f.nodes.map((n) => {
        const c = flowCenter(n);
        const state = failed.has(n.id) ? "failed" : litNodes.has(n.id) ? "on" : dim ? "dim" : "";
        const hw = FLOW.w / 2;
        const hh = FLOW.h / 2;
        return (
          <g key={n.id} className={`flow-node ${n.type} ${n.tone ?? ""} ${state}`}>
            {n.type === "decision" ? (
              <path
                d={`M${c.x},${c.y - hh - 6} L${c.x + hw},${c.y} L${c.x},${c.y + hh + 6} L${c.x - hw},${c.y} Z`}
              />
            ) : (
              <rect
                x={c.x - hw}
                y={c.y - hh}
                width={FLOW.w}
                height={FLOW.h}
                rx={n.type === "step" ? 10 : hh}
              />
            )}
            <text x={c.x} y={c.y + 5} textAnchor="middle">
              {n.label}
            </text>
            {state === "failed" && (
              <text className="flow-fail" x={c.x + hw - 4} y={c.y - hh + 4} textAnchor="middle">
                ✕
              </text>
            )}
          </g>
        );
      })}
      {f.edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const key = `${e.from}>${e.to}`;
        const n = nums.get(key);
        const label = [n ? circled(n) : "", e.label ?? ""].filter(Boolean).join(" ");
        if (!label) return null;
        const p = flowCenter(a);
        const q = flowCenter(b);
        const lx = a.col === b.col ? p.x + 10 : (p.x + q.x) / 2;
        const ly = a.col === b.col ? (p.y + q.y) / 2 + 4 : p.y - 8;
        return (
          <g key={`l-${key}`} className={edgeClass(key)}>
            <text
              className="flow-edge-label"
              x={lx}
              y={ly}
              textAnchor={a.col === b.col ? "start" : "middle"}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
