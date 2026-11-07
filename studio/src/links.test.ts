import { describe, expect, it } from "vitest";
import { linkTarget, resolveRepoPath } from "./links";
import { designHref, parseRoute, problemHref, tabOf } from "./route";

describe("design routes", () => {
  it.each([
    [
      "#/design/system-design/url-shortener",
      { page: "design", subject: "system-design", slug: "url-shortener" },
    ],
    [
      "#/design/system-design/url-shortener/2026-11-07_design_practice-2",
      {
        page: "console",
        subject: "system-design",
        slug: "url-shortener",
        attempt: "2026-11-07_design_practice-2",
      },
    ],
    ["#/design/ood/parking-lot", { page: "design", subject: "ood", slug: "parking-lot" }],
    ["#/design/system-design/url-shortener/..", { page: "home", subject: "system-design" }],
    ["#/design/system-design/url-shortener/a.b", { page: "home", subject: "system-design" }],
    ["#/design/system-design/../x", { page: "home", subject: "algo" }],
    ["#/design/Bad/x", { page: "home", subject: "algo" }],
  ])("parses %s", (hash, want) => {
    expect(parseRoute(hash)).toEqual(want);
  });

  it("builds hrefs and links design subjects to the console", () => {
    expect(designHref("ood", "parking-lot")).toBe("#/design/ood/parking-lot");
    expect(designHref("system-design", "x", "2026_a")).toBe("#/design/system-design/x/2026_a");
    expect(problemHref("system-design", "x")).toBe("#/design/system-design/x");
    expect(problemHref("ood", "x")).toBe("#/design/ood/x");
    expect(problemHref("algo", "two-sum")).toBe("#/problem/algo/two-sum");
  });

  it("routes markdown links to design problems into the design page", () => {
    const from = "system-design/learn/caching/01-intro.md";
    expect(linkTarget(from, "../../problems/url-shortener/README.md", "/r")).toEqual({
      kind: "route",
      href: "#/design/system-design/url-shortener",
    });
  });
});

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
    ["", { page: "home", subject: "algo" }],
    ["#/learn/algo/sliding-window", { page: "lesson", subject: "algo", topic: "sliding-window" }],
    ["#/problem/algo/two-sum", { page: "problem", subject: "algo", slug: "two-sum" }],
    ["#/learn/algo/../../etc", { page: "home", subject: "algo" }],
    ["#/home/ood", { page: "home", subject: "ood" }],
    ["#/progress/algo", { page: "dashboard", subject: "algo" }],
  ])("parses %s", (hash, want) => {
    expect(parseRoute(hash)).toEqual(want);
  });
});

describe("tabs", () => {
  it.each([
    ["#/home/algo", "learn"],
    ["#/learn/algo/sliding-window", "learn"],
    ["#/topic/ood/solid", "learn"],
    ["#/problem/algo/two-sum", "problems"],
    ["#/problems/algo", "problems"],
    ["#/map/system-design", "map"],
    ["#/progress/algo", "progress"],
    ["#/design/system-design/url-shortener", "problems"],
    ["#/design/system-design/url-shortener/2026-11-07_design_practice", "problems"],
  ])("%s belongs to the %s tab", (hash, tab) => {
    expect(tabOf(parseRoute(hash))).toBe(tab);
  });
});

describe("session routes", () => {
  it("parses sessions pages into their own tab", () => {
    expect(parseRoute("#/sessions")).toEqual({ page: "sessions", subject: "algo" });
    expect(parseRoute("#/session/2026-11-07-x")).toEqual({
      page: "session",
      subject: "algo",
      id: "2026-11-07-x",
    });
    expect(tabOf(parseRoute("#/session/abc"))).toBe("sessions");
    expect(parseRoute("#/session/../x").page).toBe("home");
  });
});
