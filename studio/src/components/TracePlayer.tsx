import { useEffect, useState } from "react";
import type {
  ArrayState,
  CallStackState,
  GridState,
  IntervalsState,
  LinkedListState,
  MapState,
  Trace,
  TreeState,
  VarsState,
} from "../trace";
import { clampStep, viewId } from "../trace";
import { useHighlighted } from "../highlight";
import { Tokens } from "./CodeBlock";
import { CallStackView, GridView, HeapView, IntervalsView, TreeView } from "./StructureViews";
import { ArrayView, LinkedListView, MapView, VarsView } from "./TraceViews";

const SPEEDS = [1500, 900, 450];

export function TracePlayer({ trace }: { trace: Trace }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = trace.steps.length - 1;
  const cur = trace.steps[step];
  const tokens = useHighlighted(trace.code.join("\n"), "python");
  const prev = step > 0 ? trace.steps[step - 1] : undefined;

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => clampStep(s + 1, trace)), SPEEDS[speed]);
    return () => clearTimeout(t);
  }, [playing, step, last, speed, trace]);

  if (!cur) return null;
  const go = (n: number) => {
    setPlaying(false);
    setStep(clampStep(n, trace));
  };

  return (
    <section
      className="trace"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(step + 1);
        if (e.key === "ArrowLeft") go(step - 1);
        if (e.key === " ") {
          e.preventDefault();
          setPlaying((p) => !p);
        }
      }}
    >
      <h3>▶ {trace.title}</h3>
      <div className="trace-input">
        input:{" "}
        {Object.entries(trace.input)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join(", ")}
        {"  ·  "}result: <b>{JSON.stringify(trace.result)}</b>
      </div>
      <div className="trace-body">
        <pre className="code">
          {trace.code.map((line, i) => (
            <div key={i} className={`code-line ${cur.line === i + 1 ? "active" : ""}`}>
              <span className="ln">{i + 1}</span>
              <Tokens line={tokens?.[i]} text={line} />
            </div>
          ))}
        </pre>
        <div className="viz">
          {trace.view.map((spec) => {
            const id = viewId(spec);
            const state = cur.state[id];
            const before = prev?.state[id];
            if (!state) return null;
            if (spec.type === "array")
              return <ArrayView key={id} spec={spec} state={state as ArrayState} />;
            if (spec.type === "tree")
              return <TreeView key={id} spec={spec} state={state as TreeState} />;
            if (spec.type === "heap")
              return <HeapView key={id} spec={spec} state={state as ArrayState} />;
            if (spec.type === "grid")
              return <GridView key={id} spec={spec} state={state as GridState} />;
            if (spec.type === "intervals")
              return <IntervalsView key={id} spec={spec} state={state as IntervalsState} />;
            if (spec.type === "callstack")
              return <CallStackView key={id} spec={spec} state={state as CallStackState} />;
            if (spec.type === "linkedlist")
              return <LinkedListView key={id} spec={spec} state={state as LinkedListState} />;
            if (spec.type === "map")
              return (
                <MapView
                  key={id}
                  spec={spec}
                  state={state as MapState}
                  prev={before as MapState | undefined}
                />
              );
            return (
              <VarsView
                key={id}
                spec={spec}
                state={state as VarsState}
                prev={before as VarsState | undefined}
              />
            );
          })}
          <div className={`note ${cur.note ? "" : "muted"}`}>{cur.note ?? "…"}</div>
        </div>
      </div>
      <div className="controls">
        <button onClick={() => go(0)} title="first">
          ⏮
        </button>
        <button onClick={() => go(step - 1)} title="back (←)">
          ◀
        </button>
        <button
          className="primary"
          onClick={() => setPlaying((p) => !p)}
          title="play / pause (space)"
        >
          {playing ? "❚❚ pause" : "▶ play"}
        </button>
        <button onClick={() => go(step + 1)} title="next (→)">
          ▶
        </button>
        <button onClick={() => go(last)} title="last">
          ⏭
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={step}
          onChange={(e) => go(Number(e.target.value))}
          aria-label="step"
        />
        <span className="muted">
          step {step + 1}/{last + 1}
        </span>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed">
          <option value={0}>slow</option>
          <option value={1}>normal</option>
          <option value={2}>fast</option>
        </select>
      </div>
    </section>
  );
}
