import { describe, expect, it } from "vitest";
// Same fixture the Python side regenerates and compares (tools/tests/test_learn.py).
import fixtureJson from "../../tools/tests/testdata/trace_fixture.json";
import type { ArrayState, MapState, Trace, VarsState } from "./trace";
import { changedKeys, changedVars, clampStep, inWindow, isTrace, viewId } from "./trace";

const fixture: unknown = fixtureJson;

describe("trace contract", () => {
  it("accepts the Python-generated fixture", () => {
    expect(isTrace(fixture)).toBe(true);
  });

  const trace = fixture as Trace;

  it("every step has state for every view and a valid code line", () => {
    for (const step of trace.steps) {
      expect(step.line).toBeGreaterThanOrEqual(1);
      expect(step.line).toBeLessThanOrEqual(trace.code.length);
      for (const spec of trace.view) expect(step.state[viewId(spec)]).toBeDefined();
    }
  });

  it("notes come from # note: comments and are stripped from the code", () => {
    expect(trace.steps.some((s) => s.note === "window full")).toBe(true);
    expect(trace.code.join("\n")).not.toContain("# note:");
  });

  it("final state matches the result", () => {
    const last = trace.steps[trace.steps.length - 1]!;
    expect((last.state.vars as VarsState).values.sums).toEqual(trace.result);
  });
});

describe("helpers", () => {
  const trace = fixture as Trace;

  it("clamps steps", () => {
    expect(clampStep(-3, trace)).toBe(0);
    expect(clampStep(10_000, trace)).toBe(trace.steps.length - 1);
  });

  it("detects the window", () => {
    const s: ArrayState = { values: [1, 2, 3], pointers: {}, window: [1, 2] };
    expect([0, 1, 2].map((i) => inWindow(s, i))).toEqual([false, true, true]);
    expect(inWindow({ ...s, window: null }, 1)).toBe(false);
  });

  it("highlights changed vars and map keys", () => {
    const a: VarsState = { values: { x: 1, y: [1] } };
    const b: VarsState = { values: { x: 1, y: [1, 2] } };
    expect([...changedVars(a, b)]).toEqual(["y"]);
    expect([...changedVars(undefined, b)].sort()).toEqual(["x", "y"]);
    const m1: MapState = { entries: [["a", 1]] };
    const m2: MapState = {
      entries: [
        ["a", 2],
        ["b", 1],
      ],
    };
    expect([...changedKeys(m1, m2)]).toEqual(['"a"', '"b"']);
    expect([...changedKeys(m2, m2)]).toEqual([]);
  });
});
