import { describe, expect, it } from "vitest";
import type { ProblemRow, Subject, Topic } from "./api";
import { groupTopics, topicIcon } from "./catalog";
import { buildIndex, search } from "./search";

const topic = (id: string, name: string, extra: Partial<Topic> = {}): Topic => ({
  id,
  name,
  kind: "pattern",
  usage: `${name} usage`,
  ds: [],
  samples: [],
  has_lesson: false,
  ...extra,
});

const subjects: Subject[] = [
  {
    id: "algo",
    title: "Algorithms",
    status: "open",
    topics: [
      topic("sliding-window", "Sliding Window", { has_lesson: true, order: 1 }),
      topic("two-pointers", "Two Pointers", { order: 2 }),
      topic("arrays-hashing", "Arrays & Hashing", { kind: "fundamental" }),
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    status: "locked",
    topics: [topic("caching", "Caching", { kind: "concept", group: "building-blocks" })],
  },
];
const row = (slug: string, title: string): ProblemRow => ({
  slug,
  title,
  difficulty: "easy",
  patterns: [],
  topics: ["arrays-hashing"],
  sources: [],
  attempts: 1,
  status: "solved",
  legacy_failing: false,
  complexity_miss: false,
});
const index = buildIndex(subjects, { algo: [row("two-sum", "Two Sum")] });

describe("search", () => {
  it("indexes topics of every subject and problems", () => {
    expect(index.map((i) => `${i.kind}:${i.id}`)).toEqual([
      "topic:sliding-window",
      "topic:two-pointers",
      "topic:arrays-hashing",
      "problem:two-sum",
      "topic:caching",
    ]);
    expect(index.find((i) => i.id === "caching")?.locked).toBe(true);
  });
  it("links topics to their lesson when there is one, else the topic page", () => {
    expect(index.find((i) => i.id === "sliding-window")?.href).toBe("#/learn/algo/sliding-window");
    expect(index.find((i) => i.id === "caching")?.href).toBe("#/topic/system-design/caching");
  });
  it("ranks title prefixes first and requires every term", () => {
    expect(search(index, "two").map((i) => i.id)).toEqual(["two-pointers", "two-sum"]);
    expect(search(index, "two sum").map((i) => i.id)).toEqual(["two-sum"]);
    expect(search(index, "cach").map((i) => i.id)).toEqual(["caching"]);
    expect(search(index, "  ")).toEqual([]);
    expect(search(index, "zzz")).toEqual([]);
  });
});

describe("catalog presentation", () => {
  it("groups patterns before fundamentals with distinct colours, ordered by catalog order", () => {
    const groups = groupTopics(subjects[0]!.topics);
    expect(groups.map((g) => g.group)).toEqual(["pattern", "fundamental"]);
    expect(groups[0]!.topics.map((t) => t.id)).toEqual(["sliding-window", "two-pointers"]);
    expect(groups[0]!.color).not.toBe(groups[1]!.color);
  });
  it("falls back to the group icon", () => {
    expect(topicIcon(topic("sliding-window", "x"))).toBe("🪟");
    expect(topicIcon(topic("nope", "x", { group: "genai" }))).toBe("🤖");
  });
});
