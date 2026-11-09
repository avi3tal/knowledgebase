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
import { MutedP, Muted } from "../theme/primitives";
import type { CanvasHandle } from "./DiagramCanvas";
import { DiagramCanvas } from "./DiagramCanvas";
import * as S from "./FigureView.style";
import { StructureFigure } from "./StructureFigure";
import { UmlFigure } from "./UmlFigure";

const STEP_MS = 2600;
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A lesson figure: an animated diagram (architecture / sequence / flowchart / uml) or a
 * data-structure still (structure: one frame per step). It auto-plays its
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
  } else if (shown.kind === "uml") {
    body = <UmlFigure f={shown} active={step} />;
  } else if (shown.kind === "structure") {
    body = <StructureFigure f={shown} step={step} />;
  } else {
    body = <FlowchartSvg f={shown} active={step} />;
  }
  const tab = tabs[scenario];

  const view = (
    <S.Fig
      ref={ref}
      data-kind={shown.kind}
      data-expanded={expanded}
      $stepping={step >= 0}
      $expanded={expanded}
    >
      <S.Head>
        {number !== undefined && <S.Num>Figure {number}</S.Num>}
        <S.Title>{figure.title}</S.Title>
        <S.ExpandBtn
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Close (Esc)" : "Expand to full screen"}
        >
          {expanded ? "✕ close" : "⛶ expand"}
        </S.ExpandBtn>
      </S.Head>
      {tabs.length > 1 && (
        <S.Tabs role="tablist">
          {tabs.map((t, i) => (
            <S.Tab
              key={t.name}
              role="tab"
              aria-selected={i === scenario}
              $tone={t.tone}
              $on={i === scenario}
              onClick={() => pick(i)}
            >
              <span aria-hidden="true">{TONE_ICON[t.tone]}</span> {t.name}
            </S.Tab>
          ))}
        </S.Tabs>
      )}
      {tab?.summary && <S.Summary $tone={tab.tone}>{tab.summary}</S.Summary>}
      <S.Body $expanded={expanded}>{body}</S.Body>
      {steps.length > 0 && (
        <S.Steps>
          <S.Controls>
            <S.Btn
              onClick={() => {
                setPlaying(false);
                setStep(Math.max(-1, step - 1));
              }}
              disabled={step < 0}
              aria-label="previous step"
            >
              ◀
            </S.Btn>
            <S.Btn
              $primary
              onClick={() => {
                if (playing) return setPlaying(false);
                if (step < 0 || step >= steps.length - 1) setStep(0);
                setPlaying(true);
              }}
            >
              {playing ? "❚❚ pause" : step >= steps.length - 1 ? "↻ replay" : "▶ play"}
            </S.Btn>
            <S.Btn
              onClick={() => {
                setPlaying(false);
                setStep(Math.min(steps.length - 1, step + 1));
              }}
              disabled={step >= steps.length - 1}
              aria-label="next step"
            >
              ▶
            </S.Btn>
            <S.Dots>
              {steps.map((_, i) => (
                <S.Dot
                  key={i}
                  $state={i === step ? "on" : i < step ? "done" : undefined}
                  onClick={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  aria-label={`step ${i + 1}`}
                >
                  {i + 1}
                </S.Dot>
              ))}
            </S.Dots>
            {playing && <S.Progress key={`${scenario}-${step}`} $ms={STEP_MS} />}
          </S.Controls>
          <S.Narration $bad={!!current?.fail?.length} aria-live="polite">
            {current ? (
              <>
                <b>{circled(step + 1)}</b> {current.text}
              </>
            ) : (
              <Muted>
                {steps.length} steps — press <b>play</b> or click a number.
              </Muted>
            )}
          </S.Narration>
        </S.Steps>
      )}
      {shown.caption && <S.Caption>{shown.caption}</S.Caption>}
    </S.Fig>
  );
  // expanded: render in a portal so no transformed ancestor traps `position: fixed`
  if (!expanded) return view;
  return (
    <>
      <S.Placeholder>
        <MutedP $small>Figure open in full screen — press Esc to close.</MutedP>
      </S.Placeholder>
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
    <S.Svg viewBox={`0 0 ${width} ${height}`} $maxWidth={width} role="img">
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
            <S.SeqHead d="M0,0 L10,5 L0,10 z" $tone={k} />
          </marker>
        ))}
      </defs>
      {f.actors.map((a) => {
        const x = laneX(f, a.id);
        const st = kindStyle(a.kind ?? "service");
        return (
          <g key={a.id}>
            <S.SeqLife x1={x} y1={top + SEQ.head} x2={x} y2={bottom} />
            <g transform={`translate(${x - SEQ.boxW / 2} ${top})`}>
              <S.SeqActor $color={st.color} width={SEQ.boxW} height={SEQ.head - 8} rx={10} />
              <S.SeqActorLabel x={SEQ.boxW / 2} y={(SEQ.head - 8) / 2 + 5}>
                {a.kind ? `${st.icon} ` : ""}
                {a.label}
              </S.SeqActorLabel>
            </g>
          </g>
        );
      })}
      {f.messages.map((m, i) => {
        const y = top + SEQ.head + (i + 1) * SEQ.rowH;
        const x1 = laneX(f, m.from);
        const x2 = laneX(f, m.to);
        const style: S.SeqStyle = m.style ?? "call";
        const state: S.SeqState =
          active < 0 ? "" : i === active ? "on" : i < active ? "done" : "later";
        const self = style === "self" || m.from === m.to;
        const lost = style === "lost";
        const end = lost ? (x1 + x2) / 2 : x2 + (x2 > x1 ? -2 : 2);
        const mid = self ? x1 + 46 : (x1 + x2) / 2;
        const head = style === "error" || lost ? "error" : style === "reply" ? "reply" : "call";
        const d = self ? `M${x1},${y - 10} h36 v20 h-34` : `M${x1},${y} L${end},${y}`;
        return (
          <S.SeqMsg key={i} $kind={style} $state={state}>
            <path d={d} markerEnd={lost ? undefined : `url(#${uid}-${head})`} />
            {lost && (
              <S.FailMark x={end} y={y + 5} textAnchor="middle">
                ✕
              </S.FailMark>
            )}
            {state === "on" && (
              <S.Packet r={6}>
                <animateMotion dur="0.9s" repeatCount="indefinite" path={d} />
              </S.Packet>
            )}
            <S.SeqLabel
              $kind={style}
              $state={state}
              x={self ? x1 + 44 : lost ? (x1 + end) / 2 : mid}
              y={self ? y + 4 : y - 7}
              textAnchor={self ? "start" : "middle"}
            >
              {circled(i + 1)} {m.label}
            </S.SeqLabel>
          </S.SeqMsg>
        );
      })}
    </S.Svg>
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
  const edgeState = (key: string): S.FlowState =>
    failed.has(key) ? "failed" : litEdges.has(key) ? "on" : dim ? "dim" : "";
  return (
    <S.Svg viewBox={`0 0 ${width} ${height}`} $maxWidth={width} role="img">
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
          <S.FlowHead d="M0,0 L10,5 L0,10 z" />
        </marker>
      </defs>
      {f.edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const key = `${e.from}>${e.to}`;
        const d = flowEdgePath(a, b);
        return (
          <S.FlowEdge key={key} $state={edgeState(key)} $no={/^no\b/i.test(e.label ?? "")}>
            <path d={d} markerEnd={`url(#${uid}-a)`} />
            {litEdges.has(key) && !failed.has(key) && (
              <S.Packet r={5}>
                <animateMotion dur="1s" repeatCount="indefinite" path={d} />
              </S.Packet>
            )}
          </S.FlowEdge>
        );
      })}
      {f.nodes.map((n) => {
        const c = flowCenter(n);
        const state: S.FlowState = failed.has(n.id)
          ? "failed"
          : litNodes.has(n.id)
            ? "on"
            : dim
              ? "dim"
              : "";
        const hw = FLOW.w / 2;
        const hh = FLOW.h / 2;
        return (
          <S.FlowNode key={n.id} $type={n.type} $tone={n.tone} $state={state}>
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
              <S.FailMark x={c.x + hw - 4} y={c.y - hh + 4} textAnchor="middle">
                ✕
              </S.FailMark>
            )}
          </S.FlowNode>
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
          <S.FlowEdge key={`l-${key}`} $state={edgeState(key)}>
            <S.FlowEdgeLabel x={lx} y={ly} textAnchor={a.col === b.col ? "start" : "middle"}>
              {label}
            </S.FlowEdgeLabel>
          </S.FlowEdge>
        );
      })}
    </S.Svg>
  );
}
