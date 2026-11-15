import { describe, expect, it } from "vitest";
import type { PredictPoint } from "./maze";
import type { PredictAction, PredictState } from "./predict";
import { IDLE, predictStep, scoreOf } from "./predict";

const POINTS: PredictPoint[] = [
  { step: 5, cell: [1, 0] },
  { step: 9, cell: [0, 1] },
];
const LAST = 20;
const run = (actions: PredictAction[], from: PredictState = IDLE) =>
  actions.reduce((s, a) => predictStep(s, a, POINTS, LAST), from);

describe("predictStep", () => {
  it("asks each question on the step before its point", () => {
    const s = run([{ type: "start" }]);
    expect(s).toMatchObject({ active: true, index: 0, view: 4, flash: null });
  });

  it("a pick reveals the point's step and flashes right or wrong", () => {
    const right = run([{ type: "start" }, { type: "pick", cell: [1, 0] }]);
    expect(right).toMatchObject({ view: 5, flash: { cell: [1, 0], ok: true } });
    const wrong = run([{ type: "start" }, { type: "pick", cell: [0, 1] }]);
    expect(wrong.flash).toEqual({ cell: [0, 1], ok: false });
  });

  it("ignores clicks while the answer is shown, and when idle", () => {
    const s = run([
      { type: "start" },
      { type: "pick", cell: [1, 0] },
      { type: "pick", cell: [9, 9] },
    ]);
    expect(s.guesses).toEqual([[1, 0]]);
    expect(run([{ type: "pick", cell: [1, 0] }])).toBe(IDLE);
  });

  it("moves on, then ends on the last step and asks for grading", () => {
    const s = run([
      { type: "start" },
      { type: "pick", cell: [1, 0] },
      { type: "next" },
      { type: "pick", cell: [5, 5] },
    ]);
    expect(s).toMatchObject({ index: 1, view: 9 });
    const end = predictStep(s, { type: "next" }, POINTS, LAST);
    expect(end).toMatchObject({ active: false, done: true, view: LAST });
    expect(scoreOf(end, POINTS)).toBe(1);
  });

  it("stop leaves Predict mode; a trace without points can't start", () => {
    expect(run([{ type: "start" }, { type: "stop" }]).active).toBe(false);
    expect(predictStep(IDLE, { type: "start" }, [], LAST)).toBe(IDLE);
  });
});
