import { describe, expect, it } from "vitest";
// Shared contract with tools/kb/design.py (pytest test_check_fixture_is_current compares it).
import fixtureJson from "../../tools/tests/testdata/design_check_fixture.json";
import type { DesignCheck } from "./api";

const fixture = fixtureJson as unknown as DesignCheck;

describe("design check contract", () => {
  it("has the shape the console renders", () => {
    expect(fixture.passed).toBe(fixture.total);
    expect(Object.keys(fixture.stages)).toContain("high-level");
    expect(
      fixture.checks.every((c) => typeof c.passed === "boolean" && c.stage in fixture.stages),
    ).toBe(true);
    expect(fixture.versions.map((v) => v.version)).toEqual([1, 2, 3]);
    expect(fixture.versions[0]?.smells.length).toBeGreaterThan(0);
    expect(fixture.final_smells).toEqual([]);
    expect(fixture.estimates.every((e) => e.value !== null)).toBe(true);
  });
});
