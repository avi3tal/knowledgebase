import { describe, expect, it } from "vitest";
import mazeFixtureJson from "../../tools/tests/testdata/trace_maze_fixture.json";
import {
  cellKey,
  discoveryGroups,
  discoveryRank,
  expansionSteps,
  frontierOrder,
  heatOf,
  mazeColours,
  mazeView,
  predictPoints,
  raceStep,
  routeSoFar,
  sameCell,
} from "./maze";
import type { MazeState, Trace } from "./trace";
import { isTrace } from "./trace";

const fixture = mazeFixtureJson as unknown as Trace;
// Same literal as MAZE_FIXTURE_POINTS in tools/tests/test_learn.py (kb grades with predict_points).
const FIXTURE_POINTS = [
  { step: 14, cell: [2, 1] },
  { step: 19, cell: [1, 2] },
  { step: 20, cell: [2, 2] },
];

describe("maze trace contract", () => {
  it("parses the shared fixture", () => {
    expect(isTrace(fixture)).toBe(true);
    const maze = mazeView(fixture);
    expect(maze?.id).toBe("maze");
    const last = fixture.steps[fixture.steps.length - 1]?.state.maze as MazeState;
    expect(last.walls).toEqual(["..#", "#..", "..."]);
    expect(last.goal).toEqual([2, 2]);
    expect(last.path).toEqual([
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ]);
  });

  it("finds the same prediction points as kb", () => {
    expect(predictPoints(fixture, "maze")).toEqual(FIXTURE_POINTS);
  });
});

describe("race timeline", () => {
  it("ticks once per expansion, then rests on the last step", () => {
    const exps = expansionSteps(fixture, "maze");
    const cells = exps.map((i) => (fixture.steps[i]?.state.maze as MazeState).current);
    expect(cells[0]).toEqual([0, 0]);
    expect(cells.at(-1)).toEqual([2, 2]);
    expect(new Set(cells.map(String)).size).toBe(cells.length); // one tick per new cell
    const last = fixture.steps.length - 1;
    expect(raceStep(exps, 0, last)).toBe(exps[0]);
    expect(raceStep(exps, exps.length + 5, last)).toBe(last);
  });

  it("colours are computed once per trace", () => {
    const { rank, groups } = mazeColours(fixture);
    expect(rank?.get("0,0")).toBe(0);
    expect(groups).toBeUndefined(); // the fixture has no group var
  });
});

describe("maze helpers", () => {
  it("ranks cells by discovery, stable across the trace", () => {
    const rank = discoveryRank(fixture, "maze");
    expect(rank.get("0,0")).toBe(0);
    expect(rank.size).toBe(7); // every open cell but none behind walls
    expect(heatOf(rank, [0, 0])).toBe(0);
    expect(heatOf(rank, [2, 2])).toBeGreaterThan(heatOf(rank, [0, 1]));
    expect(heatOf(rank, [0, 2])).toBe(0); // a wall is never visited
  });

  it("remembers the group (island) of each cell at its first visit", () => {
    const step = (visited: number[][], group: number | null) => ({
      line: 1,
      note: null,
      state: { m: { visited, group } },
    });
    const trace = {
      steps: [
        step([[0, 0]], 1),
        step(
          [
            [0, 0],
            [0, 1],
          ],
          1,
        ),
        step(
          [
            [0, 0],
            [0, 1],
            [2, 2],
          ],
          2,
        ),
      ],
    } as unknown as Trace;
    expect([...discoveryGroups(trace, "m")]).toEqual([
      ["0,0", 1],
      ["0,1", 1],
      ["2,2", 2],
    ]);
  });

  it("keeps the route once the goal was reached", () => {
    const step = (path: number[][] | null) => ({ line: 1, note: null, state: { m: { path } } });
    const trace = {
      steps: [
        step(null),
        step([
          [0, 0],
          [0, 1],
        ]),
        step(null),
      ],
    } as unknown as Trace;
    expect(routeSoFar(trace, "m", 0)).toBeNull();
    expect(routeSoFar(trace, "m", 2)).toEqual([
      [0, 0],
      [0, 1],
    ]);
  });

  it("numbers the frontier in queue order, first occurrence wins", () => {
    const state = {
      frontier: [
        [1, 1],
        [2, 0],
        [1, 1],
      ],
    } as unknown as MazeState;
    expect([...frontierOrder(state)]).toEqual([
      ["1,1", 1],
      ["2,0", 2],
    ]);
  });

  it.each([
    [[1, 2], [1, 2], true],
    [[1, 2], [2, 1], false],
    [[1, 2], null, false],
  ] as const)("sameCell(%j, %j) = %s", (a, b, expected) => {
    expect(sameCell(a as [number, number], b as [number, number] | null)).toBe(expected);
    expect(cellKey([3, 4])).toBe("3,4");
  });
});
