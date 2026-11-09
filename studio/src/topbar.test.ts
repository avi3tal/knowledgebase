import { describe, expect, it } from "vitest";
import type { Subject } from "./api";
import { sectionsFor } from "./components/TopBar";
import { parseRoute, tabOf } from "./route";

const subj = (status: string) => ({ id: "x", status }) as unknown as Subject;

describe("top bar sections", () => {
  it("shows every section for an open subject", () => {
    expect(sectionsFor(subj("ready")).map((s) => s.tab)).toEqual([
      "learn",
      "problems",
      "map",
      "progress",
    ]);
  });
  it("hides problems and progress for a locked subject", () => {
    expect(sectionsFor(subj("locked")).map((s) => s.tab)).toEqual(["learn", "map"]);
  });
  it("marks the section of a detail page", () => {
    expect(tabOf(parseRoute("#/problem/algo/move-zeroes"))).toBe("problems");
    expect(tabOf(parseRoute("#/design/ood/shopping-cart/solution"))).toBe("problems");
    expect(tabOf(parseRoute("#/learn/algo/two-pointers"))).toBe("learn");
    expect(tabOf(parseRoute("#/topic/system-design/fan-out"))).toBe("learn");
  });
});
