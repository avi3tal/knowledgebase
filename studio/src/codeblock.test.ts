import { describe, expect, it } from "vitest";
import {
  groupConsecutive,
  isPlainLang,
  langLabel,
  parseMeta,
  rehypeCodeTabs,
  type HastLike,
} from "./codeblock";

describe("parseMeta", () => {
  it("parses title, ranges, group and line numbers", () => {
    expect(parseMeta('title="lru.py" {3,5-7} group="impl" showLineNumbers')).toEqual({
      title: "lru.py",
      highlight: [3, 5, 6, 7],
      group: "impl",
      lineNumbers: true,
    });
  });
  it("handles empty, single quotes and bad ranges", () => {
    expect(parseMeta(undefined)).toEqual({
      title: undefined,
      highlight: [],
      group: undefined,
      lineNumbers: false,
    });
    expect(parseMeta("title='a b.go' {7-3,2}").highlight).toEqual([2]);
    expect(parseMeta("title='a b.go'").title).toBe("a b.go");
  });
});

describe("groupConsecutive", () => {
  it("groups runs with the same group only", () => {
    const a = { id: 1, group: "x" };
    const b = { id: 2, group: "x" };
    const c = { id: 3, group: undefined };
    const d = { id: 4, group: "y" };
    const e = { id: 5, group: "x" };
    expect(groupConsecutive([a, b, c, d, e])).toEqual([[a, b], c, d, e]);
  });
});

describe("labels", () => {
  it("plain languages and labels", () => {
    expect(isPlainLang("pseudo")).toBe(true);
    expect(isPlainLang("python")).toBe(false);
    expect(langLabel("py")).toBe("Python");
    expect(langLabel("rust")).toBe("rust");
  });
});

describe("rehypeCodeTabs", () => {
  const pre = (group?: string): HastLike => ({
    type: "element",
    tagName: "pre",
    children: [
      {
        type: "element",
        tagName: "code",
        data: { meta: group ? `group="${group}"` : "" },
        children: [],
      },
    ],
  });
  const ws: HastLike = { type: "text", value: "\n" };
  it("wraps consecutive pres of one group", () => {
    const root: HastLike = { type: "root", children: [pre("g"), ws, pre("g"), ws, pre()] };
    rehypeCodeTabs()(root);
    expect(root.children?.map((c) => c.tagName)).toEqual(["codetabs", undefined, "pre"]);
    expect(root.children?.[0]?.children).toHaveLength(2);
  });
  it("leaves a lone grouped pre alone", () => {
    const root: HastLike = { type: "root", children: [pre("g"), ws, pre("h")] };
    rehypeCodeTabs()(root);
    expect(root.children?.map((c) => c.tagName)).toEqual(["pre", undefined, "pre"]);
  });
});
