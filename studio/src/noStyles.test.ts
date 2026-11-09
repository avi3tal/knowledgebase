/**
 * Styling rules for the studio (CLAUDE.md): styles live only in `*.style.ts` files (styled-components)
 * and the theme; there are no CSS files and no style code in `.tsx`.
 *
 * During the migration, a component counts as migrated once its `X.style.ts` exists, and migrated
 * components must already be clean. `STRICT` turns on the whole-app rules once every file is done.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const STRICT = false;
const SRC = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(SRC);
const rel = (p: string) => relative(SRC, p);
const tsx = files.filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));
const styleOf = (f: string) => f.replace(/\.tsx$/, ".style.ts");

/** Style code found in a .tsx file. */
export function violations(source: string): string[] {
  const out: string[] = [];
  if (/\bstyle=\{/.test(source)) out.push("style= prop");
  if (/\bclassName=(?!\{className\})/.test(source)) out.push("className=");
  if (/from\s+["']styled-components["']/.test(source)) out.push("imports styled-components");
  if (/import\s+["'][^"']+\.css["']/.test(source)) out.push("imports a .css file");
  return out;
}

describe("style rules", () => {
  it("detects style code", () => {
    expect(violations('<div style={{ a: 1 }} className="x" />')).toEqual([
      "style= prop",
      "className=",
    ]);
    expect(violations("<Box className={className} />")).toEqual([]);
    expect(violations('import styled from "styled-components";')).toEqual([
      "imports styled-components",
    ]);
  });

  it("migrated components have no style code in their .tsx", () => {
    const bad = tsx
      .filter((f) => STRICT || existsSync(styleOf(f)))
      .flatMap((f) => violations(readFileSync(f, "utf8")).map((v) => `${rel(f)}: ${v}`));
    expect(bad).toEqual([]);
  });

  it.runIf(STRICT)("every component has a .style.ts", () => {
    expect(tsx.filter((f) => !existsSync(styleOf(f))).map(rel)).toEqual([]);
  });

  it.runIf(STRICT)("there are no CSS files or CSS imports", () => {
    expect(files.filter((f) => f.endsWith(".css")).map(rel)).toEqual([]);
    const imports = files
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /import\s+["'][^"']+\.css["']/.test(readFileSync(f, "utf8")));
    expect(imports.map(rel)).toEqual([]);
  });
});
