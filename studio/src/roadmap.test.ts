import { describe, expect, it } from "vitest";
import { roadKey, routeRoads, settledSoFar } from "./roadmap";
import type { Trace } from "./trace";

const step = (current: string | null) => ({ line: 1, note: null, state: { map: { current } } });
const trace = {
  steps: [step(null), step("0"), step("2"), step("2"), step("3")],
} as unknown as Trace;

describe("roadmap helpers", () => {
  it("settles every node popped so far", () => {
    expect([...settledSoFar(trace, "map", 0)]).toEqual([]);
    expect([...settledSoFar(trace, "map", 3)]).toEqual(["0", "2"]);
    expect([...settledSoFar(trace, "map", 99)]).toEqual(["0", "2", "3"]);
  });

  it("road keys ignore direction; a route becomes its roads", () => {
    expect(roadKey("3", "1")).toBe(roadKey("1", "3"));
    expect([...routeRoads(["0", "2", "3"])]).toEqual(["0>2", "2>3"]);
    expect(routeRoads(null).size).toBe(0);
  });
});
