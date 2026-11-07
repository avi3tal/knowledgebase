import { describe, expect, it } from "vitest";
// Shared contract with tools/kb/design.py (pytest test_check_fixture_is_current compares it).
import fixtureJson from "../../tools/tests/testdata/design_check_fixture.json";
import refV1 from "../../system-design/problems/url-shortener/reference/diagrams/v1.json";
import refV2 from "../../system-design/problems/url-shortener/reference/diagrams/v2.json";
import refV3 from "../../system-design/problems/url-shortener/reference/diagrams/v3.json";
import type { DesignCheck, Diagram } from "./api";
import {
  NODE_H,
  NODE_W,
  KIND_STYLE,
  addEdge,
  addNode,
  addScopeItem,
  boundaryPoint,
  bounds,
  cloneLatest,
  diffDiagrams,
  edgePath,
  formatClock,
  formatSI,
  highlightFor,
  hitNode,
  kindStyle,
  moveNode,
  newParts,
  nextItemId,
  nextNodeId,
  nextTipLevel,
  parseDiagramJson,
  relabelEdge,
  relabelNode,
  removeEdge,
  removeNode,
  reverseEdge,
  smellsByNode,
  snap,
  sortVersions,
  truncate,
  withPositions,
  zoomAt,
} from "./design";

const fixture = fixtureJson as unknown as DesignCheck;
const refs = [refV1, refV2, refV3] as unknown as Diagram[];

describe("design check contract", () => {
  it("has the shape the console renders", () => {
    expect(fixture.passed).toBe(fixture.total);
    expect(Object.keys(fixture.stages)).toContain("high-level");
    expect(
      fixture.checks.every((c) => typeof c.passed === "boolean" && c.stage in fixture.stages),
    ).toBe(true);
    expect(fixture.versions.map((v) => v.version)).toEqual([1, 2, 3]);
    expect(fixture.versions[0]?.smells.length).toBeGreaterThan(0);
    expect(fixture.final_smells).toEqual([]);
    expect(fixture.estimates.every((e) => e.value !== null)).toBe(true);
  });

  it("computes the same version diffs as kb (reference diagrams)", () => {
    refs.forEach((d, i) => {
      expect(diffDiagrams(refs[i - 1] ?? null, d)).toEqual(fixture.versions[i]?.diff);
    });
  });
});

const d0: Diagram = {
  version: 1,
  why: "",
  nodes: [
    { id: "client", kind: "client", x: 0, y: 0 },
    { id: "svc", kind: "service", x: 300, y: 0 },
  ],
  edges: [{ from: "client", to: "svc" }],
};

describe("palette and ids", () => {
  it("has a distinct colour and an icon for every system-design and ood kind", () => {
    const kinds = Object.keys(KIND_STYLE);
    expect(kinds).toContain("load-balancer");
    expect(kinds).toContain("interface");
    expect(new Set(kinds.map((k) => KIND_STYLE[k]!.color + KIND_STYLE[k]!.icon)).size).toBe(
      kinds.length,
    );
    expect(kindStyle("weird-kind").label).toBe("weird-kind");
    expect(kindStyle("weird-kind").id).toBe("weirdkind");
  });

  it.each([
    ["cache", [], "cache"],
    ["cache", ["cache"], "cache2"],
    ["cache", ["cache", "cache2", "cache3"], "cache4"],
    ["load-balancer", ["client"], "lb"],
    ["sql", ["db"], "db2"],
  ])("new %s node with %j taken → %s", (kind, taken, want) => {
    expect(nextNodeId(kind, taken)).toBe(want);
  });

  it("generated ids satisfy kb's id rule", () => {
    for (const k of [...Object.keys(KIND_STYLE), "9lives", "x-y"])
      expect(nextNodeId(k, [])).toMatch(/^[A-Za-z][A-Za-z0-9_-]{0,40}$/);
  });

  it("numbers scope items after the highest existing id", () => {
    expect(nextItemId("F", [])).toBe("F1");
    expect(nextItemId("F", [{ id: "F1" }, { id: "F7" }, { id: "N9" }])).toBe("F8");
    expect(addScopeItem([{ id: "A1", text: "x" }], "A")).toEqual([
      { id: "A1", text: "x" },
      { id: "A2", text: "" },
    ]);
  });
});

describe("formatting", () => {
  it.each([
    [38.58, "38.6"],
    [3858.02, "3.86k"],
    [11574, "11.6k"],
    [100e6, "100M"],
    [6e9, "6B"],
    [3e12, "3T"],
    [0, "0"],
    [-2500, "-2.5k"],
    [0.5, "0.5"],
    [null, "–"],
    [Infinity, "–"],
  ])("formatSI(%s) = %s", (v, want) => {
    expect(formatSI(v)).toBe(want);
  });

  it("formats the timer and truncates labels", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(125)).toBe("02:05");
    expect(formatClock(3725)).toBe("1:02:05");
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a very long label", 8)).toBe("a very …");
  });

  it("escalates tips nudge → hint → show → done", () => {
    expect(nextTipLevel(undefined)).toBe("nudge");
    expect(nextTipLevel("nudge")).toBe("hint");
    expect(nextTipLevel("hint")).toBe("show");
    expect(nextTipLevel("show")).toBeNull();
  });
});

describe("versions and highlights", () => {
  it("marks nothing new on the first version and the diff on later ones", () => {
    expect(highlightFor(fixture, 1).nodes.size).toBe(0);
    const v2 = highlightFor(fixture, 2);
    expect([...v2.nodes].sort()).toEqual(["cache", "ids", "kv", "lb"]);
    expect(v2.edges.has("svc->cache")).toBe(true);
    expect(highlightFor(fixture, 9).nodes.size).toBe(0);
    expect(newParts(undefined, false).edges.size).toBe(0);
  });

  it("matches versions by number even with gaps", () => {
    const gappy = {
      ...fixture,
      versions: [fixture.versions[2]!, fixture.versions[0]!],
    } as DesignCheck;
    expect(highlightFor(gappy, 1).nodes.size).toBe(0);
    expect([...highlightFor(gappy, 3).nodes].sort()).toEqual(["agg", "clicks", "stats"]);
  });

  it("groups smells per node for one version", () => {
    const m = smellsByNode(fixture.smells, 1);
    expect(m.get("db")?.[0]).toMatch(/Read-heavy/);
    expect(m.get("svc")?.length).toBe(1);
    expect(smellsByNode(fixture.smells, 2).size).toBe(0);
  });

  it("clones the latest version as max+1 with an empty why, without aliasing", () => {
    const v3 = { ...d0, version: 3, why: "three" };
    const next = cloneLatest([v3, d0]);
    expect(next.version).toBe(4);
    expect(next.why).toBe("");
    expect(next.nodes).toEqual(v3.nodes);
    next.nodes[0]!.x = 999;
    expect(v3.nodes[0]!.x).toBe(0);
    expect(cloneLatest([]).version).toBe(1);
    expect(sortVersions([v3, d0]).map((d) => d.version)).toEqual([1, 3]);
  });
});

describe("diagram edits", () => {
  it("adds nodes with fresh ids and default labels", () => {
    const [d1, id] = addNode(d0, "cache", 100.4, 200.6);
    expect(id).toBe("cache");
    expect(d1.nodes.at(-1)).toEqual({ id: "cache", kind: "cache", label: "Cache", x: 100, y: 201 });
    expect(addNode(d1, "cache", 0, 0)[1]).toBe("cache2");
    expect(d0.nodes).toHaveLength(2);
  });

  it("moves and relabels nodes", () => {
    expect(moveNode(d0, "svc", 10, 20).nodes[1]).toMatchObject({ x: 10, y: 20 });
    expect(relabelNode(d0, "svc", "API").nodes[1]?.label).toBe("API");
  });

  it("removes a node together with its edges and flow steps", () => {
    const d = { ...d0, flows: [{ name: "f", path: ["client", "svc"] }] };
    const out = removeNode(d, "svc");
    expect(out.nodes.map((n) => n.id)).toEqual(["client"]);
    expect(out.edges).toEqual([]);
    expect(out.flows?.[0]?.path).toEqual(["client"]);
  });

  it("adds edges but never self-loops, duplicates or dangling ends", () => {
    expect(addEdge(d0, "svc", "client").edges).toHaveLength(2);
    expect(addEdge(d0, "client", "svc")).toBe(d0);
    expect(addEdge(d0, "svc", "svc")).toBe(d0);
    expect(addEdge(d0, "svc", "nope")).toBe(d0);
  });

  it("labels, reverses and removes edges by key", () => {
    const labelled = relabelEdge(d0, "client->svc", "GET /x");
    expect(labelled.edges[0]?.label).toBe("GET /x");
    expect(relabelEdge(labelled, "client->svc", "").edges[0]).toEqual({
      from: "client",
      to: "svc",
    });
    expect(reverseEdge(d0, "client->svc").edges[0]).toEqual({ from: "svc", to: "client" });
    expect(removeEdge(d0, "client->svc").edges).toEqual([]);
  });

  it("parses the JSON tab and forces the shown version", () => {
    const ok = parseDiagramJson(JSON.stringify({ ...d0, version: 7 }), 2);
    expect("diagram" in ok && ok.diagram.version).toBe(2);
    expect(parseDiagramJson("{nope", 1)).toMatchObject({ error: expect.stringMatching(/JSON/) });
    expect(parseDiagramJson("[]", 1)).toEqual({ error: "Expected an object" });
    expect(parseDiagramJson('{"nodes": []}', 1)).toMatchObject({ error: expect.any(String) });
  });
});

describe("geometry", () => {
  it("lays out nodes without positions in tiers and keeps stored ones", () => {
    const out = withPositions([
      { id: "c", kind: "client" },
      { id: "db", kind: "sql" },
      { id: "db2", kind: "sql" },
      { id: "s", kind: "service", x: 5, y: 6 },
    ]);
    expect(out[0]!.x).toBeLessThan(out[1]!.x);
    expect(out[1]!.x).toBe(out[2]!.x);
    expect(out[2]!.y).toBeGreaterThan(out[1]!.y);
    expect(out[3]).toMatchObject({ x: 5, y: 6 });
  });

  it("finds where a ray leaves the node box", () => {
    const c = { x: 0, y: 0 };
    expect(boundaryPoint(c, { x: 1000, y: 0 }, 0)).toEqual({ x: NODE_W / 2, y: 0 });
    expect(boundaryPoint(c, { x: 0, y: -1000 }, 0)).toEqual({ x: 0, y: -NODE_H / 2 });
    expect(boundaryPoint(c, c)).toEqual(c);
  });

  it("draws a curve from box edge to box edge with a midpoint between them", () => {
    const { d, mid } = edgePath({ x: 0, y: 0 }, { x: 400, y: 0 });
    expect(d).toMatch(/^M170,30 C/);
    expect(mid.x).toBeGreaterThan(NODE_W);
    expect(mid.x).toBeLessThan(400);
    expect(mid.y).toBe(NODE_H / 2);
    const bent = edgePath({ x: 0, y: 0 }, { x: 400, y: 0 }, 20);
    expect(bent.mid.y).not.toBe(mid.y);
  });

  it("hit-tests the topmost node", () => {
    const nodes = withPositions([
      { id: "a", kind: "service", x: 0, y: 0 },
      { id: "b", kind: "service", x: 50, y: 10 },
    ]);
    expect(hitNode(nodes, { x: 60, y: 20 })?.id).toBe("b");
    expect(hitNode(nodes, { x: 10, y: 5 })?.id).toBe("a");
    expect(hitNode(nodes, { x: 900, y: 900 })).toBeNull();
  });

  it("computes bounds, zooms around a point and snaps", () => {
    expect(bounds([{ x: 0, y: 0 }], 10)).toEqual({
      x: -10,
      y: -10,
      w: NODE_W + 20,
      h: NODE_H + 20,
    });
    expect(bounds([]).w).toBeGreaterThan(0);
    const v = zoomAt({ x: 0, y: 0, k: 1 }, { x: 100, y: 100 }, 2);
    expect(v).toEqual({ x: -100, y: -100, k: 2 });
    expect(zoomAt(v, { x: 0, y: 0 }, 99).k).toBe(2.5);
    expect(snap(14)).toBe(10);
    expect(snap(16)).toBe(20);
  });
});
