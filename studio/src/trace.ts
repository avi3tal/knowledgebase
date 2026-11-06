// Trace JSON contract — mirrors tools/kb/trace.py (TRACE_VERSION 1).

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface ArrayViewSpec {
  id?: string;
  type: "array";
  var: string;
  label?: string;
  pointers?: Record<string, string>;
  window?: [string, string];
}
export interface MapViewSpec {
  id?: string;
  type: "map";
  var: string;
  label?: string;
}
export interface VarsViewSpec {
  id?: string;
  type: "vars";
  vars: string[];
  label?: string;
}
export type ViewSpec = ArrayViewSpec | MapViewSpec | VarsViewSpec;

export interface ArrayState {
  values: Json[];
  pointers: Record<string, number | null>;
  window: [number, number] | null;
}
export interface MapState {
  entries: [Json, Json][];
}
export interface VarsState {
  values: Record<string, Json>;
}
export type ViewState = ArrayState | MapState | VarsState;

export interface TraceStep {
  line: number;
  note: string | null;
  state: Record<string, ViewState>;
}

export interface Trace {
  version: 1;
  title: string;
  code: string[];
  view: ViewSpec[];
  input: Record<string, Json>;
  steps: TraceStep[];
  result: Json;
}

export const TRACE_VERSION = 1;

export function viewId(spec: ViewSpec): string {
  return spec.id ?? ("var" in spec ? spec.var : spec.type);
}

export function clampStep(index: number, trace: Trace): number {
  return Math.max(0, Math.min(index, trace.steps.length - 1));
}

const same = (a: Json | undefined, b: Json | undefined): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** Variable names whose value differs from the previous step (for highlighting). */
export function changedVars(prev: VarsState | undefined, cur: VarsState): Set<string> {
  return new Set(
    Object.keys(cur.values).filter((k) => !prev || !same(prev.values[k], cur.values[k])),
  );
}

/** Map keys added or whose value changed since the previous step. */
export function changedKeys(prev: MapState | undefined, cur: MapState): Set<string> {
  const before = new Map((prev?.entries ?? []).map(([k, v]) => [JSON.stringify(k), v]));
  return new Set(
    cur.entries
      .filter(([k, v]) => !before.has(JSON.stringify(k)) || !same(before.get(JSON.stringify(k)), v))
      .map(([k]) => JSON.stringify(k)),
  );
}

/** Array indices inside the window (inclusive bounds). */
export function inWindow(state: ArrayState, index: number): boolean {
  return state.window !== null && index >= state.window[0] && index <= state.window[1];
}

export function isTrace(value: unknown): value is Trace {
  const t = value as Partial<Trace> | null;
  return !!t && t.version === TRACE_VERSION && Array.isArray(t.code) && Array.isArray(t.steps);
}
