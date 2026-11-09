/** Pure helpers for fenced code blocks: info-string meta parsing and grouping into tabs. */

export interface FenceMeta {
  title?: string;
  /** 1-based line numbers to emphasise. */
  highlight: number[];
  group?: string;
  lineNumbers: boolean;
}

function expandRanges(spec: string): number[] {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] === undefined ? a : Number(m[2]);
    if (a < 1 || b < a || b - a > 5000) continue;
    for (let i = a; i <= b; i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y);
}

const attr = (meta: string, name: string): string | undefined => {
  const m = new RegExp(`(?:^|\\s)${name}=(?:"([^"]*)"|'([^']*)'|(\\S+))`).exec(meta);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

/** Parse what follows the language in a fence: `title="lru.py" {3,5-7} group="impl" showLineNumbers`. */
export function parseMeta(meta: string | null | undefined): FenceMeta {
  const s = meta ?? "";
  const hl = /\{([\d,\s-]+)\}/.exec(s);
  return {
    title: attr(s, "title"),
    highlight: hl?.[1] ? expandRanges(hl[1]) : [],
    group: attr(s, "group"),
    lineNumbers: /(?:^|\s)showLineNumbers(?:\s|$)/.test(s),
  };
}

/** Group runs of consecutive items sharing the same truthy `group`; other items stay single. */
export function groupConsecutive<T extends { group?: string }>(items: T[]): (T | T[])[] {
  const out: (T | T[])[] = [];
  let run: T[] = [];
  const flush = () => {
    if (run.length === 1 && run[0]) out.push(run[0]);
    else if (run.length > 1) out.push(run);
    run = [];
  };
  for (const it of items) {
    if (!it.group) {
      flush();
      out.push(it);
    } else if (run.length > 0 && run[0]?.group === it.group) run.push(it);
    else {
      flush();
      run = [it];
    }
  }
  flush();
  return out;
}

/** Languages shown as a quiet "formula / output" panel instead of a labelled code block. */
export function isPlainLang(lang: string | undefined): boolean {
  return ["", "text", "txt", "pseudo", "plain", "plaintext", "output"].includes(
    (lang ?? "").toLowerCase(),
  );
}

const LABELS: Record<string, string> = {
  py: "Python",
  python: "Python",
  go: "Go",
  golang: "Go",
  sql: "SQL",
  json: "JSON",
  jsonc: "JSON",
  bash: "Shell",
  sh: "Shell",
  shell: "Shell",
  console: "Shell",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TypeScript",
  yaml: "YAML",
};

export function langLabel(lang: string | undefined): string {
  const l = (lang ?? "").toLowerCase();
  return LABELS[l] ?? (lang ? lang : "Code");
}

/** Minimal structural view of the hast nodes the rehype step touches. */
export interface HastLike {
  type: string;
  tagName?: string;
  value?: string;
  data?: { meta?: string };
  children?: HastLike[];
  properties?: Record<string, unknown>;
}

const isBlank = (n: HastLike) => n.type === "text" && !(n.value ?? "").trim();
const codeOf = (pre: HastLike) => pre.children?.find((c) => c.tagName === "code");
/** Fence meta of a `<code>` node: `data.meta` (before rehype-raw) or the `data-meta` property (after). */
export const metaOf = (code: HastLike | undefined): string | undefined => {
  const p = code?.properties?.dataMeta;
  return code?.data?.meta ?? (typeof p === "string" ? p : undefined);
};
export const groupOfPre = (pre: HastLike): string | undefined =>
  parseMeta(metaOf(codeOf(pre))).group;

/**
 * rehype plugin, must run BEFORE rehype-raw: raw re-parsing drops `node.data`, so the fence meta
 * (the info string after the language) is copied into a `data-meta` property, which survives.
 */
export function rehypeKeepMeta() {
  const walk = (n: HastLike): void => {
    if (n.tagName === "code" && n.data?.meta) {
      n.properties = { ...n.properties, dataMeta: n.data.meta };
    }
    n.children?.forEach(walk);
  };
  return (tree: HastLike) => walk(tree);
}

/**
 * rehype plugin: wrap runs of consecutive `<pre>` siblings that share `group="x"` in a
 * `<codetabs>` element (whitespace between them is dropped). Rendered by the `codetabs` component.
 */
export function rehypeCodeTabs() {
  const walk = (parent: HastLike): void => {
    const kids = parent.children;
    if (!kids) return;
    const next: HastLike[] = [];
    let i = 0;
    while (i < kids.length) {
      const node = kids[i] as HastLike;
      const g = node.tagName === "pre" ? groupOfPre(node) : undefined;
      if (g) {
        const run: HastLike[] = [node];
        let j = i + 1;
        let last = i;
        while (j < kids.length) {
          const k = kids[j] as HastLike;
          if (isBlank(k)) {
            j++;
            continue;
          }
          if (k.tagName === "pre" && groupOfPre(k) === g) {
            run.push(k);
            last = j;
            j++;
            continue;
          }
          break;
        }
        if (run.length > 1) {
          next.push({ type: "element", tagName: "codetabs", properties: {}, children: run });
          i = last + 1;
          continue;
        }
      }
      walk(node);
      next.push(node);
      i++;
    }
    parent.children = next;
  };
  return (tree: HastLike) => walk(tree);
}
