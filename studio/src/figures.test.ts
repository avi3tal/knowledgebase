import { describe, expect, it } from "vitest";
import type { ArchitectureFigure, SequenceFigure } from "./figures";
import {
  architectureDiagram,
  circled,
  edgeStepNumbers,
  figureNumbering,
  flowEdgePath,
  laneX,
  sequenceSteps,
  stepHighlight,
} from "./figures";

const ARCH: ArchitectureFigure = {
  kind: "architecture",
  title: "t",
  nodes: [
    { id: "a", kind: "client", x: 0, y: 0 },
    { id: "b", kind: "service", x: 200, y: 0 },
    { id: "c", kind: "cache", x: 200, y: 200 },
  ],
  edges: [
    { from: "a", to: "b", label: "call" },
    { from: "b", to: "c" },
  ],
  steps: [
    { text: "one", edges: ["a>b"] },
    { text: "two", edges: ["b>c", "a>b"], nodes: ["c"] },
  ],
};

describe("figures", () => {
  it("numbers edges by the first step that uses them and prefixes labels", () => {
    expect([...edgeStepNumbers(ARCH.steps)]).toEqual([
      ["a>b", 1],
      ["b>c", 2],
    ]);
    expect(architectureDiagram(ARCH).edges.map((e) => e.label)).toEqual(["① call", "②"]);
    expect(circled(21)).toBe("(21)");
  });

  it("converts a step to the canvas highlight", () => {
    const h = stepHighlight(ARCH.steps?.[1]);
    expect([...h.edges]).toEqual(["b->c", "a->b"]);
    expect([...h.nodes]).toEqual(["c"]);
    expect(stepHighlight(undefined).edges.size).toBe(0);
  });

  it("makes every sequence message a step and lays out lanes left to right", () => {
    const f: SequenceFigure = {
      kind: "sequence",
      title: "t",
      actors: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
      messages: [
        { from: "x", to: "y", label: "hi", note: "say hi" },
        { from: "y", to: "x", label: "ok" },
      ],
    };
    expect(sequenceSteps(f).map((s) => s.text)).toEqual(["say hi", "ok"]);
    expect(laneX(f, "y")).toBeGreaterThan(laneX(f, "x"));
  });

  it("routes flowchart edges straight when aligned, as an elbow otherwise", () => {
    expect(flowEdgePath({ col: 0, row: 0 }, { col: 0, row: 1 }).split(" ")).toHaveLength(2);
    expect(flowEdgePath({ col: 0, row: 0 }, { col: 1, row: 2 }).split(" ")).toHaveLength(3);
  });

  it("numbers figures across a lesson in reading order", () => {
    const blocks = [
      { type: "markdown", text: "```figure\na\n```\ntext\n```figure\nb\n```" },
      { type: "trace" },
      { type: "markdown", text: "```figure\nc\n```" },
    ];
    expect([...figureNumbering(blocks)]).toEqual([
      ["0:a", 1],
      ["0:b", 2],
      ["2:c", 3],
    ]);
  });
});
