import { describe, expect, it } from "vitest";
import { extractToc, slugify, uniqueId } from "./toc";

describe("slugify", () => {
  it.each([
    ["What makes it distinctive", "what-makes-it-distinctive"],
    ["4. Decompose: the parts", "4-decompose-the-parts"],
    ["Part P1: Short code (F1, N3)", "part-p1-short-code-f1-n3"],
    ["`GET /{code}` path", "get-code-path"],
    ["  --Trim--  ", "trim"],
  ])("%j → %s", (text, want) => {
    expect(slugify(text)).toBe(want);
  });
});

describe("extractToc", () => {
  it("collects h2/h3 in order with levels", () => {
    const md = "# Title\n## One\ntext\n### Sub\n#### Deep\n## Two ##\n";
    expect(extractToc(md)).toEqual([
      { level: 2, text: "One", id: "one" },
      { level: 3, text: "Sub", id: "sub" },
      { level: 2, text: "Two", id: "two" },
    ]);
  });
  it("numbers duplicate ids like the renderer", () => {
    const md = "## Options\n### Options\n## Options\n";
    expect(extractToc(md).map((t) => t.id)).toEqual(["options", "options-2", "options-3"]);
  });
  it("ignores headings inside fenced code", () => {
    const md = "## Real\n```md\n## Not a heading\n```\n```diagram\nv1\n```\n## After\n";
    expect(extractToc(md).map((t) => t.text)).toEqual(["Real", "After"]);
  });
  it("strips inline markup from the text", () => {
    expect(extractToc("## The `GET` **hot** path\n")).toEqual([
      { level: 2, text: "The GET hot path", id: "the-get-hot-path" },
    ]);
  });
  it("needs a space after the hashes", () => {
    expect(extractToc("##NoSpace\n")).toEqual([]);
  });
});

describe("uniqueId", () => {
  it("suffixes repeats", () => {
    const seen = new Map<string, number>();
    expect([uniqueId("a", seen), uniqueId("a", seen), uniqueId("b", seen)]).toEqual([
      "a",
      "a-2",
      "b",
    ]);
  });
});
