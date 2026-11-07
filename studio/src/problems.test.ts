import { describe, expect, it } from "vitest";
import type { ProblemRow } from "./api";
import { filterProblems } from "./components/ProblemsPage";
import { parseRoute } from "./route";

const row = (
  slug: string,
  difficulty: ProblemRow["difficulty"],
  topics: string[],
  status: ProblemRow["status"],
): ProblemRow => ({
  slug,
  title: slug.replace(/-/g, " "),
  difficulty,
  patterns: topics,
  topics,
  sources: [],
  attempts: 0,
  status,
  legacy_failing: false,
  complexity_miss: false,
});

const rows = [
  row("three-sum", "medium", ["two-pointers"], "untried"),
  row("two-sum", "easy", ["two-pointers", "arrays-hashing"], "solved"),
  row("trapping-rain-water", "hard", ["two-pointers"], "failing"),
  row("min-window", "hard", ["sliding-window"], "untried"),
];
const none = { topic: "", difficulty: "", status: "", query: "" };

describe("filterProblems", () => {
  it("sorts easy → hard, then by title", () => {
    expect(filterProblems(rows, none).map((r) => r.slug)).toEqual([
      "two-sum",
      "three-sum",
      "min-window",
      "trapping-rain-water",
    ]);
  });
  it("filters by topic, difficulty, status and query", () => {
    expect(filterProblems(rows, { ...none, topic: "two-pointers" })).toHaveLength(3);
    expect(
      filterProblems(rows, { ...none, difficulty: "hard", topic: "two-pointers" }).map(
        (r) => r.slug,
      ),
    ).toEqual(["trapping-rain-water"]);
    expect(filterProblems(rows, { ...none, status: "solved" }).map((r) => r.slug)).toEqual([
      "two-sum",
    ]);
    expect(filterProblems(rows, { ...none, query: "RAIN" }).map((r) => r.slug)).toEqual([
      "trapping-rain-water",
    ]);
  });
  it("routes #/problems/<subject>", () => {
    expect(parseRoute("#/problems/algo")).toEqual({ page: "problems", subject: "algo" });
  });
});

describe("progress groups", () => {
  it("groups practised or taught topics of any subject by catalog group", async () => {
    const { progressGroups } = await import("./components/Dashboard");
    const fb = (id: string, problems: number, has_lesson: boolean) => ({
      id,
      name: id,
      kind: "concept",
      has_lesson,
      problems: Array.from({ length: problems }, () => ({}) as never),
      counts: { solved: 0, failing: 0, untried: problems },
      quiz_accuracy: null,
      last_practiced: null,
      review_due: null,
      advice: [],
    });
    const topic = (id: string, group: string) => ({
      id,
      name: id,
      kind: "concept",
      group,
      usage: "",
      ds: [],
      samples: [],
      has_lesson: false,
    });
    const groups = progressGroups(
      {
        subject: "system-design",
        today: "2026-11-07",
        unmapped_tags: [],
        topics: [fb("caching", 0, true), fb("url-shortener", 1, false), fb("cdn", 0, false)],
      },
      [
        topic("caching", "building-blocks"),
        topic("url-shortener", "case-studies"),
        topic("cdn", "building-blocks"),
      ],
    );
    expect(groups.map((g) => [g.group, g.tiles.map((t) => t.id)])).toEqual([
      ["building-blocks", ["caching"]],
      ["case-studies", ["url-shortener"]],
    ]);
  });
});
