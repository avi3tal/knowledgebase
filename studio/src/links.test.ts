import { describe, expect, it } from "vitest";
import { linkTarget, resolveRepoPath } from "./links";
import { parseRoute } from "./route";

describe("links", () => {
  const md = "algo/problems/two-sum/README.md";
  it.each([
    ["../../notes/patterns.md", "algo/notes/patterns.md"],
    ["../pair-with-target-sum/README.md", "algo/problems/pair-with-target-sum/README.md"],
    ["./cases.json", "algo/problems/two-sum/cases.json"],
  ])("resolves %s", (href, want) => {
    expect(resolveRepoPath(md, href)).toBe(want);
  });

  it("routes lessons, problems, files and externals", () => {
    expect(linkTarget(md, "../../learn/sliding-window/01-intro.md", "/r")).toEqual({
      kind: "route",
      href: "#/learn/algo/sliding-window",
    });
    expect(linkTarget(md, "../contains-duplicate/README.md", "/r")).toEqual({
      kind: "route",
      href: "#/problem/algo/contains-duplicate",
    });
    expect(linkTarget(md, "../../notes/patterns.md", "/r")).toEqual({
      kind: "file",
      href: "vscode://file/r/algo/notes/patterns.md",
      path: "algo/notes/patterns.md",
    });
    expect(linkTarget(md, "https://x.dev", "/r").kind).toBe("external");
  });
});

describe("routes", () => {
  it.each([
    ["", { page: "dashboard", subject: "algo" }],
    ["#/learn/algo/sliding-window", { page: "lesson", subject: "algo", topic: "sliding-window" }],
    ["#/problem/algo/two-sum", { page: "problem", subject: "algo", slug: "two-sum" }],
    ["#/learn/algo/../../etc", { page: "dashboard", subject: "algo" }],
  ])("parses %s", (hash, want) => {
    expect(parseRoute(hash)).toEqual(want);
  });
});
