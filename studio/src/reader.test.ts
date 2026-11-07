import { describe, expect, it } from "vitest";
import type { Diagram } from "./api";
import {
  activeHeading,
  addedInVersion,
  chipLabel,
  fencedVersions,
  groupProblems,
  latestAttempt,
  matchesQuery,
  navKey,
  needsGate,
  neighbours,
  orderProblems,
  parseDiagramFence,
  partDiagram,
  readingProgress,
  shortTitle,
  stageSteps,
  topicHref,
} from "./reader";

type Row = {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
};
const row = (
  slug: string,
  title: string,
  difficulty: Row["difficulty"],
  topics: string[] = [],
): Row => ({ slug, title, difficulty, topics });
const ROWS: Row[] = [
  row("web-crawler", "Web crawler", "hard", ["queues"]),
  row("url-shortener", "URL shortener", "easy", ["caching", "unique-id-generation"]),
  row("chat-system", "Chat system", "medium", ["websockets"]),
  row("rate-limiter", "Rate limiter", "easy", ["caching"]),
  row("news-feed", "News feed", "medium", ["fan-out"]),
];
const ALL = [
  ["easy", 2, 2],
  ["medium", 2, 2],
  ["hard", 1, 1],
];

describe("orderProblems / neighbours", () => {
  it("sorts by the shown title, ignoring the 'Design a/an' prefix", () => {
    const rows = [
      row("vending", "Design a vending machine", "medium"),
      row("elevator", "Design an elevator system", "medium"),
      row("lru", "LRU cache (object-oriented)", "medium"),
    ];
    const ordered = orderProblems(rows);
    expect(ordered.map((r) => r.slug)).toEqual(["elevator", "lru", "vending"]);
    expect(groupProblems(rows, "")[0]?.rows.map((r) => r.slug)).toEqual([
      "elevator",
      "lru",
      "vending",
    ]);
    expect(neighbours(ordered, "lru").prev?.slug).toBe("elevator");
    expect(neighbours(ordered, "lru").next?.slug).toBe("vending");
  });
  it("sorts by difficulty then title", () => {
    expect(orderProblems(ROWS).map((r) => r.slug)).toEqual([
      "rate-limiter",
      "url-shortener",
      "chat-system",
      "news-feed",
      "web-crawler",
    ]);
  });
  it.each([
    ["rate-limiter", null, "url-shortener"],
    ["chat-system", "url-shortener", "news-feed"],
    ["web-crawler", "news-feed", null],
    ["missing", null, null],
  ])("%s → prev %s, next %s", (slug, prev, next) => {
    const n = neighbours(orderProblems(ROWS), slug);
    expect(n.prev?.slug ?? null).toBe(prev);
    expect(n.next?.slug ?? null).toBe(next);
  });
  it("handles an empty list", () => {
    expect(neighbours([], "x")).toEqual({ prev: null, next: null });
  });
});

describe("groupProblems / matchesQuery", () => {
  it.each([
    ["", ALL],
    ["  ", ALL],
    ["CACHING", [["easy", 2, 2]]],
    ["url short", [["easy", 1, 2]]],
    ["feed", [["medium", 1, 2]]],
    ["nothing-matches", []],
  ])("query %j", (query, want) => {
    const got = groupProblems(ROWS, query).map((g) => [g.difficulty, g.rows.length, g.total]);
    expect(got).toEqual(want);
  });
  it("keeps titles sorted inside a group", () => {
    expect(groupProblems(ROWS, "")[0]?.rows.map((r) => r.slug)).toEqual([
      "rate-limiter",
      "url-shortener",
    ]);
  });
  it("matches on slug and topic ids; every word must match", () => {
    const crawler = ROWS[0]!;
    expect(matchesQuery(crawler, "queues")).toBe(true);
    expect(matchesQuery(crawler, "web-crawler")).toBe(true);
    expect(matchesQuery(crawler, "web redis")).toBe(false);
  });
});

describe("shortTitle", () => {
  it.each([
    ["Design a rate limiter", "Rate limiter"],
    ["Design an elevator system", "Elevator system"],
    ["Design the news feed", "News feed"],
    ["Parking lot", "Parking lot"],
    ["Design", "Design"],
  ])("%s → %s", (title, want) => {
    expect(shortTitle(title)).toBe(want);
  });
});

describe("stageSteps", () => {
  it("counts checks per stage and marks decompose → reduce", () => {
    const steps = stageSteps(
      ["scope", "parts", "high-level", "wrap-up"],
      [{ stage: "scope" }, { stage: "parts" }, { stage: "parts" }, { stage: "deep-dives" }],
    );
    expect(steps).toEqual([
      { stage: "scope", checks: 1, core: false },
      { stage: "parts", checks: 2, core: true },
      { stage: "high-level", checks: 0, core: true },
      { stage: "wrap-up", checks: 0, core: false },
    ]);
  });
  it("marks no core without a decompose stage (OOD)", () => {
    const steps = stageSteps(["scope", "high-level", "signatures"], []);
    expect(steps.some((s) => s.core)).toBe(false);
  });
});

describe("reveal gate", () => {
  it.each([
    [[], false, true],
    [[], true, false],
    [[{ submitted: false }], false, true],
    [[{ submitted: false }, { submitted: true }], false, false],
  ])("attempts %j revealed=%s → gate %s", (attempts, revealed, want) => {
    expect(needsGate(attempts, revealed)).toBe(want);
  });
  it("practice continues the newest attempt", () => {
    expect(latestAttempt([{ name: "a" }, { name: "b" }])?.name).toBe("b");
    expect(latestAttempt([])).toBeNull();
  });
});

describe("parseDiagramFence", () => {
  it.each([
    ["v2", { kind: "version", version: 2 }],
    [" v10 \n", { kind: "version", version: 10 }],
    ["part:P1", { kind: "part", id: "P1" }],
    ["part: P3", { kind: "part", id: "P3" }],
    ["v", null],
    ["version 2", null],
    ["part:", null],
    ["", null],
  ])("%j", (body, want) => {
    expect(parseDiagramFence(body)).toEqual(want);
  });
  it("finds the versions a walkthrough fences", () => {
    const md = "## A\n```diagram\nv1\n```\ntext\n```diagram\npart:P1\n```\n```diagram\nv3\n```\n";
    expect([...fencedVersions(md)]).toEqual([1, 3]);
    expect(fencedVersions("```\nv1\n```").size).toBe(0);
  });
});

describe("addedInVersion", () => {
  const d = (version: number, nodes: string[], edges: [string, string][]): Diagram => ({
    version,
    why: "",
    nodes: nodes.map((id) => ({ id, kind: "service" })),
    edges: edges.map(([from, to]) => ({ from, to })),
  });
  const ds = [
    d(
      2,
      ["a", "b", "c"],
      [
        ["a", "b"],
        ["b", "c"],
      ],
    ),
    d(1, ["a", "b"], [["a", "b"]]),
  ];
  it("marks nothing on the first version", () => {
    const got = addedInVersion(ds, 1);
    expect([...got.nodes]).toEqual([]);
    expect([...got.edges]).toEqual([]);
  });
  it("diffs against the previous version by number, not array order", () => {
    const got = addedInVersion(ds, 2);
    expect([...got.nodes]).toEqual(["c"]);
    expect([...got.edges]).toEqual(["b->c"]);
  });
  it("returns nothing for an unknown version", () => {
    expect(addedInVersion(ds, 9).nodes.size).toBe(0);
  });
  it("builds a part diagram as version 1 with no why", () => {
    const nodes = [{ id: "x", kind: "cache" }];
    expect(partDiagram({ diagram: { nodes, edges: [] } })).toEqual({
      version: 1,
      why: "",
      nodes,
      edges: [],
    });
  });
});

describe("chips", () => {
  const names = { redis: "Redis", "hot-keys": "Hot keys" };
  it.each([
    ["redis", "#/topic/system-design/redis"],
    ["hot-keys", "#/topic/system-design/hot-keys"],
    ["unknown-tech", null],
    ["toString", null],
  ])("%s → %s", (id, want) => {
    expect(topicHref("system-design", id, names)).toBe(want);
  });
  it("labels unknown ids readably", () => {
    expect(chipLabel("redis", names)).toBe("Redis");
    expect(chipLabel("zookeeper-etcd", names)).toBe("Zookeeper etcd");
  });
});

describe("scroll helpers", () => {
  it.each([
    [0, 1000, 500, 0],
    [250, 1000, 500, 0.5],
    [600, 1000, 500, 1],
    [0, 400, 500, 1],
  ])("progress(%d, %d, %d) = %d", (top, height, client, want) => {
    expect(readingProgress(top, height, client)).toBe(want);
  });
  it.each([
    [[100, 400, 900], 0, false, -1],
    [[100, 400, 900], 30, false, 0],
    [[100, 400, 900], 350, false, 1],
    [[100, 400, 900], 350, true, 2],
    [[], 0, false, -1],
  ])("active(%j, top %d, bottom %s) = %d", (tops, top, bottom, want) => {
    expect(activeHeading(tops, top, 80, bottom)).toBe(want);
  });
});

describe("navKey", () => {
  it.each([
    [{ key: "[" }, "prev"],
    [{ key: "]" }, "next"],
    [{ key: "]", metaKey: true }, null],
    [{ key: "[", ctrlKey: true }, null],
    [{ key: "j" }, null],
  ])("%j → %s", (e, want) => {
    expect(navKey(e)).toBe(want);
  });
});
