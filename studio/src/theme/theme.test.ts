import { describe, expect, it } from "vitest";
import { KIND_STYLE } from "../design";
import { groupTopics } from "../catalog";
import { PALETTE, colorDeclarations, cssVarName, darkColors, lightColors, t } from "./theme";

describe("theme", () => {
  it("light and dark define the same colours", () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
  it("maps colour keys to CSS variables", () => {
    expect(cssVarName("panel2")).toBe("--panel-2");
    expect(cssVarName("accentSoft")).toBe("--accent-soft");
    expect(t.panel2).toBe("var(--panel-2)");
    expect(colorDeclarations(lightColors)).toContain("--shadow-lift: ");
  });
  it("every design-console kind and catalog group gets a theme colour", () => {
    expect(Object.values(KIND_STYLE).every((k) => /^#[0-9a-f]{6}$/.test(k.color))).toBe(true);
    const groups = groupTopics([
      { id: "a", name: "A", group: "pattern" },
      { id: "b", name: "B", group: "fundamental" },
    ] as never);
    expect(groups.every((g) => (PALETTE as readonly string[]).includes(g.color))).toBe(true);
  });
});
