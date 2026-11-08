import { describe, expect, it } from "vitest";
import type { Block, Feedback, Graph, Topic, TopicFeedback } from "./api";
import {
  bestHref,
  edgePath,
  groupByRole,
  homeStats,
  lessonSections,
  lessonToc,
  linkedTo,
  mapLabel,
  nodeRadius,
  prevNext,
  ringLayout,
  sectionOf,
  suggestions,
  topicCounts,
  topicEdges,
  topicNavGroups,
  topicStateOf,
} from "./learn-bench";
import type { Trace } from "./trace";

const topic = (id: string, kind: string, has_lesson: boolean, order?: number): Topic => ({
  id,
  name: id.toUpperCase(),
  kind,
  usage: `${id} usage`,
  ds: [],
  samples: [],
  has_lesson,
  order,
});

// groupTopics puts "pattern" before "fundamental" and sorts by order inside a group.
const TOPICS = [
  topic("arrays", "fundamental", true, 1),
  topic("sliding-window", "pattern", true, 2),
  topic("two-pointers", "pattern", false, 1),
  topic("heaps", "fundamental", false, 2),
  topic("bfs", "pattern", true, 3),
];

const fbTopic = (id: string, over: Partial<TopicFeedback> = {}): TopicFeedback => ({
  id,
  name: id.toUpperCase(),
  kind: "pattern",
  has_lesson: true,
  problems: [],
  counts: { solved: 0, failing: 0, untried: 0 },
  quiz_accuracy: null,
  last_practiced: null,
  review_due: null,
  advice: [],
  ...over,
});

const prob = (slug: string, status: "solved" | "failing" | "untried") => ({
  slug,
  title: slug,
  difficulty: "easy",
  status,
  complexity_miss: false,
  legacy_failing: false,
  last_practiced: null,
});

describe("topicNavGroups + prevNext", () => {
  it("groups in teaching order and marks lessons / current", () => {
    const g = topicNavGroups(TOPICS, { current: "bfs", href: (t) => bestHref("algo", t) });
    expect(g.map((x) => [x.key, x.items.map((i) => i.id)])).toEqual([
      ["pattern", ["two-pointers", "sliding-window", "bfs"]],
      ["fundamental", ["arrays", "heaps"]],
    ]);
    const tp = g[0]!.items[0]!;
    expect([tp.href, tp.icon, tp.muted]).toEqual(["#/topic/algo/two-pointers", "🧪", true]); // no lesson, practice available
    expect(g[0]!.items[2]!.current).toBe(true);
    expect(g[0]!.items[2]!.href).toBe("#/learn/algo/bfs");
  });

  it("lessonsOnly drops topics without a lesson and empty groups", () => {
    const g = topicNavGroups(
      TOPICS.filter((t) => t.kind === "pattern" || t.has_lesson),
      { lessonsOnly: true, href: (t) => t.id },
    );
    expect(g.flatMap((x) => x.items.map((i) => i.id))).toEqual(["sliding-window", "bfs", "arrays"]);
  });

  it.each([
    ["sliding-window", null, "bfs", 0],
    ["bfs", "sliding-window", "arrays", 1],
    ["arrays", "bfs", null, 2],
    ["nope", null, null, -1],
  ])("prev/next of %s crosses groups", (id, prev, next, index) => {
    const g = topicNavGroups(TOPICS, { lessonsOnly: true, href: (t) => t.id });
    const pn = prevNext(g, id);
    expect([pn.prev?.id ?? null, pn.next?.id ?? null, pn.index, pn.total]).toEqual([
      prev,
      next,
      index,
      3,
    ]);
  });
});

const trace = { title: "Fixed window" } as Trace;
const BLOCKS: Block[] = [
  { type: "markdown", text: "# T\n\n## Intro\n\n### Why\n", path: "a.md" },
  { type: "trace", id: "t1", trace },
  { type: "markdown", text: "## Intro\n\n```\n## not a heading\n```\n", path: "b.md" },
  { type: "quiz", items: [{ id: "q1", prompt: "?", options: ["a"] }] },
  { type: "problems", problems: [] },
  { type: "resources", resources: [] },
];

describe("lessonSections", () => {
  it("maps block types to sections", () => {
    expect(BLOCKS.map(sectionOf)).toEqual([
      "learn",
      "learn",
      "learn",
      "quiz",
      "practice",
      "resources",
    ]);
  });

  it("keeps traces with their prose and drops empty sections", () => {
    const s = lessonSections(BLOCKS);
    expect(s.map((x) => [x.key, x.blocks, x.count])).toEqual([
      ["learn", [0, 1, 2], 1],
      ["quiz", [3], 1],
    ]);
  });

  it("is a single section for prose-only lessons", () => {
    expect(lessonSections([BLOCKS[0]!]).map((x) => x.key)).toEqual(["learn"]);
    expect(lessonSections([])).toEqual([]);
  });
});

describe("lessonToc", () => {
  it("dedupes ids per markdown block (like each <Markdown anchors>) and adds block anchors", () => {
    expect(lessonToc(BLOCKS)).toEqual([
      { level: 2, text: "Intro", id: "intro" },
      { level: 3, text: "Why", id: "why" },
      { level: 3, text: "▶ Fixed window", id: "lb-block-1" },
      { level: 2, text: "Intro", id: "intro" },
      { level: 2, text: "Quiz", id: "lb-block-3" },
      { level: 2, text: "Practice", id: "lb-block-4" },
      { level: 2, text: "Go deeper", id: "lb-block-5" },
    ]);
  });

  it("limits to the given blocks", () => {
    expect(lessonToc(BLOCKS, [3]).map((t) => t.id)).toEqual(["lb-block-3"]);
  });
});

describe("suggestions", () => {
  const fb = (topics: TopicFeedback[]): Feedback => ({
    subject: "algo",
    today: "2026-11-07",
    topics,
    unmapped_tags: [],
  });

  it("is empty without feedback", () => {
    expect(suggestions(null, TOPICS)).toEqual({ next: [], weakest: [] });
  });

  it("puts due reviews first (oldest first), then untouched lessons in teaching order", () => {
    const s = suggestions(
      fb([
        fbTopic("arrays", { review_due: "2026-11-05", last_practiced: "x" }),
        fbTopic("bfs", { review_due: "2026-11-01", last_practiced: "x" }),
        fbTopic("heaps", { review_due: "2026-12-01" }),
        fbTopic("sliding-window"),
      ]),
      TOPICS,
    );
    expect(s.next.map((x) => [x.id, x.tone])).toEqual([
      ["bfs", "due"],
      ["arrays", "due"],
      ["sliding-window", "start"],
    ]);
  });

  it("ranks weakest by failing share or low quiz", () => {
    const s = suggestions(
      fb([
        fbTopic("a", { counts: { solved: 3, failing: 1, untried: 0 } }),
        fbTopic("b", { counts: { solved: 0, failing: 2, untried: 0 } }),
        fbTopic("c", { quiz_accuracy: 0.5 }),
        fbTopic("d", { quiz_accuracy: 0.9 }),
      ]),
      [],
    );
    expect(s.weakest.map((x) => [x.id, x.reason])).toEqual([
      ["b", "2 failing"],
      ["c", "quiz 50%"],
      ["a", "1 failing"],
    ]);
  });
});

describe("homeStats", () => {
  it("counts distinct problems across topics", () => {
    const f: Feedback = {
      subject: "algo",
      today: "2026-11-07",
      unmapped_tags: [],
      topics: [
        fbTopic("a", { problems: [prob("x", "solved"), prob("y", "failing")] }),
        fbTopic("b", { problems: [prob("x", "solved"), prob("z", "untried")] }),
      ],
    };
    expect(homeStats(TOPICS, f)).toEqual({
      topics: 5,
      lessons: 3,
      problems: 3,
      solved: 1,
      failing: 1,
    });
    expect(homeStats(TOPICS, null).problems).toBe(0);
  });
});

describe("knowledge map", () => {
  const graph: Graph = {
    subject: "algo",
    nodes: [],
    edges: [
      { from: "topic:arrays", to: "topic:sliding-window", type: "prereq" },
      { from: "topic:bfs", to: "topic:heaps", type: "related" },
      { from: "topic:heaps", to: "topic:bfs", type: "related" },
      { from: "topic:bfs", to: "topic:bfs", type: "related" },
      { from: "problem:p1", to: "topic:bfs", type: "practice" },
      { from: "topic:bfs", to: "problem:p2", type: "practice" },
      { from: "ref:r1", to: "topic:bfs", type: "covers" },
      { from: "ref:r1", to: "source:s", type: "from" },
    ],
  };

  it("counts problems and refs both ways", () => {
    expect(Object.fromEntries(topicCounts(graph))).toEqual({ bfs: { problems: 2, refs: 1 } });
  });

  it("keeps topic edges, dedupes related and drops self loops", () => {
    expect(topicEdges(graph)).toEqual([
      { from: "arrays", to: "sliding-window", type: "prereq" },
      { from: "bfs", to: "heaps", type: "related" },
    ]);
    expect([...linkedTo("bfs", topicEdges(graph))]).toEqual(["heaps"]);
  });

  it("places every topic on the ring, grouped, deterministically", () => {
    const a = ringLayout(TOPICS, topicCounts(graph));
    const b = ringLayout(TOPICS, topicCounts(graph));
    expect(a).toEqual(b);
    expect(a.nodes.map((n) => n.id)).toEqual([
      "two-pointers",
      "sliding-window",
      "bfs",
      "arrays",
      "heaps",
    ]);
    expect(a.arcs.map((x) => x.group)).toEqual(["pattern", "fundamental"]);
    const c = a.size / 2;
    for (const n of a.nodes) expect(Math.hypot(n.x - c, n.y - c)).toBeCloseTo(a.radius, 6);
    expect(a.nodes.find((n) => n.id === "bfs")?.problems).toBe(2);
    // first node starts near 12 o'clock
    expect(a.nodes[0]!.angle).toBeGreaterThan(-Math.PI / 2);
    expect(a.nodes[0]!.angle).toBeLessThan(0);
  });

  it("grows the ring with the topic count and leaves room for labels", () => {
    const many = Array.from({ length: 92 }, (_, i) => topic(`t${i}`, "pattern", false, i));
    const big = ringLayout(many);
    expect(big.radius).toBeGreaterThan(ringLayout(TOPICS).radius);
    // ≥ 20 units of arc per label
    expect((2 * Math.PI * big.radius) / 92).toBeGreaterThanOrEqual(20);
    expect(big.size).toBeGreaterThan(2 * big.radius);
    expect(ringLayout([])).toMatchObject({ nodes: [], arcs: [] });
  });

  it("edge paths bow towards the centre; labels and radii are bounded", () => {
    expect(edgePath({ x: 0, y: 100 }, { x: 200, y: 100 }, 100)).toBe("M0,100 Q100,100 200,100");
    expect(edgePath({ x: 100, y: 0 }, { x: 200, y: 100 }, 100)).toBe("M100,0 Q117.5,82.5 200,100");
    expect(mapLabel("short")).toBe("short");
    expect(mapLabel("In-place reversal of a linked list")).toHaveLength(22);
    expect(nodeRadius(0)).toBe(5);
    expect(nodeRadius(1000)).toBe(13);
  });
});

describe("topic states and roles", () => {
  it("falls back to has_lesson when the payload has no state", () => {
    expect(topicStateOf({ has_lesson: true })).toBe("lesson");
    expect(topicStateOf({ has_lesson: false })).toBe("practice-only");
    expect(topicStateOf({ has_lesson: false, state: "planned" })).toBe("planned");
  });

  it("disables planned topics in the nav, except the current one", () => {
    const topics = [
      { ...topic("a", "pattern", false, 1), state: "planned" as const },
      { ...topic("b", "pattern", false, 2), state: "planned" as const },
      { ...topic("c", "pattern", false, 3), state: "practice-only" as const },
    ];
    const items = topicNavGroups(topics, { current: "b", href: (t) => t.id }).flatMap(
      (g) => g.items,
    );
    expect(items.map((i) => [i.id, i.icon, Boolean(i.disabled)])).toEqual([
      ["a", "○", true],
      ["b", "○", false],
      ["c", "🧪", false],
    ]);
  });

  it("groups by role in a fixed order and drops empty roles", () => {
    const items = [
      { slug: "x", role: "pattern" as const },
      { slug: "y", role: "topic" as const },
      { slug: "z" },
    ];
    expect(groupByRole(items).map((g) => [g.role, g.items.map((i) => i.slug)])).toEqual([
      ["topic", ["y"]],
      ["pattern", ["x", "z"]],
    ]);
  });
});
