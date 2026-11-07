import { describe, expect, it } from "vitest";
import type { GraphEdge, GraphNode } from "./api";
import { VIEW, nodeHref, radialLayout, roleOf } from "./graph";
import { parseRoute } from "./route";

const n = (id: string, type: GraphNode["type"], label = id): GraphNode => ({ id, type, label });
const nodes = [
  n("topic:sliding-window", "topic", "Sliding Window"),
  n("topic:arrays-hashing", "topic", "Arrays & Hashing"),
  n("topic:two-pointers", "topic", "Two Pointers"),
  n("topic:next-one", "topic", "Next"),
  n("problem:two-sum", "problem", "Two Sum"),
  n("ref:algomaster:sw", "ref", "Sliding window lesson"),
  n("source:algomaster", "source", "AlgoMaster"),
];
const edges: GraphEdge[] = [
  { from: "topic:arrays-hashing", to: "topic:sliding-window", type: "prereq" },
  { from: "topic:sliding-window", to: "topic:next-one", type: "prereq" },
  { from: "topic:sliding-window", to: "topic:two-pointers", type: "related" },
  { from: "topic:sliding-window", to: "problem:two-sum", type: "practice" },
  { from: "ref:algomaster:sw", to: "topic:sliding-window", type: "covers" },
];

describe("knowledge graph layout", () => {
  const center = "topic:sliding-window";

  it("assigns roles from edges", () => {
    const roles = Object.fromEntries(nodes.map((x) => [x.id, roleOf(center, x, edges)]));
    expect(roles).toMatchObject({
      [center]: "center",
      "topic:arrays-hashing": "prereq",
      "topic:next-one": "next",
      "topic:two-pointers": "related",
      "problem:two-sum": "problem",
      "ref:algomaster:sw": "resource",
    });
  });

  it("places the centre in the middle, skips source nodes, stays inside the view", () => {
    const placed = radialLayout(center, nodes, edges);
    expect(placed.find((p) => p.id === center)).toMatchObject({ x: VIEW.cx, y: VIEW.cy });
    expect(placed.some((p) => p.type === "source")).toBe(false);
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(VIEW.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(VIEW.height);
    }
    // prerequisites above the centre, problems and resources below
    expect(placed.find((p) => p.role === "prereq")!.y).toBeLessThan(VIEW.cy);
    expect(placed.find((p) => p.role === "problem")!.y).toBeGreaterThan(VIEW.cy);
    expect(placed.find((p) => p.role === "resource")!.y).toBeGreaterThan(VIEW.cy);
  });

  it("is deterministic", () => {
    expect(radialLayout(center, nodes, edges)).toEqual(
      radialLayout(center, [...nodes].reverse(), edges),
    );
  });

  it("links nodes to pages", () => {
    expect(nodeHref("algo", n("topic:bfs", "topic"))).toBe("#/topic/algo/bfs");
    expect(nodeHref("algo", n("problem:two-sum", "problem"))).toBe("#/problem/algo/two-sum");
    expect(nodeHref("algo", { ...n("ref:x:y", "ref"), url: "https://x.dev" })).toBe(
      "https://x.dev",
    );
    expect(nodeHref("algo", n("source:x", "source"))).toBeNull();
  });

  it("routes topic and map pages", () => {
    expect(parseRoute("#/topic/system-design/caching")).toEqual({
      page: "topic",
      subject: "system-design",
      topic: "caching",
    });
    expect(parseRoute("#/map/ood")).toEqual({ page: "map", subject: "ood" });
  });
});
