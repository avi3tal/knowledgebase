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
export interface LinkedListViewSpec {
  id?: string;
  type: "linkedlist";
  var: string;
  label?: string;
  pointers?: Record<string, string>;
}
export interface TreeViewSpec {
  id?: string;
  type: "tree";
  var: string;
  label?: string;
  pointers?: Record<string, string>;
  groups?: Record<string, string>;
}
export interface HeapViewSpec {
  id?: string;
  type: "heap";
  var: string;
  label?: string;
  pointers?: Record<string, string>;
}
export interface GridViewSpec {
  id?: string;
  type: "grid";
  var: string;
  label?: string;
  cells?: Record<string, [string, string]>;
  marked?: string;
  row_labels?: string;
  col_labels?: string;
}
export interface IntervalsViewSpec {
  id?: string;
  type: "intervals";
  label?: string;
  lanes: Record<string, string>;
  pointers?: Record<string, string>;
}
export interface CallStackViewSpec {
  id?: string;
  type: "callstack";
  label?: string;
}
export type ViewSpec =
  | ArrayViewSpec
  | MapViewSpec
  | VarsViewSpec
  | LinkedListViewSpec
  | TreeViewSpec
  | HeapViewSpec
  | GridViewSpec
  | IntervalsViewSpec
  | CallStackViewSpec;

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
export interface ListNodeState {
  id: number;
  val: Json;
  next: number | null;
}
/** Node ids are stable for the whole trace, so nodes keep their place while links change. */
export interface LinkedListState {
  nodes: ListNodeState[];
  pointers: Record<string, number | null>;
}
export interface TreeNodeState {
  id: number;
  val: Json;
  left: number | null;
  right: number | null;
}
export interface TreeState {
  root: number | null;
  nodes: TreeNodeState[];
  pointers: Record<string, number | null>;
  groups: Record<string, number[]>;
}
export interface GridState {
  rows: Json[][];
  cells: Record<string, [number, number] | null>;
  marked: [number, number][];
  row_labels: Json[] | null;
  col_labels: Json[] | null;
}
export interface IntervalsState {
  lanes: Record<string, [number, number][]>;
  pointers: Record<string, number | null>;
}
export interface CallStackState {
  frames: { fn: string; args: Record<string, Json> }[];
}
export type ViewState =
  | ArrayState
  | MapState
  | VarsState
  | LinkedListState
  | TreeState
  | GridState
  | IntervalsState
  | CallStackState;

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

export interface Placed {
  id: number;
  val: Json;
  x: number; // column slot (in-order index)
  depth: number;
  parent: number | null;
}

/** Tidy-enough binary tree layout: x = in-order position, y = depth. Deterministic. */
export function layoutTree(state: TreeState): Placed[] {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const out: Placed[] = [];
  let col = 0;
  const walk = (id: number | null, depth: number, parent: number | null, guard: Set<number>) => {
    if (id === null || guard.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    guard.add(id);
    walk(node.left, depth + 1, id, guard);
    out.push({ id, val: node.val, x: col++, depth, parent });
    walk(node.right, depth + 1, id, guard);
  };
  walk(state.root, 0, null, new Set());
  return out;
}

/** A binary heap stored in an array, viewed as a tree (children of i: 2i+1, 2i+2). */
export function heapAsTree(values: Json[]): TreeState {
  const nodes = values.map((val, i) => ({
    id: i,
    val,
    left: 2 * i + 1 < values.length ? 2 * i + 1 : null,
    right: 2 * i + 2 < values.length ? 2 * i + 2 : null,
  }));
  return { root: values.length ? 0 : null, nodes, pointers: {}, groups: {} };
}

/** [min, max] over every interval of every lane (for a shared axis). */
export function intervalBounds(state: IntervalsState): [number, number] {
  const all = Object.values(state.lanes).flat();
  if (all.length === 0) return [0, 1];
  const lo = Math.min(...all.map((iv) => iv[0]));
  const hi = Math.max(...all.map((iv) => iv[1]));
  return [lo, hi === lo ? lo + 1 : hi];
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

export type LinkKind = "forward" | "skip" | "back" | "none";

/** How to draw a node's next-link given the on-screen order of nodes. */
export function linkKind(state: LinkedListState, index: number): LinkKind {
  const node = state.nodes[index];
  if (!node || node.next === null) return "none";
  const target = state.nodes.findIndex((n) => n.id === node.next);
  if (target === index + 1) return "forward";
  return target > index ? "skip" : "back";
}

/** Row index per interval so overlapping intervals in one lane are stacked, not drawn on top. */
export function packRows(intervals: [number, number][]): number[] {
  const rowEnds: number[] = [];
  return intervals.map(([start, end]) => {
    let row = rowEnds.findIndex((rowEnd) => rowEnd < start);
    if (row === -1) row = rowEnds.push(end) - 1;
    else rowEnds[row] = end;
    return row;
  });
}
