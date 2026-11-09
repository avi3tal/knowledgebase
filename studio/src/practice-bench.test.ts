import { describe, expect, it } from "vitest";
import type { Feedback, ProblemRow, Session, TopicFeedback } from "./api";
import {
  stripReadmeHead,
  countByDifficulty,
  countByTopic,
  countStatus,
  hashSegments,
  keepTab,
  masteryIcon,
  nextToPractise,
  pct,
  problemTabHref,
  problemTabOf,
  problemsFilterOf,
  problemsHref,
  progressHref,
  progressTotals,
  progressViewOf,
  rankTopics,
  readmeSources,
  recentlyPractised,
  runState,
  sessionsSummary,
  splitReadme,
  withSession,
} from "./practice-bench";
import { parseRoute } from "./route";
import { extractToc } from "./toc";

const row = (
  slug: string,
  difficulty: ProblemRow["difficulty"],
  topics: string[],
  status: ProblemRow["status"],
): ProblemRow => ({
  slug,
  title: slug,
  difficulty,
  patterns: topics,
  topics,
  sources: [],
  attempts: 0,
  status,
  legacy_failing: false,
  complexity_miss: false,
});

describe("hash segments", () => {
  it("splits and decodes", () => {
    expect(hashSegments("#/problems/algo/two-pointers")).toEqual([
      "problems",
      "algo",
      "two-pointers",
    ]);
  });
});

describe("problems filter in the hash", () => {
  it.each([
    [{ topic: "", difficulty: "" }, "#/problems/algo"],
    [{ topic: "two-pointers", difficulty: "" }, "#/problems/algo/two-pointers"],
    [{ topic: "", difficulty: "hard" }, "#/problems/algo/all/hard"],
    [{ topic: "graphs", difficulty: "easy" }, "#/problems/algo/graphs/easy"],
  ] as const)("round-trips %o", (f, href) => {
    expect(problemsHref("algo", f)).toBe(href);
    expect(problemsFilterOf(href)).toEqual(f);
    // route.ts ignores the extra segments: still the problems page
    expect(parseRoute(href)).toEqual({ page: "problems", subject: "algo" });
  });
  it("drops junk", () => {
    expect(problemsFilterOf("#/problems/algo/BAD!/extreme")).toEqual({
      topic: "",
      difficulty: "",
    });
  });
});

const rows = [
  row("a", "easy", ["arrays"], "solved"),
  row("b", "medium", ["arrays", "graphs"], "failing"),
  row("c", "hard", ["graphs"], "untried"),
  row("d", "easy", ["graphs"], "untried"),
  row("e", "easy", ["arrays"], "untried"),
  row("f", "medium", ["dp"], "untried"),
];

describe("counts", () => {
  it("counts by status, difficulty and topic", () => {
    expect(countStatus(rows)).toEqual({ total: 6, solved: 1, failing: 1, untried: 4 });
    expect(countByDifficulty(rows).easy).toEqual({ total: 3, solved: 1, failing: 0, untried: 2 });
    expect(countByTopic(rows).get("graphs")).toEqual({
      total: 3,
      solved: 0,
      failing: 1,
      untried: 2,
    });
  });
  it("pct", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(1, 0)).toBe(0);
  });
});

describe("nextToPractise", () => {
  it("picks untried problems of the weakest topics first, easiest first", () => {
    // graphs: 1 failing of 3, none solved → weaker than arrays (1 solved, 1 failing of 3)
    expect(nextToPractise(rows, 4).map((x) => [x.row.slug, x.topic])).toEqual([
      ["d", "graphs"],
      ["c", "graphs"],
      ["e", "arrays"],
      ["f", null],
    ]);
  });
  it("falls back to the easiest untried when nothing is practised", () => {
    const fresh = [row("x", "hard", ["t"], "untried"), row("y", "easy", ["t"], "untried")];
    expect(nextToPractise(fresh).map((x) => [x.row.slug, x.topic])).toEqual([
      ["y", null],
      ["x", null],
    ]);
  });
});

const README = `# Two Sum

> Difficulty: **easy** · Patterns: hashmap · Sources: [leetcode](https://leetcode.com/problems/two-sum/), interview:acme

## Problem
Find two.

## Examples
- one

## Pattern & how to recognise it
- hash map

## Hints
<details><summary>Hint 1</summary>
x
</details>

\`\`\`
## not a heading
\`\`\`

## Approach (spoiler)
Single pass.

## Follow-ups
- sorted input
`;

describe("README split", () => {
  it("keeps the statement apart from the learning sections, without title and meta", () => {
    const { problem, learn } = splitReadme(README);
    expect(problem.startsWith("## Problem")).toBe(true);
    expect(extractToc(problem).map((t) => t.text)).toEqual(["Problem", "Examples", "Follow-ups"]);
    expect(extractToc(learn).map((t) => t.text)).toEqual([
      "Pattern & how to recognise it",
      "Hints",
      "Approach (spoiler)",
    ]);
    expect(learn).toContain("## not a heading");
    expect(problem).not.toContain("Difficulty:");
  });
  it("has no learning part when the README has no such sections", () => {
    expect(splitReadme("# T\n\n## Problem\nx").learn).toBe("");
  });
  it("reads the sources of the meta line", () => {
    expect(readmeSources(README)).toEqual([
      { name: "leetcode", url: "https://leetcode.com/problems/two-sum/" },
      { name: "interview:acme", url: null },
    ]);
    expect(readmeSources("# T")).toEqual([]);
  });
});

describe("problem tabs", () => {
  it("round-trips the tab in the hash", () => {
    expect(problemTabHref("algo", "two-sum", "problem")).toBe("#/problem/algo/two-sum");
    expect(problemTabHref("algo", "two-sum", "attempts")).toBe("#/problem/algo/two-sum/attempts");
    expect(problemTabOf("#/problem/algo/two-sum/attempts")).toBe("attempts");
    expect(problemTabOf("#/problem/algo/two-sum/nope")).toBe("problem");
    expect(parseRoute("#/problem/algo/two-sum/learn")).toEqual({
      page: "problem",
      subject: "algo",
      slug: "two-sum",
    });
  });
  it("falls back to Problem when the next problem lacks the tab", () => {
    expect(keepTab("resources", ["problem", "attempts"])).toBe("problem");
    expect(keepTab("attempts", ["problem", "attempts"])).toBe("attempts");
  });
  it.each([
    [null, "none"],
    [{ passed: 3, total: 3, error: false }, "ok"],
    [{ passed: 2, total: 3, error: false }, "fail"],
    [{ passed: 0, total: 0, error: true }, "fail"],
  ] as const)("run %o → %s", (r, want) => {
    expect(runState(r)).toBe(want);
  });
});

const topic = (
  id: string,
  statuses: ProblemRow["status"][],
  extra: Partial<TopicFeedback> = {},
): TopicFeedback => {
  const counts = { solved: 0, failing: 0, untried: 0 };
  for (const s of statuses) counts[s]++;
  return {
    id,
    name: id,
    kind: "pattern",
    has_lesson: false,
    problems: statuses.map((status, i) => ({
      slug: `${id}-${i}`,
      title: `${id} ${i}`,
      difficulty: "easy",
      status,
      complexity_miss: false,
      legacy_failing: false,
      last_practiced: status === "untried" ? null : `2026-11-0${i + 1}`,
    })),
    counts,
    quiz_accuracy: null,
    last_practiced: null,
    review_due: null,
    advice: [],
    ...extra,
  };
};

describe("progress", () => {
  it("round-trips the view in the hash", () => {
    expect(progressHref("algo", { group: "", topic: "" })).toBe("#/progress/algo");
    expect(progressHref("algo", { group: "pattern", topic: "" })).toBe("#/progress/algo/pattern");
    expect(progressHref("algo", { group: "", topic: "dp" })).toBe("#/progress/algo/all/dp");
    expect(progressViewOf("#/progress/algo/all/dp")).toEqual({ group: "", topic: "dp" });
    expect(parseRoute("#/progress/algo/pattern/dp")).toEqual({
      page: "dashboard",
      subject: "algo",
    });
  });
  it("mastery icons", () => {
    expect(masteryIcon(topic("a", ["solved", "solved"]))).toBe("●");
    expect(masteryIcon(topic("a", ["solved", "untried"]))).toBe("◐");
    expect(masteryIcon(topic("a", ["untried"]))).toBe("○");
    expect(masteryIcon(topic("a", []))).toBe("○");
  });
  const data: Feedback = {
    subject: "algo",
    today: "2026-11-07",
    unmapped_tags: [],
    topics: [
      topic("strong", ["solved", "solved"], { quiz_accuracy: 1, has_lesson: true }),
      topic("mid", ["solved", "failing", "untried"], { quiz_accuracy: 0.5 }),
      topic("weak", ["failing", "untried"], { review_due: "2026-11-01" }),
      topic("new", ["untried"]),
      topic("empty", []),
    ],
  };
  it("totals distinct problems", () => {
    expect(progressTotals(data)).toEqual({
      total: 8,
      solved: 3,
      failing: 2,
      untried: 3,
      topics: 4,
      lessons: 1,
      quiz: 0.75,
      due: 1,
    });
  });
  it("ranks practised topics", () => {
    const { strongest, weakest } = rankTopics(data.topics);
    expect(strongest.map((t) => t.id)).toEqual(["strong", "mid"]);
    expect(weakest.map((t) => t.id)).toEqual(["weak", "mid"]);
  });
  it("lists recently practised problems newest first", () => {
    expect(recentlyPractised(data, 2).map((p) => p.last_practiced)).toEqual([
      "2026-11-02",
      "2026-11-02",
    ]);
    expect(recentlyPractised(data).length).toBe(5);
  });
});

describe("sessions", () => {
  const s = (id: string, status: Session["status"], score: number | null, completion: number) =>
    ({ id, status, score, completion }) as Session;
  it("replaces or adds the live session", () => {
    const list = [s("a", "planned", null, 0), s("b", "done", 80, 1)];
    expect(withSession(list, s("a", "active", 10, 0.5)).map((x) => x.status)).toEqual([
      "active",
      "done",
    ]);
    expect(withSession(list, s("c", "planned", null, 0)).map((x) => x.id)).toEqual(["c", "a", "b"]);
  });
  it("summarises", () => {
    expect(
      sessionsSummary([
        s("a", "active", 50, 0.5),
        s("b", "done", 91, 1),
        s("c", "abandoned", null, 0),
      ]),
    ).toEqual({ total: 3, active: 1, done: 1, average: 71, completion: 0.75 });
    expect(sessionsSummary([]).average).toBeNull();
  });
});

describe("stripReadmeHead", () => {
  it("drops the title and the difficulty meta line", () => {
    expect(stripReadmeHead("# T\n\n> Difficulty: **easy** · x\n\nBody\n# Not first")).toBe(
      "Body\n# Not first",
    );
  });
  it("keeps a README without a head", () => {
    expect(stripReadmeHead("Body")).toBe("Body");
  });
});
