import type { Cell, MazeState, MazeViewSpec, Trace, TraceStep } from "./trace";
import { viewId } from "./trace";

/** "r,c": map / set key of a cell. */
export const cellKey = (c: Cell): string => `${c[0]},${c[1]}`;

export const sameCell = (a: Cell | null | undefined, b: Cell | null | undefined): boolean =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

/** The trace's maze view (and its state id), if it has one. */
export function mazeView(trace: Trace): { spec: MazeViewSpec; id: string } | null {
  const spec = trace.view.find((v): v is MazeViewSpec => v.type === "maze");
  return spec ? { spec, id: viewId(spec) } : null;
}

const mazeAt = (steps: TraceStep[], i: number, id: string) =>
  steps[i]?.state[id] as MazeState | undefined;

export interface PredictPoint {
  /** the step that reveals the answer; the question is asked on the step before */
  step: number;
  cell: Cell;
}

/**
 * Moments to ask "which cell is expanded next?": every step where `current` moves to a new cell,
 * except forced moves (the frontier held a single cell). Mirrors kb/learn.py `predict_points`; both
 * are tested against tools/tests/testdata/trace_maze_fixture.json.
 */
export function predictPoints(trace: Trace, id: string): PredictPoint[] {
  const points: PredictPoint[] = [];
  let last: Cell | null = null;
  trace.steps.forEach((_, i) => {
    const cell = mazeAt(trace.steps, i, id)?.current ?? null;
    const before = i > 0 ? (mazeAt(trace.steps, i - 1, id)?.frontier ?? []) : [];
    if (cell && !sameCell(cell, last) && before.length >= 2) points.push({ step: i, cell });
    if (cell) last = cell;
  });
  return points;
}

/**
 * Discovery rank of every cell the search ever visits: 0 for the first, n-1 for the last (first
 * step it appears in `visited`, ties by row-major order). Drives the heat tint, so colours stay
 * the same while stepping back and forth.
 */
export function discoveryRank(trace: Trace, id: string): Map<string, number> {
  const rank = new Map<string, number>();
  trace.steps.forEach((_, i) => {
    const fresh = (mazeAt(trace.steps, i, id)?.visited ?? [])
      .filter((c) => !rank.has(cellKey(c)))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const c of fresh) rank.set(cellKey(c), rank.size);
  });
  return rank;
}

/** The `group` (e.g. island number) each visited cell had when it was first visited. */
export function discoveryGroups(trace: Trace, id: string): Map<string, number> {
  const groups = new Map<string, number>();
  trace.steps.forEach((_, i) => {
    const state = mazeAt(trace.steps, i, id);
    if (state?.group === null || state?.group === undefined) return;
    for (const c of state.visited) if (!groups.has(cellKey(c))) groups.set(cellKey(c), state.group);
  });
  return groups;
}

/**
 * The route as of `step`: the latest one kb drew at or before it. A search may keep going after it
 * first reaches the goal (0-1 BFS settles the rest of the grid), so the route stays once found.
 */
export function routeSoFar(trace: Trace, id: string, step: number): Cell[] | null {
  for (let i = Math.min(step, trace.steps.length - 1); i >= 0; i--) {
    const path = mazeAt(trace.steps, i, id)?.path;
    if (path) return path;
  }
  return null;
}

/** Heat 0..1 of a visited cell (0 = discovered first). */
export function heatOf(rank: Map<string, number>, c: Cell): number {
  const r = rank.get(cellKey(c));
  if (r === undefined || rank.size < 2) return 0;
  return r / (rank.size - 1);
}

/** Colours of a maze trace, fixed for the whole trace: discovery rank (heat) and regions. */
export function mazeColours(trace: Trace): {
  rank?: Map<string, number>;
  groups?: Map<string, number>;
} {
  const maze = mazeView(trace);
  if (!maze) return {};
  const groups = discoveryGroups(trace, maze.id);
  return { rank: discoveryRank(trace, maze.id), groups: groups.size ? groups : undefined };
}

/** The steps where the search expands a new cell (`current` changes): one race tick each. */
export function expansionSteps(trace: Trace, id: string): number[] {
  const out: number[] = [];
  let last: Cell | null = null;
  trace.steps.forEach((_, i) => {
    const cell = mazeAt(trace.steps, i, id)?.current ?? null;
    if (cell && !sameCell(cell, last)) out.push(i);
    if (cell) last = cell;
  });
  return out;
}

/** The step a runner shows at race tick `tick`; after its last expansion it rests on its last step. */
export function raceStep(expansions: number[], tick: number, lastStep: number): number {
  return tick < expansions.length ? (expansions[tick] ?? 0) : lastStep;
}

/** Queue position (1 = next to expand) of every frontier cell. */
export function frontierOrder(state: MazeState): Map<string, number> {
  const order = new Map<string, number>();
  state.frontier.forEach((c, i) => {
    if (!order.has(cellKey(c))) order.set(cellKey(c), i + 1);
  });
  return order;
}
