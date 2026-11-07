import { describe, expect, it } from "vitest";
// Shared contract with tools/kb/design.py (pytest test_check_fixture_is_current compares it).
import fixtureJson from "../../tools/tests/testdata/design_check_fixture.json";
import refV1 from "../../system-design/problems/url-shortener/reference/diagrams/v1.json";
import refV2 from "../../system-design/problems/url-shortener/reference/diagrams/v2.json";
import refV3 from "../../system-design/problems/url-shortener/reference/diagrams/v3.json";
import type { DesignCheck, DesignDoc, DesignPart, Diagram } from "./api";
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
  SHAPE_MIME,
  composeDiagram,
  composePreview,
  composeVersion,
  composeWhy,
  connections,
  coverableIds,
  diagramToSub,
  freeSpot,
  extractBrief,
  filterPalette,
  kindShape,
  linkNode,
  linkTargets,
  missingPartNodes,
  newPart,
  newlyPassed,
  paletteGroups,
  partToDiagram,
  placeComposed,
  stagesFirst,
} from "./design";
import refDesignJson from "../../system-design/problems/url-shortener/reference/design.json";

const fixture = fixtureJson as unknown as DesignCheck;
const refs = [refV1, refV2, refV3] as unknown as Diagram[];
const refDesign = refDesignJson as unknown as DesignDoc;
const refParts = refDesign.parts ?? [];

const SD_PALETTE = [
  "client",
  "dns",
  "cdn",
  "load-balancer",
  "api-gateway",
  "service",
  "worker",
  "scheduler",
  "cache",
  "sql",
  "nosql",
  "blob",
  "search",
  "queue",
  "stream",
  "coordinator",
  "external",
];
const OOD_PALETTE = ["actor", "class", "abstract", "interface", "enum"];

const part = (id: string, nodes: string[], edges: [string, string][] = []): DesignPart => ({
  ...newPart([]),
  id,
  diagram: {
    nodes: nodes.map((n, i) => ({ id: n, kind: "service", label: n, x: 100, y: 40 + i * 100 })),
    edges: edges.map(([from, to]) => ({ from, to, label: `${from}→${to}` })),
  },
});

describe("stencil", () => {
  it("groups the system-design palette Visio-style, every kind exactly once", () => {
    const g = paletteGroups(SD_PALETTE);
    expect(g.map((x) => x.title)).toEqual([
      "Clients & edge",
      "Compute",
      "Data",
      "Messaging",
      "External",
    ]);
    expect(g[0]!.kinds).toEqual(["client", "dns", "cdn", "load-balancer", "api-gateway"]);
    expect(g.flatMap((x) => x.kinds).sort()).toEqual([...SD_PALETTE].sort());
  });
  it("gives OOD one group, drops kinds the problem lacks, keeps unknown kinds under Other", () => {
    expect(paletteGroups(OOD_PALETTE)).toEqual([
      { title: "Classes", icon: "📦", kinds: OOD_PALETTE },
    ]);
    const g = paletteGroups(["client", "service", "robot"]);
    expect(g.map((x) => [x.title, x.kinds])).toEqual([
      ["Clients & edge", ["client"]],
      ["Compute", ["service"]],
      ["Other", ["robot"]],
    ]);
  });
  it("filters by kind, label, id base or group title, and drops empty groups", () => {
    const g = paletteGroups(SD_PALETTE);
    expect(filterPalette(g, "  ")).toBe(g);
    expect(filterPalette(g, "DB").flatMap((x) => x.kinds)).toEqual(["sql"]);
    expect(filterPalette(g, "lb").flatMap((x) => x.kinds)).toEqual(["load-balancer"]);
    expect(filterPalette(g, "messag").flatMap((x) => x.kinds)).toEqual(["queue", "stream"]);
    expect(filterPalette(g, "zzz")).toEqual([]);
    expect(SHAPE_MIME).toMatch(/^application\/x-/);
  });
  it("adds clicked shapes on a free spot next to the centre, never on top of another", () => {
    expect(freeSpot([], { x: 103, y: 47 })).toEqual({ x: 100, y: 50 });
    const nodes = [{ id: "a", kind: "service", x: 100, y: 50 }];
    const p = freeSpot(nodes, { x: 100, y: 50 });
    expect(p).toEqual({ x: 100 + NODE_W + 30, y: 50 });
    const q = freeSpot([...nodes, { id: "b", kind: "service", ...p }], { x: 100, y: 50 });
    expect(q).toEqual({ x: 100, y: 50 + NODE_H + 30 });
  });
  it("draws stores as cylinders and messaging as pipes", () => {
    expect(kindShape("sql")).toBe("store");
    expect(kindShape("queue")).toBe("pipe");
    expect(kindShape("actor")).toBe("person");
    expect(kindShape("service")).toBe("card");
  });
});

describe("brief", () => {
  it("extracts the interviewer section up to the next h2", () => {
    const md =
      "# T\n\nintro\n\n## What the interviewer tells you if you ask\n- 100M links\n- 5 years\n\n## Your job\nwork";
    expect(extractBrief(md)).toBe("- 100M links\n- 5 years");
    expect(extractBrief("# T\n## what THE interviewer tells you\nx\n### sub\ny")).toBe(
      "x\n### sub\ny",
    );
    expect(extractBrief("# T\n## Your job\nwork")).toBeNull();
  });
  it("lists F, N and A ids as coverable", () => {
    expect(coverableIds(refDesign.scope).map((x) => x.id)).toEqual(
      expect.arrayContaining(["F1", "F2", "N1"]),
    );
    expect(coverableIds(refDesign.scope).some((x) => x.id.startsWith("O"))).toBe(false);
  });
});

describe("checklist order and pass animation", () => {
  it("puts the current stage first", () => {
    expect(stagesFirst(["scope", "api", "parts", "high-level"], "parts")).toEqual([
      "parts",
      "scope",
      "api",
      "high-level",
    ]);
    expect(stagesFirst(["scope", "api"], "reference")).toEqual(["scope", "api"]);
  });
  it("reports only the checks that flipped to passed", () => {
    const prev = [
      { id: "a", passed: false },
      { id: "b", passed: true },
      { id: "c", passed: false },
    ];
    const next = [
      { id: "a", passed: true },
      { id: "b", passed: true },
      { id: "c", passed: false },
      { id: "d", passed: true },
    ];
    expect(newlyPassed(prev, next)).toEqual(["a", "d"]);
  });
});

describe("decompose → reduce (mirrors kb design.compose / part_smells)", () => {
  it("composes the reference parts into v1 exactly like Python", () => {
    // python3: design.compose(v1, parts) on system-design/problems/url-shortener/reference
    const c = composeDiagram(refs[0]!, refParts);
    expect(c.nodes.map((n) => n.id)).toEqual([
      "client",
      "svc",
      "db",
      "ids",
      "lb",
      "cache",
      "kv",
      "clicks",
      "agg",
      "stats",
    ]);
    expect(c.edges.map((e) => `${e.from}->${e.to}`)).toEqual([
      "client->svc",
      "svc->db",
      "svc->ids",
      "client->lb",
      "lb->svc",
      "svc->cache",
      "svc->kv",
      "svc->clicks",
      "clicks->agg",
      "agg->stats",
    ]);
    expect(refs[0]!.nodes).toHaveLength(3); // input untouched
  });
  it("lets existing nodes and edges win, dedupes edges by from→to and is idempotent", () => {
    const base: Diagram = {
      version: 1,
      why: "v1",
      nodes: [{ id: "svc", kind: "service", label: "Mine", x: 1, y: 2 }],
      edges: [],
    };
    const p1 = part("P1", ["svc", "db"], [["svc", "db"]]);
    const p2 = part("P2", ["db", "cache"], [["svc", "db"]]);
    const once = composeDiagram(base, [p1, p2]);
    expect(once.nodes.find((n) => n.id === "svc")).toEqual(base.nodes[0]);
    expect(once.nodes.map((n) => n.id)).toEqual(["svc", "db", "cache"]);
    expect(once.edges).toEqual([{ from: "svc", to: "db", label: "svc→db" }]);
    expect(once.version).toBe(1);
    expect(composeDiagram(once, [p1, p2])).toEqual(once);
    // copies, not aliases
    once.nodes[1]!.label = "changed";
    expect(p1.diagram.nodes[1]!.label).toBe("db");
  });
  it("finds the part nodes missing from a version, like part_smells", () => {
    expect(missingPartNodes(refs[0], refParts)).toEqual([
      "agg",
      "cache",
      "clicks",
      "ids",
      "kv",
      "lb",
      "stats",
    ]);
    expect(missingPartNodes(refs[2], refParts)).toEqual([]);
    expect(missingPartNodes(undefined, [part("P1", ["b", "a", "b"])])).toEqual(["a", "b"]);
    expect(missingPartNodes(refs[0], [])).toEqual([]);
  });
  it("previews which parts add something", () => {
    expect(composePreview(refs[2], refParts)).toEqual({ parts: [], nodes: 0, edges: 0 });
    const p = composePreview(refs[0], refParts);
    expect(p.parts).toEqual(refParts.map((x) => x.id));
    expect(p.nodes).toBe(7);
    expect(composeWhy(["P1", "P3"])).toBe("Compose P1, P3");
  });
  it("builds the next version, placing new nodes off the old ones", () => {
    const v1: Diagram = {
      version: 1,
      why: "naive",
      nodes: [{ id: "svc", kind: "service", label: "svc", x: 100, y: 40 }],
      edges: [],
    };
    const next = composeVersion([v1], [part("P1", ["svc", "db", "cache"], [["svc", "db"]])])!;
    expect(next.version).toBe(2);
    expect(next.why).toBe("Compose P1");
    expect(next.nodes[0]).toEqual(v1.nodes[0]);
    const boxes = next.nodes.map((n) => [n.x!, n.y!] as const);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i]!, boxes[j]!];
        const apart = Math.abs(a[0] - b[0]) >= NODE_W || Math.abs(a[1] - b[1]) >= NODE_H;
        expect(apart).toBe(true);
      }
    expect(composeVersion([next], [part("P1", ["svc", "db"], [["svc", "db"]])])).toBeNull();
    expect(composeVersion([], [part("P1", ["a"])])?.version).toBe(1);
  });
  it("keeps a free part position as is", () => {
    const d: Diagram = {
      version: 2,
      why: "",
      nodes: [
        { id: "a", kind: "service", x: 0, y: 0 },
        { id: "b", kind: "service", x: 600, y: 600 },
      ],
      edges: [],
    };
    expect(placeComposed(d, ["a"]).nodes[1]).toMatchObject({ x: 600, y: 600 });
  });
  it("starts parts empty but valid, and round-trips the sub-diagram", () => {
    const p = newPart([part("P1", []), part("P3", [])]);
    expect(p.id).toBe("P4");
    expect(p.covers).toEqual([]);
    expect(p.diagram).toEqual({ nodes: [], edges: [] });
    const d = partToDiagram(part("P1", ["a"]));
    expect(d.version).toBe(0);
    expect(Object.keys(diagramToSub(d)).sort()).toEqual(["edges", "nodes"]);
  });
  it("offers link targets from the latest version, then other parts, unique and not already here", () => {
    const latest = refs[1]!;
    const ps = [part("P1", ["svc", "ids"]), part("P2", ["svc", "newthing"])];
    const t = linkTargets(latest, ps, "P1", ps[0]!.diagram);
    expect(t.map((x) => x.id)).not.toContain("svc");
    expect(t.map((x) => x.id)).toContain("newthing");
    expect(t.find((x) => x.id === "newthing")?.from).toBe("P2");
    expect(t[0]!.from).toBe(`v${latest.version}`);
    expect(new Set(t.map((x) => x.id)).size).toBe(t.length);
  });
  it("links a node to an existing component: id, kind and label follow, edges too", () => {
    const d: Diagram = {
      version: 0,
      why: "",
      nodes: [
        { id: "svc", kind: "service" },
        { id: "db", kind: "sql", label: "SQL DB" },
      ],
      edges: [{ from: "svc", to: "db" }],
      flows: [{ name: "f", path: ["svc", "db"] }],
    };
    const r = linkNode(d, "db", { id: "kv", kind: "nosql", label: "links KV" });
    expect(r.nodes[1]).toEqual({ id: "kv", kind: "nosql", label: "links KV" });
    expect(r.edges).toEqual([{ from: "svc", to: "kv" }]);
    expect(r.flows![0]!.path).toEqual(["svc", "kv"]);
    expect(linkNode(d, "db", { id: "svc", kind: "service", label: "x" })).toBe(d);
    expect(linkNode(d, "nope", { id: "z", kind: "service", label: "x" })).toBe(d);
    expect(connections(r, "kv")).toEqual({ out: [], in: [{ from: "svc", to: "kv" }] });
  });
});

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
    expect(d).toMatch(new RegExp(`^M${NODE_W + 2},${NODE_H / 2} C`));
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
