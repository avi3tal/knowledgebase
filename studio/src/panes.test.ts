import { describe, expect, it } from "vitest";
import { filterGroups, navMatches } from "./components/panes";

describe("NavList filtering", () => {
  const groups = [
    {
      key: "a",
      label: "A",
      items: [{ id: "two-sum", title: "Two Sum", href: "#", hint: "hashmap" }],
    },
    { key: "b", label: "B", items: [{ id: "lru", title: "LRU Cache", href: "#" }] },
  ];
  it("matches every word against title, hint and id", () => {
    expect(navMatches(groups[0]!.items[0]!, "two hash")).toBe(true);
    expect(navMatches(groups[0]!.items[0]!, "two cache")).toBe(false);
  });
  it("drops empty groups and keeps totals", () => {
    const got = filterGroups(groups, "lru");
    expect(got.map((g) => [g.key, g.items.length, g.total])).toEqual([["b", 1, 1]]);
  });
});
