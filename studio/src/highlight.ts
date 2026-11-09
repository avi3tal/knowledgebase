/**
 * Lazily created Shiki highlighter (fine-grained bundle, JS regex engine, dual github theme).
 * Nothing here is imported statically except types, so the highlighter and every grammar land in
 * their own chunks and are only fetched when a code block first needs them.
 *
 * Tokens carry both themes as CSS variables (`--shiki-light` / `--shiki-dark`), so flipping
 * `<html data-theme>` restyles already highlighted code without re-tokenising.
 */
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { HighlighterCore } from "shiki/core";

export interface Tok {
  content: string;
  style?: CSSProperties;
}
export type TokLine = Tok[];

const ALIASES: Record<string, string> = {
  py: "python",
  python3: "python",
  golang: "go",
  sh: "shellscript",
  shell: "shellscript",
  console: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  ts: "typescript",
  tsx: "typescript",
};

const LOADERS: Record<string, () => Promise<unknown>> = {
  python: () => import("@shikijs/langs/python"),
  go: () => import("@shikijs/langs/go"),
  sql: () => import("@shikijs/langs/sql"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  shellscript: () => import("@shikijs/langs/shellscript"),
  typescript: () => import("@shikijs/langs/typescript"),
};

/** Canonical grammar name, or null when the language is not highlighted (text, pseudo, unknown). */
export function normalizeLang(lang: string | undefined): string | null {
  const l = (lang ?? "").trim().toLowerCase();
  const name = ALIASES[l] ?? l;
  return name in LOADERS ? name : null;
}

const THEMES = { light: "github-light", dark: "github-dark" } as const;

let core: HighlighterCore | null = null;
let corePromise: Promise<HighlighterCore> | null = null;
const loaded = new Set<string>();
const loading = new Map<string, Promise<void>>();

function getCore(): Promise<HighlighterCore> {
  corePromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ]);
    const h = await createHighlighterCore({
      themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
    core = h;
    return h;
  })();
  corePromise.catch(() => {
    corePromise = null;
  });
  return corePromise;
}

function ensure(lang: string): Promise<void> {
  if (loaded.has(lang) && core) return Promise.resolve();
  let p = loading.get(lang);
  if (!p) {
    const loader = LOADERS[lang];
    p = getCore().then(async (h) => {
      if (loader) await h.loadLanguage(loader() as Parameters<HighlighterCore["loadLanguage"]>[0]);
      loaded.add(lang);
    });
    p.catch(() => loading.delete(lang));
    loading.set(lang, p);
  }
  return p;
}

const cache = new Map<string, TokLine[]>();
const CACHE_MAX = 300;

/** Shiki emits kebab-case CSS properties; React wants camelCase (custom properties stay as is). */
function toStyle(
  htmlStyle: Record<string, string> | string | undefined,
): CSSProperties | undefined {
  if (!htmlStyle || typeof htmlStyle === "string") return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(htmlStyle)) {
    out[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as CSSProperties;
}

/** Synchronous tokenising; null while the highlighter or the grammar is not loaded yet. */
function tokenizeSync(code: string, lang: string): TokLine[] | null {
  if (!core || !loaded.has(lang)) return null;
  const key = `${lang}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { tokens } = core.codeToTokens(code, { lang, themes: THEMES, defaultColor: false });
  const lines = tokens.map((line) =>
    line.map((t) => ({ content: t.content, style: toStyle(t.htmlStyle) })),
  );
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, lines);
  return lines;
}

/** Per-line tokens, or null for languages that are not highlighted. */
export async function highlightTokens(code: string, lang: string): Promise<TokLine[] | null> {
  const l = normalizeLang(lang);
  if (!l) return null;
  await ensure(l);
  return tokenizeSync(code, l);
}

/**
 * Null until the highlighter is ready (or for unhighlighted languages): render plain text first,
 * then upgrade. Once loaded, later code changes tokenise synchronously, so editors never flash.
 */
export function useHighlighted(code: string, lang: string | undefined): TokLine[] | null {
  const l = normalizeLang(lang);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!l) return;
    let live = true;
    ensure(l)
      .then(() => live && setTick((t) => t + 1))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [l]);
  // `tick` forces a re-tokenise once the grammar has finished loading.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (l ? tokenizeSync(code, l) : null), [code, l, tick]);
}
