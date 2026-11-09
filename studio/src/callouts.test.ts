import { describe, expect, it } from "vitest";
import { expandCallouts } from "./callouts";

describe("expandCallouts", () => {
  it("wraps a known callout with its default or custom heading", () => {
    const out = expandCallouts("before\n> [!TIP]\n> body **x**\nafter");
    expect(out).toContain('<kb-callout kind="tip" heading="Tip">');
    expect(out).toContain("\nbody **x**\n");
    expect(out).toContain("</kb-callout>");
    expect(out).toContain("after");
    expect(expandCallouts("> [!PITFALL] Watch out\n> y")).toContain(
      '<kb-callout kind="pitfall" heading="Watch out">',
    );
  });

  it("escapes the heading for use inside an attribute", () => {
    expect(expandCallouts('> [!NOTE] Say "hi" <b>\n> y')).toContain(
      'heading="Say &quot;hi&quot; &lt;b&gt;"',
    );
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
    expect(out).toContain('<kb-callout kind="dialogue" heading="Scoping the problem">');
    expect(out).toContain('<kb-line speaker="candidate" who="Candidate">');
    expect(out).toContain('<kb-line speaker="interviewer" who="Interviewer">');
    expect(out).toContain("1M <users>"); // body stays markdown; only the speaker name is HTML
  });
});
