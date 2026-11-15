import { useEffect, useMemo, useReducer, useState } from "react";
import type { PredictResult } from "./api";
import { api } from "./api";
import type { PredictPoint } from "./maze";
import { mazeView, predictPoints, sameCell } from "./maze";
import type { Cell, Trace } from "./trace";

/** Where a lesson trace lives, so kb can grade and record a Predict round. */
export interface TraceSource {
  subject: string;
  topic: string;
  id: string;
}

/** How long the answer stays on screen before the next question. */
export const REVEAL_MS = 1100;

export interface PredictState {
  active: boolean;
  /** index of the open question */
  index: number;
  guesses: Cell[];
  /** the last click, shown until the next question (clicks are ignored meanwhile) */
  flash: { cell: Cell; ok: boolean } | null;
  /** the step the player must show (null = the player is free) */
  view: number | null;
  /** the round just finished: grade it */
  done: boolean;
}

export type PredictAction =
  { type: "start" } | { type: "pick"; cell: Cell } | { type: "next" } | { type: "stop" };

export const IDLE: PredictState = {
  active: false,
  index: 0,
  guesses: [],
  flash: null,
  view: null,
  done: false,
};

const question = (points: PredictPoint[], i: number) => Math.max(0, (points[i]?.step ?? 1) - 1);

/**
 * One Predict transition (pure). The player stops on the step before each prediction point; a pick
 * reveals that point's step; `next` (after a pause) moves to the next question or ends the round on
 * the last step, where the route is drawn.
 */
export function predictStep(
  s: PredictState,
  a: PredictAction,
  points: PredictPoint[],
  lastStep: number,
): PredictState {
  const point = points[s.index];
  switch (a.type) {
    case "start":
      return points.length ? { ...IDLE, active: true, view: question(points, 0) } : s;
    case "pick":
      if (!s.active || s.flash || !point) return s;
      return {
        ...s,
        guesses: [...s.guesses, a.cell],
        flash: { cell: a.cell, ok: sameCell(a.cell, point.cell) },
        view: point.step,
      };
    case "next":
      if (!s.active || !s.flash) return s;
      if (s.index + 1 < points.length)
        return { ...s, index: s.index + 1, flash: null, view: question(points, s.index + 1) };
      return { ...s, active: false, flash: null, view: lastStep, done: true };
    case "stop":
      return { ...IDLE, guesses: s.guesses };
  }
}

export const scoreOf = (s: PredictState, points: PredictPoint[]) =>
  s.guesses.filter((g, i) => sameCell(g, points[i]?.cell)).length;

export interface Predict {
  points: PredictPoint[];
  state: PredictState;
  correct: number;
  /** kb's grade of the finished round (null while playing or without a source) */
  result: PredictResult | null;
  error: string | null;
  dispatch: (a: PredictAction) => void;
}

/** Predict mode for a trace with a maze view: drives `setStep`, records the round through kb. */
export function usePredict(
  trace: Trace,
  setStep: (n: number) => void,
  source?: TraceSource,
): Predict {
  const points = useMemo(() => {
    const maze = mazeView(trace);
    return maze ? predictPoints(trace, maze.id) : [];
  }, [trace]);
  const last = trace.steps.length - 1;
  const [state, dispatch] = useReducer(
    (s: PredictState, a: PredictAction) => predictStep(s, a, points, last),
    IDLE,
  );
  useEffect(() => {
    if (state.view !== null) setStep(state.view);
  }, [state.view, setStep]);
  useEffect(() => {
    if (!state.flash) return;
    const t = window.setTimeout(() => dispatch({ type: "next" }), REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [state.flash]);
  const { result, error } = useGrade(state, source);
  return { points, state, correct: scoreOf(state, points), result, error, dispatch };
}

/** kb grades and records a finished round (only with a lesson source). */
function useGrade(state: PredictState, source?: TraceSource) {
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (state.active) {
      setResult(null);
      setError(null);
    }
  }, [state.active]);
  const { subject, topic, id } = source ?? {};
  useEffect(() => {
    if (!state.done || !subject || !topic || !id) return;
    api
      .predict(subject, topic, id, state.guesses)
      .then(setResult, (e: Error) => setError(e.message));
  }, [state.done, state.guesses, subject, topic, id]);
  return { result, error };
}
