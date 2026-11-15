import { describe, expect, it } from "vitest";
import { fitScale } from "./fit";

describe("fitScale", () => {
  it.each([
    [
      "small table in a wide frame: limited by the cap",
      { w: 160, h: 160 },
      { w: 800, h: 460 },
      2.25,
      2.25,
    ],
    ["limited by the room's height", { w: 200, h: 300 }, { w: 800, h: 450 }, 3, 1.5],
    ["limited by the room's width", { w: 400, h: 100 }, { w: 600, h: 460 }, 3, 1.5],
    ["content wider than the room never shrinks", { w: 900, h: 100 }, { w: 600, h: 460 }, 3, 1],
    ["not measured yet", { w: 0, h: 0 }, { w: 600, h: 460 }, 3, 1],
    ["rounded down to 1/100", { w: 300, h: 10 }, { w: 1000, h: 999 }, 9, 3.33],
  ])("%s", (_name, natural, room, max, expected) => {
    expect(fitScale(natural, room, max)).toBe(expected);
  });
});
