import { describe, expect, it } from "vitest";
import type { Session } from "./api";
import {
  actionsFor,
  createdAttempt,
  groupByStatus,
  isDesignItem,
  latestConsoleHref,
  runCommand,
  scoreBand,
} from "./sessions";

const s = (id: string, status: Session["status"]) => ({ id, status }) as Session;

describe("sessions", () => {
  it("offers only valid transitions", () => {
    expect(actionsFor("planned").map((a) => a.to)).toEqual(["active", "abandoned"]);
    expect(actionsFor("active").map((a) => a.to)).toEqual(["done", "abandoned"]);
    expect(actionsFor("done").map((a) => a.to)).toEqual(["active"]);
    expect(actionsFor("abandoned").map((a) => a.to)).toEqual(["active"]);
  });
  it("groups active first and drops empty groups", () => {
    const groups = groupByStatus([s("a", "done"), s("b", "active"), s("c", "done")]);
    expect(groups.map((g) => [g.status, g.sessions.map((x) => x.id)])).toEqual([
      ["active", ["b"]],
      ["done", ["a", "c"]],
    ]);
  });
  it.each([
    [null, "none"],
    [100, "high"],
    [85, "high"],
    [70, "mid"],
    [20, "low"],
  ] as const)("score %s is %s", (score, band) => {
    expect(scoreBand(score)).toBe(band);
  });
  it("sends design items to the console", () => {
    expect(isDesignItem({ kind: "sd-problem" })).toBe(true);
    expect(isDesignItem({ kind: "ood-problem" })).toBe(true);
    expect(isDesignItem({ kind: "algo-problem" })).toBe(false);
    const item = { subject: "system-design", slug: "url-shortener", attempts: ["a", "b"] };
    expect(latestConsoleHref(item)).toBe("#/design/system-design/url-shortener/b");
    expect(latestConsoleHref({ ...item, attempts: [] })).toBeNull();
  });
  it("finds the attempt a start call created", () => {
    expect(createdAttempt(["x"], ["x", "y"])).toBe("y");
    expect(createdAttempt([], ["a-2", "a"])).toBe("a-2");
    expect(createdAttempt(["x"], ["x"])).toBe("x");
    expect(createdAttempt([], [])).toBeNull();
  });
  it("prints repo-relative run commands", () => {
    expect(runCommand("/r/_workspace/attempts/algo/x/a", "/r")).toBe(
      "./kb run _workspace/attempts/algo/x/a",
    );
    expect(runCommand("/elsewhere/a", "/r")).toBe("./kb run /elsewhere/a");
  });
});
