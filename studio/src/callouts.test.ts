import { describe, expect, it } from "vitest";
import { expandCallouts } from "./callouts";

describe("expandCallouts", () => {
  it("wraps a known callout with its default or custom title", () => {
    const out = expandCallouts("before\n> [!TIP]\n> body **x**\nafter");
    expect(out).toContain('<div class="callout callout-tip">');
    expect(out).toContain("💡</span> Tip</div>");
    expect(out).toContain("\nbody **x**\n");
    expect(out).toContain("after");
    expect(expandCallouts("> [!PITFALL] Watch out\n> y")).toContain("Watch out</div>");
  });

  it("leaves plain quotes, unknown kinds and code fences alone", () => {
    expect(expandCallouts("> just a quote")).toBe("> just a quote");
    expect(expandCallouts("> [!FOO]\n> y")).toBe("> [!FOO]\n> y");
    const fenced = "```\n> [!TIP]\n> y\n```";
    expect(expandCallouts(fenced)).toBe(fenced);
  });

  it("turns dialogue lines into bubbles per speaker and escapes names", () => {
    const out = expandCallouts(
      "> [!DIALOGUE]\n> **Candidate:** What scale?\n> **Interviewer:** 1M <users>",
    );
    expect(out).toContain(
      '<div class="dlg-line dlg-candidate"><span class="dlg-who">Candidate</span>',
    );
    expect(out).toContain('<div class="dlg-line dlg-interviewer">');
    expect(out).toContain("1M <users>"); // body stays markdown; only the speaker name is HTML
  });
});
