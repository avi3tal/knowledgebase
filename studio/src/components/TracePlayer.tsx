import { useCallback, useEffect, useMemo, useState } from "react";
import type { Trace, TraceStep } from "../trace";
import { clampStep, viewId } from "../trace";
import { useHighlighted } from "../highlight";
import { mazeColours, mazeView, routeSoFar } from "../maze";
import { roadMapView, settledSoFar } from "../roadmap";
import type { Predict, TraceSource } from "../predict";
import { usePredict } from "../predict";
import { Muted } from "../theme/primitives";
import { Tokens } from "./CodeBlock";
import { Icon } from "./Icon";
import { ViewFor } from "./StructureFigure";
import * as S from "./TracePlayer.style";

const SPEEDS = [1500, 900, 450];

/** Step through a kb trace; traces with a maze view also offer Predict mode. */
export function TracePlayer({ trace, source }: { trace: Trace; source?: TraceSource }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = trace.steps.length - 1;
  const show = useCallback((n: number) => setStep(clampStep(n, trace)), [trace]);
  const predict = usePredict(trace, show, source);
  const busy = predict.state.active;
  useAutoplay(playing && !busy, step, last, SPEEDS[speed] ?? 900, setPlaying, show);
  const cur = trace.steps[step];
  if (!cur) return null;
  const go = (n: number) => {
    setPlaying(false);
    show(n);
  };
  const keys = (e: React.KeyboardEvent) => {
    if (busy) return; // the answer is one keypress away otherwise
    if (e.key === "ArrowRight") go(step + 1);
    if (e.key === "ArrowLeft") go(step - 1);
    if (e.key === " ") {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  };
  return (
    <S.Trace tabIndex={0} onKeyDown={keys}>
      <S.Title>▶ {trace.title}</S.Title>
      <InputLine trace={trace} />
      <Stage trace={trace} step={step} cur={cur} />
      <S.Body>
        <CodePane trace={trace} line={cur.line} />
        <VizPane trace={trace} step={step} cur={cur} predict={predict} />
      </S.Body>
      {busy || predict.state.done ? (
        <PredictBar predict={predict} />
      ) : (
        <Controls
          {...{ step, last, playing, speed, go, setSpeed }}
          onPlay={() => setPlaying((p) => !p)}
          onPredict={predict.points.length ? () => predict.dispatch({ type: "start" }) : undefined}
        />
      )}
    </S.Trace>
  );
}

function useAutoplay(
  playing: boolean,
  step: number,
  last: number,
  ms: number,
  setPlaying: (p: boolean) => void,
  show: (n: number) => void,
) {
  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => show(step + 1), ms);
    return () => clearTimeout(t);
  }, [playing, step, last, ms, setPlaying, show]);
}

function InputLine({ trace }: { trace: Trace }) {
  return (
    <S.Input>
      input:{" "}
      {Object.entries(trace.input)
        .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
        .join(", ")}
      {"  ·  "}result: <b>{JSON.stringify(trace.result)}</b>
    </S.Input>
  );
}

function CodePane({ trace, line }: { trace: Trace; line: number }) {
  const tokens = useHighlighted(trace.code.join("\n"), "python");
  return (
    <S.Code>
      {trace.code.map((text, i) => (
        <S.CodeLine key={i} $active={line === i + 1}>
          <S.LineNo>{i + 1}</S.LineNo>
          <Tokens line={tokens?.[i]} text={text} />
        </S.CodeLine>
      ))}
    </S.Code>
  );
}

/** The views of the current step. In Predict mode the maze is clickable and the queue is hidden. */
function VizPane({
  trace,
  step,
  cur,
  predict,
}: {
  trace: Trace;
  step: number;
  cur: TraceStep;
  predict: Predict;
}) {
  const maze = mazeView(trace);
  const colours = useMazeColours(trace);
  const asking = predict.state.active;
  const prev = step > 0 ? trace.steps[step - 1] : undefined;
  return (
    <S.Viz>
      {trace.view.map((spec) => {
        const id = viewId(spec);
        const state = cur.state[id];
        if (!state || WIDE_VIEWS.has(spec.type)) return null;
        if (
          asking &&
          maze &&
          "var" in spec &&
          spec.var === maze.spec.frontier &&
          spec.type !== "maze"
        )
          return <S.Hidden key={id}>{spec.label ?? spec.var}: hidden while you predict</S.Hidden>;
        const extras = {
          ...colours,
          hideOrder: asking,
          onPick: asking
            ? (c: [number, number]) => predict.dispatch({ type: "pick", cell: c })
            : undefined,
          flash: predict.state.flash,
          route: maze && id === maze.id ? routeSoFar(trace, id, step) : undefined,
        };
        return <ViewFor key={id} spec={spec} state={state} prev={prev?.state[id]} maze={extras} />;
      })}
      <S.Note $empty={!cur.note}>{asking ? "…" : (cur.note ?? "…")}</S.Note>
    </S.Viz>
  );
}

/** Colours of a maze trace, fixed for the whole trace: discovery rank (heat) and regions. */
/** Views drawn as a full-width scene above the code (a town map needs the room). */
const WIDE_VIEWS = new Set(["roadmap"]);

function Stage({ trace, step, cur }: { trace: Trace; step: number; cur: TraceStep }) {
  const wide = trace.view.filter((v) => WIDE_VIEWS.has(v.type));
  if (!wide.length) return null;
  const road = roadMapView(trace);
  const settled = road ? settledSoFar(trace, road.id, step) : undefined;
  return (
    <S.Stage>
      {wide.map((spec) => {
        const state = cur.state[viewId(spec)];
        return state ? (
          <ViewFor key={viewId(spec)} spec={spec} state={state} road={{ settled }} />
        ) : null;
      })}
    </S.Stage>
  );
}

function useMazeColours(trace: Trace) {
  return useMemo(() => mazeColours(trace), [trace]);
}

function Controls({
  step,
  last,
  playing,
  speed,
  go,
  setSpeed,
  onPlay,
  onPredict,
}: {
  step: number;
  last: number;
  playing: boolean;
  speed: number;
  go: (n: number) => void;
  setSpeed: (n: number) => void;
  onPlay: () => void;
  onPredict?: () => void;
}) {
  return (
    <S.Controls>
      <S.Btn onClick={() => go(0)} title="first">
        ⏮
      </S.Btn>
      <S.Btn onClick={() => go(step - 1)} title="back (←)">
        ◀
      </S.Btn>
      <S.Btn $primary onClick={onPlay} title="play / pause (space)">
        {playing ? "❚❚ pause" : "▶ play"}
      </S.Btn>
      <S.Btn onClick={() => go(step + 1)} title="next (→)">
        ▶
      </S.Btn>
      <S.Btn onClick={() => go(last)} title="last">
        ⏭
      </S.Btn>
      <S.Range
        type="range"
        min={0}
        max={last}
        value={step}
        onChange={(e) => go(Number(e.target.value))}
        aria-label="step"
      />
      <Muted>
        step {step + 1}/{last + 1}
      </Muted>
      <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed">
        <option value={0}>slow</option>
        <option value={1}>normal</option>
        <option value={2}>fast</option>
      </select>
      {onPredict && (
        <S.Btn onClick={onPredict} title="you pick the next cell; kb scores the round">
          <Icon name="target" size={13} /> Predict
        </S.Btn>
      )}
    </S.Controls>
  );
}

function PredictBar({ predict }: { predict: Predict }) {
  const { state, points, correct, result, error } = predict;
  const total = points.length;
  if (!state.active) {
    const final = result ? `${result.correct}/${result.total}` : `${correct}/${total}`;
    return (
      <S.PredictBar $tone={correct * 2 >= total ? "ok" : "bad"}>
        <S.Question>
          Round over: {final} predicted right{result ? " (recorded)" : ""}. The route is drawn on
          the maze.
        </S.Question>
        {error && <Muted>not recorded: {error}</Muted>}
        <S.Btn $primary onClick={() => predict.dispatch({ type: "start" })}>
          play again
        </S.Btn>
        <S.Btn onClick={() => predict.dispatch({ type: "stop" })}>done</S.Btn>
      </S.PredictBar>
    );
  }
  const tone = state.flash ? (state.flash.ok ? "ok" : "bad") : undefined;
  return (
    <S.PredictBar $tone={tone}>
      <S.Question>
        {state.flash
          ? state.flash.ok
            ? "Right: that's the cell at the front of the queue."
            : "Not this one: watch where the explorer goes."
          : "Which cell does the search expand next? Click it on the maze."}
      </S.Question>
      <S.Score>
        question {state.index + 1}/{total} · score {correct}
      </S.Score>
      <S.Btn onClick={() => predict.dispatch({ type: "stop" })}>stop</S.Btn>
    </S.PredictBar>
  );
}
