import { describe, expect, it } from "vitest";
import structureFixture from "../../tools/tests/testdata/figure_structure_fixture.json";
import type {
  ArchitectureFigure,
  SequenceFigure,
  StructureFigure,
  UmlClass,
  UmlFigure,
} from "./figures";
import {
  UML,
  nearEnd,
  rectBorderPoint,
  splitVisibility,
  stepsOf,
  structureFrame,
  structureSteps,
  umlBox,
  umlEdge,
  umlLayout,
  applyScenario,
  architectureDiagram,
  scenarioTabs,
  stepFailed,
  circled,
  edgeStepNumbers,
  figureNumbering,
  flowEdgePath,
  laneX,
  sequenceSteps,
  stepHighlight,
} from "./figures";
import type { ArrayState, GraphState, TreeState } from "./trace";
import { graphEdgeOn, viewId } from "./trace";

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

describe("scenarios", () => {
  const withScenarios: ArchitectureFigure = {
    ...ARCH,
    caption: "base caption",
    base_name: "Happy path",
    scenarios: [
      { name: "Cache down", tone: "failure", steps: [{ text: "boom", fail: ["c", "b>c"] }] },
      {
        name: "No cache",
        tone: "alternative",
        nodes: [{ id: "a", kind: "client", x: 0, y: 0 }],
        edges: [],
      },
    ],
  };

  it("lists the base first, then each scenario with its tone", () => {
    expect(scenarioTabs(withScenarios).map((t) => [t.name, t.tone])).toEqual([
      ["Happy path", "happy"],
      ["Cache down", "failure"],
      ["No cache", "alternative"],
    ]);
  });

  it("replaces only the fields a scenario sets, and drops the base caption", () => {
    const down = applyScenario(withScenarios, 1);
    expect(down.steps?.[0]?.text).toBe("boom");
    expect(down.kind === "architecture" && down.nodes).toHaveLength(3);
    expect(down.caption).toBeUndefined();
    const alt = applyScenario(withScenarios, 2);
    expect(alt.kind === "architecture" && alt.nodes).toHaveLength(1);
    expect(applyScenario(withScenarios, 0)).toBe(withScenarios);
  });

  it("splits failed ids into nodes and canvas edge keys", () => {
    const f = stepFailed({ text: "x", fail: ["c", "b>c"] });
    expect([...f.nodes]).toEqual(["c"]);
    expect([...f.edges]).toEqual(["b->c"]);
  });
});

describe("uml layout", () => {
  const cls: UmlClass = {
    id: "cart",
    name: "Cart",
    fields: ["- _lines: dict[str, CartLine]"],
    methods: ["+ add_item(p: Product, qty: int): None", "+ total(): Money"],
    x: 10,
    y: 20,
  };

  it("sizes a box to its longest line and its compartments", () => {
    const b = umlBox(cls);
    const longest = "+ add_item(p: Product, qty: int): None".length * UML.charW;
    expect(b.w).toBe(Math.ceil(longest + UML.padX * 2));
    expect(b.header).toBe(UML.padY * 2 + UML.name);
    expect(b.fields).toBe(UML.padY * 2 + UML.line);
    expect(b.methods).toBe(UML.padY * 2 + 2 * UML.line);
    expect(b.h).toBe(b.header + b.fields + b.methods);
  });

  it("keeps a minimum width, adds a stereotype line, and drops an enum's empty methods", () => {
    const e = umlBox({ id: "s", name: "Size", stereotype: "enum", fields: ["S", "M"], x: 0, y: 0 });
    expect(e.w).toBe(UML.minW);
    expect(e.header).toBe(UML.padY * 2 + UML.name + UML.stereo);
    expect(e.methods).toBe(0);
    const empty = umlBox({ id: "i", name: "Shape", stereotype: "interface", x: 0, y: 0 });
    expect(empty.fields).toBe(UML.empty);
    expect(empty.methods).toBe(UML.empty);
  });

  it("offsets boxes by the padding and sizes the svg around them", () => {
    const f: UmlFigure = { kind: "uml", title: "t", classes: [cls] };
    const { boxes, width, height } = umlLayout(f);
    const b = boxes.get("cart");
    expect(b?.x).toBe(10 + UML.pad);
    expect(width).toBe((b?.x ?? 0) + (b?.w ?? 0) + UML.pad);
    expect(height).toBe((b?.y ?? 0) + (b?.h ?? 0) + UML.pad);
  });

  it("finds where the centre line leaves a box", () => {
    const r = { x: 0, y: 0, w: 100, h: 40 };
    expect(rectBorderPoint(r, { x: 300, y: 20 })).toEqual({ x: 100, y: 20 }); // dy = 0
    expect(rectBorderPoint(r, { x: 50, y: -200 })).toEqual({ x: 50, y: 0 }); // dx = 0
    expect(rectBorderPoint(r, { x: 50, y: 20 })).toEqual({ x: 50, y: 20 }); // same centre
    // diagonal: hits the top edge first (box is wider than tall)
    expect(rectBorderPoint(r, { x: 150, y: -80 })).toEqual({ x: 70, y: 0 });
  });

  it("draws a relation from border to border", () => {
    const a = { x: 0, y: 0, w: 100, h: 40 };
    const b = { x: 0, y: 200, w: 100, h: 40 };
    expect(umlEdge(a, b)).toEqual({ start: { x: 50, y: 40 }, end: { x: 50, y: 200 } });
    // different widths, same column: straight down through the middle of the overlap
    const wide = { x: 0, y: 200, w: 200, h: 40 };
    expect(umlEdge(wide, a)).toEqual({ start: { x: 50, y: 200 }, end: { x: 50, y: 40 } });
    // side by side with overlapping rows: straight across
    const right = { x: 300, y: 10, w: 80, h: 60 };
    expect(umlEdge(a, right)).toEqual({ start: { x: 100, y: 25 }, end: { x: 300, y: 25 } });
    // diagonal neighbours: centre to centre, border to border
    const far = { x: 300, y: 300, w: 100, h: 40 };
    const { start, end } = umlEdge(a, far);
    expect(start.y).toBe(40);
    expect(end.y).toBe(300);
  });

  it("places multiplicities near an end, off to one side", () => {
    expect(nearEnd({ x: 0, y: 0 }, { x: 100, y: 0 }, 18, 12)).toEqual({ x: 18, y: 12 });
  });

  it("splits a member's visibility", () => {
    expect(splitVisibility("+ add(x)")).toEqual(["+", "add(x)"]);
    expect(splitVisibility("- _lines: dict")).toEqual(["-", "_lines: dict"]);
    expect(splitVisibility("# _hook()")).toEqual(["#", "_hook()"]);
    expect(splitVisibility("SMALL")).toEqual(["", "SMALL"]);
  });

  it("uses a uml figure's own steps", () => {
    const f: UmlFigure = {
      kind: "uml",
      title: "t",
      classes: [cls],
      steps: [{ text: "the cart", nodes: ["cart"] }],
    };
    expect(stepsOf(f)).toEqual(f.steps);
  });
});

describe("structure figures", () => {
  // Normalised by kb (tools/tests/test_figures.py regenerates and compares the same file).
  const fixture = structureFixture as unknown as StructureFigure;

  it("turns every frame into a narrated step", () => {
    expect(structureSteps(fixture)).toEqual([{ text: "start at a" }, { text: "relax a-c" }]);
    expect(stepsOf(fixture)).toHaveLength(2);
  });

  it("shows the first frame at rest and clamps past the end", () => {
    expect(structureFrame(fixture, -1)?.text).toBe("start at a");
    expect(structureFrame(fixture, 1)?.text).toBe("relax a-c");
    expect(structureFrame(fixture, 9)?.text).toBe("relax a-c");
  });

  it("carries trace view states, including the graph view", () => {
    const [first, second] = fixture.frames;
    expect(fixture.views.map(viewId)).toEqual(["g", "root", "dist"]);
    const tree = second?.state.root as TreeState;
    expect(tree.pointers.cur).toBe(2); // level-order index 2 → third node in BFS id order
    expect((first?.state.dist as ArrayState).pointers).toEqual({ i: 0 });
    const g = second?.state.g as GraphState;
    expect(g.labels).toEqual({ a: "d=0", c: "d=1" });
    // "c>a" lights the undirected a–c edge; the directed a→b edge only matches its own direction
    const on = g.edges.filter((e) => graphEdgeOn(g, e)).map((e) => `${e.from}>${e.to}`);
    expect(on).toEqual(["a>c"]);
    expect(graphEdgeOn(g, { from: "b", to: "a", directed: true })).toBe(false);
  });
});
