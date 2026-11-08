import { useEffect, useId, useMemo, useState } from "react";
import type { Figure, FlowchartFigure, SequenceFigure } from "../figures";
import {
  FLOW,
  SEQ,
  architectureDiagram,
  circled,
  edgeStepNumbers,
  flowCenter,
  flowEdgePath,
  flowSize,
  laneX,
  sequenceSize,
  stepHighlight,
  stepsOf,
} from "../figures";
import { kindStyle } from "../design";
import { DiagramCanvas } from "./DiagramCanvas";

/**
 * A lesson figure: a real diagram (architecture / sequence / flowchart) with a caption and, when it
 * has steps, a step-through that highlights one numbered step at a time with its narration.
 */
export function FigureView({ figure, number }: { figure: Figure; number?: number }) {
  const steps = useMemo(() => stepsOf(figure), [figure]);
  const [step, setStep] = useState(-1); // -1: whole picture, nothing highlighted
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (step >= steps.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [playing, step, steps.length]);

  const current = step >= 0 ? steps[step] : undefined;
  let body;
  if (figure.kind === "architecture") {
    body = (
      <DiagramCanvas
        diagram={architectureDiagram(figure)}
        highlight={stepHighlight(current)}
        presentation
        height={Math.max(260, Math.max(...figure.nodes.map((n) => n.y)) + 150)}
      />
    );
  } else if (figure.kind === "sequence") {
    body = <SequenceSvg f={figure} active={step} />;
  } else {
    body = <FlowchartSvg f={figure} active={step} />;
  }

  return (
    <figure className={`fig fig-${figure.kind} ${step >= 0 ? "stepping" : ""}`}>
      <figcaption className="fig-head">
        {number !== undefined && <span className="fig-num">Figure {number}</span>}
        <span className="fig-title">{figure.title}</span>
      </figcaption>
      <div className="fig-body">{body}</div>
      {steps.length > 0 && (
        <div className="fig-steps">
          <div className="fig-controls">
            <button
              onClick={() => setStep(Math.max(-1, step - 1))}
              disabled={step < 0}
              aria-label="previous step"
            >
              ◀
            </button>
            <button
              className="primary"
              onClick={() => {
                if (step >= steps.length - 1) setStep(0);
                else if (step < 0) setStep(0);
                setPlaying(!playing);
              }}
            >
              {playing ? "❚❚ pause" : step < 0 ? "▶ walk through" : "▶ play"}
            </button>
            <button
              onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
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
            {step >= 0 && (
              <button
                className="ghost"
                onClick={() => {
                  setPlaying(false);
                  setStep(-1);
                }}
              >
                show all
              </button>
            )}
          </div>
          <p className="fig-narration" aria-live="polite">
            {current ? (
              <>
                <b>{circled(step + 1)}</b> {current.text}
              </>
            ) : (
              <span className="muted">
                {steps.length} steps — press <b>walk through</b> or click a number.
              </span>
            )}
          </p>
        </div>
      )}
      {figure.caption && <p className="fig-caption">{figure.caption}</p>}
    </figure>
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
        const mid = self ? x1 + 46 : (x1 + x2) / 2;
        const marker = `url(#${uid}-${style === "error" ? "error" : style === "reply" ? "reply" : "call"})`;
        return (
          <g key={i} className={`seq-msg ${style} ${state}`}>
            {self ? (
              <path d={`M${x1},${y - 10} h36 v20 h-34`} markerEnd={marker} />
            ) : (
              <line x1={x1} y1={y} x2={x2 + (x2 > x1 ? -2 : 2)} y2={y} markerEnd={marker} />
            )}
            <text
              className="seq-label"
              x={self ? x1 + 44 : mid}
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
  const nums = edgeStepNumbers(f.steps);
  const dim = active >= 0;
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
        const p = flowCenter(a);
        const q = flowCenter(b);
        const n = nums.get(key);
        const label = [n ? circled(n) : "", e.label ?? ""].filter(Boolean).join(" ");
        const lx = a.col === b.col ? p.x + 10 : (p.x + q.x) / 2;
        const ly = a.col === b.col ? (p.y + q.y) / 2 + 4 : p.y - 8;
        const cls = `flow-edge ${litEdges.has(key) ? "on" : dim ? "dim" : ""} ${/^no\b/i.test(e.label ?? "") ? "no" : ""}`;
        return (
          <g key={key} className={cls}>
            <path d={flowEdgePath(a, b)} markerEnd={`url(#${uid}-a)`} />
            {label && (
              <text
                className="flow-edge-label"
                x={lx}
                y={ly}
                textAnchor={a.col === b.col ? "start" : "middle"}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
      {f.nodes.map((n) => {
        const c = flowCenter(n);
        const cls = `flow-node ${n.type} ${n.tone ?? ""} ${litNodes.has(n.id) ? "on" : dim ? "dim" : ""}`;
        const hw = FLOW.w / 2;
        const hh = FLOW.h / 2;
        return (
          <g key={n.id} className={cls}>
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
          </g>
        );
      })}
    </svg>
  );
}
