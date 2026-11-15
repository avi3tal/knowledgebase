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
/**
 * A grid search drawn as a place (walls, start, goal, the explorer, the frontier, the route).
 * `start` / `goal` may be negative (counted from the end); kb resolves them in the state.
 */
export interface MazeViewSpec {
  id?: string;
  type: "maze";
  var: string;
  label?: string;
  /** "terrain": walls are water and floor is land (islands); default "maze" */
  theme?: "maze" | "terrain";
  wall?: string | number;
  /** a breakable obstacle (0-1 BFS): passable at a cost, drawn as rocks */
  rubble?: string | number;
  /** var numbering the current region (e.g. the island count) */
  group?: string;
  /** var mapping cell -> previous cell: the route drawn is the one the algorithm found */
  parent?: string;
  current?: [string, string];
  visited?: string;
  frontier?: string;
  start?: [number, number];
  goal?: [number, number];
}
/** A weighted graph drawn as a city map; `layout` places intersections, `places` names them. */
export interface RoadMapViewSpec {
  id?: string;
  type: "roadmap";
  var: string;
  label?: string;
  layout: Record<string, [number, number]>;
  places?: Record<string, string>;
  current?: string;
  dist?: string;
  frontier?: string;
  prev?: string;
  start?: string;
  goal?: string;
  relax?: [string, string];
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
  | CallStackViewSpec
  | MazeViewSpec
  | RoadMapViewSpec;
/**
 * A drawn graph (nodes at x/y, optional weights and arrows). Produced by kb/trace.py from a var
 * holding `{nodes, edges, highlight?, labels?}`; used by lesson `structure` figures. Kept out of
 * `ViewSpec` (whose consumers dispatch exhaustively) — figures use `FigureViewSpec`.
 */
export interface GraphViewSpec {
  id?: string;
  type: "graph";
  var: string;
  label?: string;
}
/** Every view a lesson figure can draw: the trace views plus `graph`. */
export type FigureViewSpec = ViewSpec | GraphViewSpec;

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
export interface GraphState {
  nodes: { id: string; x: number; y: number }[];
  edges: { from: string; to: string; w: Json; directed: boolean }[];
  /** edges as "from>to" (either direction matches an undirected edge) */
  highlight: { nodes: string[]; edges: string[] };
  /** text under a node, e.g. "d=3" */
  labels: Record<string, string>;
}
export type Cell = [number, number];
/**
 * `walls` rows: "#" wall / water, "o" rubble (passable at a cost), "." floor / land. `path` is set
 * once `current` reaches `goal`; `group` is the spec's group var (e.g. the island number).
 */
export interface MazeState {
  walls: string[];
  start: Cell | null;
  goal: Cell | null;
  current: Cell | null;
  visited: Cell[];
  /** queue / stack order: the next cell a BFS expands is frontier[0] */
  frontier: Cell[];
  path: Cell[] | null;
  group: number | null;
}
/** Node ids are strings; `route` (start -> goal) is set once `current` is the goal. */
export interface RoadMapState {
  nodes: { id: string; name: string; x: number; y: number }[];
  roads: { a: string; b: string; w: Json }[];
  start: string | null;
  goal: string | null;
  current: string | null;
  dist: Record<string, Json>;
  /** heap / queue order */
  frontier: string[];
  /** the road being relaxed this step */
  relax: [string, string] | null;
  route: string[] | null;
}
export type ViewState =
  | ArrayState
  | MapState
  | VarsState
  | LinkedListState
  | TreeState
  | GridState
  | IntervalsState
  | CallStackState
  | GraphState
  | MazeState
  | RoadMapState;

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

export function viewId(spec: FigureViewSpec): string {
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

/** Is a graph edge highlighted? ("a>b"; an undirected edge also matches "b>a".) */
export function graphEdgeOn(
  state: GraphState,
  e: { from: string; to: string; directed: boolean },
): boolean {
  const lit = state.highlight.edges;
  return lit.includes(`${e.from}>${e.to}`) || (!e.directed && lit.includes(`${e.to}>${e.from}`));
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
