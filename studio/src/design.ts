import type {
  DesignCheck,
  DesignDoc,
  DesignPart,
  DesignStage,
  Diagram,
  DiagramEdge,
  DiagramNode,
  ScopeItem,
  Smell,
  TipLevel,
} from "./api";

/** Pure helpers for the design console: shapes, ids, geometry, diffs, versions (design.test.ts). */

// ---------------------------------------------------------------- stages

export const STAGE_INFO: Record<DesignStage, { label: string; icon: string }> = {
  scope: { label: "Scope", icon: "🎯" },
  estimates: { label: "Estimates", icon: "🧮" },
  api: { label: "API & data", icon: "🔌" },
  parts: { label: "Decompose", icon: "🧩" },
  "high-level": { label: "Reduce: high-level", icon: "🗺️" },
  "deep-dives": { label: "Deep dives", icon: "🤿" },
  "wrap-up": { label: "Wrap-up", icon: "🧾" },
  signatures: { label: "Signatures", icon: "✍️" },
};

/** Stage label for a problem: "Reduce: …" only makes sense when there is a Decompose stage before it. */
export function stageLabel(stage: DesignStage, stages: readonly DesignStage[]): string {
  if (stage === "high-level" && !stages.includes("parts")) return "High-level";
  return STAGE_INFO[stage].label;
}

// ---------------------------------------------------------------- palette shapes

export interface KindStyle {
  icon: string;
  color: string;
  label: string;
  /** Base for auto-generated node ids (`cache`, `cache2`…). */
  id: string;
}

export const KIND_STYLE: Record<string, KindStyle> = {
  // system-design
  client: { icon: "💻", color: "#64748b", label: "Client", id: "client" },
  dns: { icon: "🧭", color: "#0d9488", label: "DNS", id: "dns" },
  cdn: { icon: "🌐", color: "#0891b2", label: "CDN", id: "cdn" },
  "load-balancer": { icon: "⚖️", color: "#7c3aed", label: "Load balancer", id: "lb" },
  "api-gateway": { icon: "🚪", color: "#9333ea", label: "API gateway", id: "gw" },
  service: { icon: "⚙️", color: "#4f46e5", label: "Service", id: "svc" },
  worker: { icon: "🛠️", color: "#2563eb", label: "Worker", id: "worker" },
  scheduler: { icon: "⏰", color: "#0284c7", label: "Scheduler", id: "cron" },
  cache: { icon: "⚡", color: "#dc2626", label: "Cache", id: "cache" },
  sql: { icon: "🗄️", color: "#059669", label: "SQL DB", id: "db" },
  nosql: { icon: "🧱", color: "#16a34a", label: "NoSQL / KV", id: "kv" },
  blob: { icon: "🪣", color: "#65a30d", label: "Blob store", id: "blob" },
  search: { icon: "🔎", color: "#ca8a04", label: "Search index", id: "search" },
  queue: { icon: "📬", color: "#ea580c", label: "Queue", id: "queue" },
  stream: { icon: "🌊", color: "#f97316", label: "Stream", id: "stream" },
  coordinator: { icon: "🧩", color: "#db2777", label: "Coordinator", id: "coord" },
  external: { icon: "🔗", color: "#78716c", label: "External", id: "ext" },
  // ood
  actor: { icon: "🧑", color: "#64748b", label: "Actor", id: "actor" },
  class: { icon: "📦", color: "#4f46e5", label: "Class", id: "cls" },
  abstract: { icon: "🫥", color: "#7c3aed", label: "Abstract class", id: "base" },
  interface: { icon: "🔌", color: "#0891b2", label: "Interface", id: "iface" },
  enum: { icon: "🔢", color: "#ca8a04", label: "Enum", id: "enum" },
};

export function kindStyle(kind: string): KindStyle {
  return (
    KIND_STYLE[kind] ?? {
      icon: "◻️",
      color: "#6b7489",
      label: kind,
      id: kind.replace(/[^A-Za-z0-9]/g, "") || "node",
    }
  );
}

/** Auto id for a new node of `kind`: the base if free, else base2, base3… */
export function nextNodeId(kind: string, taken: Iterable<string>): string {
  const ids = new Set(taken);
  let base = kindStyle(kind).id;
  if (!/^[A-Za-z]/.test(base)) base = `n${base}`;
  base = base.slice(0, 36);
  if (!ids.has(base)) return base;
  for (let i = 2; ; i++) if (!ids.has(`${base}${i}`)) return `${base}${i}`;
}

/** Next scope id with the given prefix: F1, F2… (max existing number + 1). */
export function nextItemId(prefix: string, items: { id: string }[]): string {
  let max = 0;
  for (const it of items) {
    const m = new RegExp(`^${prefix}(\\d+)$`).exec(it.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${max + 1}`;
}

export const SCOPE_LISTS: {
  key: "functional" | "non_functional" | "assumptions" | "out_of_scope";
  prefix: string;
  title: string;
  hint: string;
}[] = [
  { key: "functional", prefix: "F", title: "Functional", hint: "what the system does" },
  {
    key: "non_functional",
    prefix: "N",
    title: "Non-functional",
    hint: "latency, availability, scale…",
  },
  { key: "assumptions", prefix: "A", title: "Assumptions", hint: "numbers and facts you assume" },
  { key: "out_of_scope", prefix: "O", title: "Out of scope", hint: "what you deliberately skip" },
];

export function addScopeItem(items: ScopeItem[], prefix: string): ScopeItem[] {
  return [...items, { id: nextItemId(prefix, items), text: "" }];
}

// ---------------------------------------------------------------- formatting

/** 38.6, 3.86k, 11.6k, 100M, 6B, 3T: three significant digits with SI-ish suffixes. */
export function formatSI(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const a = Math.abs(v);
  const short = (x: number) => String(Number(x.toPrecision(3)));
  if (a >= 1e15) return v.toExponential(2);
  if (a >= 1e12) return `${short(v / 1e12)}T`;
  if (a >= 1e9) return `${short(v / 1e9)}B`;
  if (a >= 1e6) return `${short(v / 1e6)}M`;
  if (a >= 1e3) return `${short(v / 1e3)}k`;
  if (a === 0) return "0";
  if (a < 0.01) return v.toExponential(1);
  return short(v);
}

/** mm:ss (or h:mm:ss) for the console timer. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, Math.max(1, max - 1))}…`;
}

// ---------------------------------------------------------------- tips

/** nudge → hint → show → (done). */
export function nextTipLevel(level: TipLevel | undefined): TipLevel | null {
  if (!level) return "nudge";
  if (level === "nudge") return "hint";
  if (level === "hint") return "show";
  return null;
}

// ---------------------------------------------------------------- versions & diffs

export function edgeKey(e: Pick<DiagramEdge, "from" | "to">): string {
  return `${e.from}->${e.to}`;
}

export interface DiagramDiff {
  added_nodes: string[];
  removed_nodes: string[];
  added_edges: string[];
  removed_edges: string[];
}

/** Same result as kb's design.diff (sorted ids, `from->to` edge keys). */
export function diffDiagrams(prev: Diagram | null, cur: Diagram): DiagramDiff {
  const pn = new Set((prev?.nodes ?? []).map((n) => n.id));
  const cn = new Set(cur.nodes.map((n) => n.id));
  const pe = new Set((prev?.edges ?? []).map(edgeKey));
  const ce = new Set(cur.edges.map(edgeKey));
  const minus = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x)).sort();
  return {
    added_nodes: minus(cn, pn),
    removed_nodes: minus(pn, cn),
    added_edges: minus(ce, pe),
    removed_edges: minus(pe, ce),
  };
}

export interface Highlight {
  nodes: Set<string>;
  edges: Set<string>;
}

/** What to mark NEW: nothing on the first version (everything is new there). */
export function newParts(diff: DiagramDiff | undefined, isFirst: boolean): Highlight {
  if (!diff || isFirst) return { nodes: new Set(), edges: new Set() };
  return { nodes: new Set(diff.added_nodes), edges: new Set(diff.added_edges) };
}

/** Highlight for diagram `version` from the live check (matched by version number, not index). */
export function highlightFor(check: DesignCheck, version: number): Highlight {
  const versions = [...check.versions].sort((a, b) => a.version - b.version);
  const v = versions.find((x) => x.version === version);
  return newParts(v?.diff, versions[0]?.version === version);
}

/** Smells of one version, keyed by node id → messages. */
export function smellsByNode(smells: Smell[], version: number): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const s of smells) {
    if (s.version !== version) continue;
    for (const n of s.nodes) out.set(n, [...(out.get(n) ?? []), s.message]);
  }
  return out;
}

export function sortVersions(diagrams: Diagram[]): Diagram[] {
  return [...diagrams].sort((a, b) => a.version - b.version);
}

/** A deep copy of the latest version as version max+1, with an empty "why". */
export function cloneLatest(diagrams: Diagram[]): Diagram {
  const sorted = sortVersions(diagrams);
  const last = sorted[sorted.length - 1];
  const copy = JSON.parse(JSON.stringify(last ?? { nodes: [], edges: [] })) as Diagram;
  return {
    ...copy,
    version: (last?.version ?? 0) + 1,
    why: "",
    nodes: copy.nodes ?? [],
    edges: copy.edges ?? [],
  };
}

// ---------------------------------------------------------------- diagram edits

export function addNode(d: Diagram, kind: string, x: number, y: number): [Diagram, string] {
  const id = nextNodeId(
    kind,
    d.nodes.map((n) => n.id),
  );
  const node: DiagramNode = {
    id,
    kind,
    label: kindStyle(kind).label,
    x: Math.round(x),
    y: Math.round(y),
  };
  return [{ ...d, nodes: [...d.nodes, node] }, id];
}

export function moveNode(d: Diagram, id: string, x: number, y: number): Diagram {
  return {
    ...d,
    nodes: d.nodes.map((n) => (n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n)),
  };
}

export function relabelNode(d: Diagram, id: string, label: string): Diagram {
  return { ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, label } : n)) };
}

/** Remove a node and every edge (and flow step) that touches it. */
export function removeNode(d: Diagram, id: string): Diagram {
  return {
    ...d,
    nodes: d.nodes.filter((n) => n.id !== id),
    edges: d.edges.filter((e) => e.from !== id && e.to !== id),
    ...(d.flows
      ? { flows: d.flows.map((f) => ({ ...f, path: f.path.filter((p) => p !== id) })) }
      : {}),
  };
}

/** Add from→to unless it is a self-loop, a duplicate, or touches a missing node. */
export function addEdge(d: Diagram, from: string, to: string): Diagram {
  const ids = new Set(d.nodes.map((n) => n.id));
  if (from === to || !ids.has(from) || !ids.has(to)) return d;
  if (d.edges.some((e) => e.from === from && e.to === to)) return d;
  return { ...d, edges: [...d.edges, { from, to }] };
}

export function removeEdge(d: Diagram, key: string): Diagram {
  return { ...d, edges: d.edges.filter((e) => edgeKey(e) !== key) };
}

export function relabelEdge(d: Diagram, key: string, label: string): Diagram {
  return {
    ...d,
    edges: d.edges.map((e) => {
      if (edgeKey(e) !== key) return e;
      const { label: _old, ...rest } = e;
      return label ? { ...rest, label } : rest;
    }),
  };
}

export function reverseEdge(d: Diagram, key: string): Diagram {
  const e = d.edges.find((x) => edgeKey(x) === key);
  if (!e || d.edges.some((x) => x.from === e.to && x.to === e.from)) return d;
  return {
    ...d,
    edges: d.edges.map((x) => (x === e ? { ...x, from: e.to, to: e.from } : x)),
  };
}

/** Parse the JSON tab: an object with nodes/edges arrays; the version is forced to `version`. */
export function parseDiagramJson(
  text: string,
  version: number,
): { diagram: Diagram } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "Expected an object" };
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges))
    return { error: "Expected `nodes` and `edges` arrays" };
  return {
    diagram: {
      ...(o as unknown as Diagram),
      version,
      why: typeof o.why === "string" ? o.why : "",
    },
  };
}

// ---------------------------------------------------------------- geometry

export const NODE_W = 140;
export const NODE_H = 56;

export interface Point {
  x: number;
  y: number;
}

/** Tier (column) per kind for nodes without stored positions: client → edge → services → data. */
const TIER: Record<string, number> = {
  client: 0,
  actor: 0,
  dns: 1,
  cdn: 1,
  "load-balancer": 1,
  "api-gateway": 1,
  interface: 1,
  abstract: 1,
  service: 2,
  worker: 2,
  scheduler: 2,
  coordinator: 2,
  class: 2,
  queue: 3,
  stream: 3,
  enum: 3,
  cache: 4,
  sql: 4,
  nosql: 4,
  blob: 4,
  search: 4,
  external: 4,
};

/** Fill in x/y for nodes that have none, column by tier; positioned nodes are kept. */
export function withPositions(nodes: DiagramNode[]): (DiagramNode & Point)[] {
  const perTier = new Map<number, number>();
  return nodes.map((n) => {
    if (typeof n.x === "number" && typeof n.y === "number") return { ...n, x: n.x, y: n.y };
    const t = TIER[n.kind] ?? 2;
    const row = perTier.get(t) ?? 0;
    perTier.set(t, row + 1);
    return { ...n, x: 40 + t * (NODE_W + 60), y: 40 + row * (NODE_H + 50) };
  });
}

export function center(n: Point): Point {
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

/** Where the ray from the box centre `c` towards `toward` leaves the node box. */
export function boundaryPoint(c: Point, toward: Point, pad = 2): Point {
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const hw = NODE_W / 2 + pad;
  const hh = NODE_H / 2 + pad;
  const s = Math.min(
    dx === 0 ? Infinity : hw / Math.abs(dx),
    dy === 0 ? Infinity : hh / Math.abs(dy),
  );
  return { x: c.x + dx * s, y: c.y + dy * s };
}

/**
 * Curved edge between two node boxes (top-left positions): a cubic Bézier leaving along the
 * dominant axis. `bend` pushes the curve sideways (used when a reverse edge exists).
 */
export function edgePath(a: Point, b: Point, bend = 0): { d: string; mid: Point } {
  const ca = center(a);
  const cb = center(b);
  const s = boundaryPoint(ca, cb);
  const e = boundaryPoint(cb, ca, 6);
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * bend;
  const ny = (dx / len) * bend;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const c1 = horizontal ? { x: s.x + dx / 2, y: s.y } : { x: s.x, y: s.y + dy / 2 };
  const c2 = horizontal ? { x: e.x - dx / 2, y: e.y } : { x: e.x, y: e.y - dy / 2 };
  c1.x += nx;
  c1.y += ny;
  c2.x += nx;
  c2.y += ny;
  const r = (v: number) => Math.round(v * 10) / 10;
  const mid = {
    x: r((s.x + 3 * c1.x + 3 * c2.x + e.x) / 8),
    y: r((s.y + 3 * c1.y + 3 * c2.y + e.y) / 8),
  };
  return {
    d: `M${r(s.x)},${r(s.y)} C${r(c1.x)},${r(c1.y)} ${r(c2.x)},${r(c2.y)} ${r(e.x)},${r(e.y)}`,
    mid,
  };
}

/** Topmost node whose box contains p (later nodes are drawn on top). */
export function hitNode<T extends DiagramNode & Point>(nodes: T[], p: Point): T | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]!;
    if (p.x >= n.x && p.x <= n.x + NODE_W && p.y >= n.y && p.y <= n.y + NODE_H) return n;
  }
  return null;
}

/** Bounding box of all node boxes plus a margin (an empty diagram gets a default area). */
export function bounds(
  nodes: Point[],
  margin = 40,
): { x: number; y: number; w: number; h: number } {
  if (nodes.length === 0) return { x: 0, y: 0, w: 800, h: 420 };
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const x = Math.min(...xs) - margin;
  const y = Math.min(...ys) - margin;
  return {
    x,
    y,
    w: Math.max(...xs) + NODE_W + margin - x,
    h: Math.max(...ys) + NODE_H + margin - y,
  };
}

/** Zoom to `k` keeping the screen point `p` fixed. View = translate(x,y) scale(k). */
export function zoomAt(
  view: { x: number; y: number; k: number },
  p: Point,
  k: number,
): { x: number; y: number; k: number } {
  const nk = Math.min(2.5, Math.max(0.3, k));
  const wx = (p.x - view.x) / view.k;
  const wy = (p.y - view.y) / view.k;
  return { x: p.x - wx * nk, y: p.y - wy * nk, k: nk };
}

/** Snap to a 10px grid. */
export function snap(v: number, grid = 10): number {
  return Math.round(v / grid) * grid;
}

// ---------------------------------------------------------------- shapes stencil

/** HTML5 drag-and-drop type for a stencil tile: the payload is the node kind. */
export const SHAPE_MIME = "application/x-kb-shape";

export interface PaletteGroup {
  title: string;
  icon: string;
  kinds: string[];
}

const SD_GROUPS: PaletteGroup[] = [
  {
    title: "Clients & edge",
    icon: "🌐",
    kinds: ["client", "dns", "cdn", "load-balancer", "api-gateway"],
  },
  { title: "Compute", icon: "⚙️", kinds: ["service", "worker", "scheduler", "coordinator"] },
  { title: "Data", icon: "🗄️", kinds: ["cache", "sql", "nosql", "blob", "search"] },
  { title: "Messaging", icon: "📬", kinds: ["queue", "stream"] },
  { title: "External", icon: "🔗", kinds: ["external"] },
];
const OOD_KINDS = ["actor", "class", "abstract", "interface", "enum"];

/**
 * The stencil groups for a problem's palette: system-design kinds in five groups, OOD kinds in one.
 * Only kinds of `palette` appear (in group order); unknown kinds go to "Other"; empty groups are dropped.
 */
export function paletteGroups(palette: string[]): PaletteGroup[] {
  const have = new Set(palette);
  const ood = palette.some((k) => OOD_KINDS.includes(k));
  const base = ood ? [{ title: "Classes", icon: "📦", kinds: OOD_KINDS }] : SD_GROUPS;
  const groups = base.map((g) => ({ ...g, kinds: g.kinds.filter((k) => have.has(k)) }));
  const known = new Set(base.flatMap((g) => g.kinds));
  const other = palette.filter((k) => !known.has(k));
  if (other.length) groups.push({ title: "Other", icon: "◻️", kinds: other });
  return groups.filter((g) => g.kinds.length > 0);
}

/** Keep the kinds whose kind, label or id base contains `q` (case-insensitive); drop empty groups. */
export function filterPalette(groups: PaletteGroup[], q: string): PaletteGroup[] {
  const s = q.trim().toLowerCase();
  if (!s) return groups;
  const hit = (k: string) => {
    const st = kindStyle(k);
    return [k, st.label, st.id].some((x) => x.toLowerCase().includes(s));
  };
  return groups
    .map((g) => ({
      ...g,
      kinds: g.title.toLowerCase().includes(s) ? g.kinds : g.kinds.filter(hit),
    }))
    .filter((g) => g.kinds.length > 0);
}

/** Stores render as cylinders, messaging as pipes, people as pills; the rest as cards. */
export function kindShape(kind: string): "store" | "pipe" | "person" | "card" {
  if (["sql", "nosql", "blob", "search", "cache"].includes(kind)) return "store";
  if (["queue", "stream"].includes(kind)) return "pipe";
  if (["client", "actor"].includes(kind)) return "person";
  return "card";
}

// ---------------------------------------------------------------- brief

/**
 * The README's "What the interviewer tells you if you ask" section (markdown, without its heading),
 * up to the next h1/h2; null when the README has no such section.
 */
export function extractBrief(readme: string): string | null {
  const lines = readme.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+what the interviewer tells you/i.test(l));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,2}\s/.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

/** Requirement ids a part can cover: F…, N… and A… items that have an id. */
export function coverableIds(scope: DesignDoc["scope"]): ScopeItem[] {
  return [
    ...(scope.functional ?? []),
    ...(scope.non_functional ?? []),
    ...(scope.assumptions ?? []),
  ].filter((x) => x.id);
}

// ---------------------------------------------------------------- checklist

/** Stage order for the checklist: the current stage first, then the rest in problem order. */
export function stagesFirst(stages: DesignStage[], current: string): DesignStage[] {
  return [...stages.filter((s) => s === current), ...stages.filter((s) => s !== current)];
}

/** Ids that pass in `next` but did not pass in `prev` (drives the "just passed" animation). */
export function newlyPassed(
  prev: { id: string; passed: boolean }[],
  next: { id: string; passed: boolean }[],
): string[] {
  const before = new Set(prev.filter((c) => c.passed).map((c) => c.id));
  return next.filter((c) => c.passed && !before.has(c.id)).map((c) => c.id);
}

// ---------------------------------------------------------------- decompose → reduce

export type SubDiagram = DesignPart["diagram"];

/** A new empty part with the next free id (P1, P2…). It saves as is: every list starts empty. */
export function newPart(parts: DesignPart[]): DesignPart {
  return {
    id: nextItemId("P", parts),
    title: "",
    covers: [],
    problem: "",
    options: [
      { name: "", pros: "", cons: "" },
      { name: "", pros: "", cons: "" },
    ],
    choice: "",
    why: "",
    technologies: [],
    patterns: [],
    diagram: { nodes: [], edges: [] },
  };
}

/** A part's sub-diagram as a canvas Diagram (version 0) and back (only nodes and edges are kept). */
export function partToDiagram(p: DesignPart): Diagram {
  return { version: 0, why: "", nodes: p.diagram?.nodes ?? [], edges: p.diagram?.edges ?? [] };
}
export function diagramToSub(d: Diagram): SubDiagram {
  return { nodes: d.nodes, edges: d.edges };
}

/**
 * Same as kb's design.compose: merge the parts' sub-diagrams into `diagram` by node id and edges by
 * from→to. Existing nodes and edges win; new ones are appended as copies, in part order. Idempotent.
 */
export function composeDiagram<D extends { nodes: DiagramNode[]; edges: DiagramEdge[] }>(
  diagram: D,
  parts: { diagram?: SubDiagram }[],
): D {
  const out = { ...diagram, nodes: [...diagram.nodes], edges: [...diagram.edges] };
  const ids = new Set(out.nodes.map((n) => n.id));
  const keys = new Set(out.edges.map(edgeKey));
  for (const p of parts) {
    for (const n of p.diagram?.nodes ?? []) {
      if (ids.has(n.id)) continue;
      out.nodes.push({ ...n });
      ids.add(n.id);
    }
    for (const e of p.diagram?.edges ?? []) {
      const k = edgeKey(e);
      if (keys.has(k)) continue;
      out.edges.push({ ...e });
      keys.add(k);
    }
  }
  return out;
}

/** Same as kb's part_smells nodes: every part node id missing from `final`, sorted and unique. */
export function missingPartNodes(
  final: { nodes: DiagramNode[] } | undefined,
  parts: { diagram?: SubDiagram }[],
): string[] {
  const have = new Set((final?.nodes ?? []).map((n) => n.id));
  const miss = new Set<string>();
  for (const p of parts)
    for (const n of p.diagram?.nodes ?? []) if (!have.has(n.id)) miss.add(n.id);
  return [...miss].sort();
}

/** What composing would add to `final`: the part ids that bring new nodes or edges, and the counts. */
export function composePreview(
  final: { nodes: DiagramNode[]; edges: DiagramEdge[] } | undefined,
  parts: { id: string; diagram?: SubDiagram }[],
): { parts: string[]; nodes: number; edges: number } {
  const ids = new Set((final?.nodes ?? []).map((n) => n.id));
  const keys = new Set((final?.edges ?? []).map(edgeKey));
  const contributing: string[] = [];
  let nodes = 0;
  let edges = 0;
  for (const p of parts) {
    let adds = false;
    for (const n of p.diagram?.nodes ?? []) {
      if (ids.has(n.id)) continue;
      ids.add(n.id);
      nodes++;
      adds = true;
    }
    for (const e of p.diagram?.edges ?? []) {
      if (keys.has(edgeKey(e))) continue;
      keys.add(edgeKey(e));
      edges++;
      adds = true;
    }
    if (adds) contributing.push(p.id);
  }
  return { parts: contributing, nodes, edges };
}

function overlaps(a: Point, b: Point, gap = 16): boolean {
  return (
    a.x < b.x + NODE_W + gap &&
    b.x < a.x + NODE_W + gap &&
    a.y < b.y + NODE_H + gap &&
    b.y < a.y + NODE_H + gap
  );
}

/**
 * The nearest free top-left spot to `p` for a new node box: `p` itself if it overlaps nothing, else
 * the first free point on rings of grid steps around it (snapped to the 10px grid).
 */
export function freeSpot(nodes: DiagramNode[], p: Point): Point {
  const boxes = withPositions(nodes);
  const start = { x: snap(p.x), y: snap(p.y) };
  const free = (q: Point) => !boxes.some((b) => overlaps(q, b, 12));
  if (free(start)) return start;
  const dx = NODE_W + 30;
  const dy = NODE_H + 30;
  for (let r = 1; r < 12; r++) {
    // nearest first on each ring: 0, 1, -1, 2, -2 … along each side (right, below, left, above)
    const js = [0, ...Array.from({ length: r }, (_, n) => [n + 1, -(n + 1)]).flat()];
    for (const j of js)
      for (const [i, k] of [
        [r, j],
        [j, r],
        [-r, j],
        [j, -r],
      ] as const) {
        const q = { x: start.x + i * dx, y: start.y + k * dy };
        if (free(q)) return q;
      }
  }
  return start;
}

/**
 * Give the nodes that compose added (ids not in `prevIds`) a free spot: keep their part position when
 * it is free, else move them down (then over a column) until they overlap nothing. Old nodes never move.
 */
export function placeComposed<D extends Diagram>(d: D, prevIds: Iterable<string>): D {
  const old = new Set(prevIds);
  const placed: Point[] = withPositions(d.nodes.filter((n) => old.has(n.id)));
  const fresh = d.nodes.filter((n) => !old.has(n.id));
  const auto = withPositions(fresh);
  const moved = new Map<string, Point>();
  fresh.forEach((n, i) => {
    const start = auto[i]!;
    let p = { x: start.x, y: start.y };
    for (let step = 1; placed.some((q) => overlaps(p, q)) && step < 200; step++) {
      p =
        step % 6 === 0
          ? { x: start.x + (step / 6) * (NODE_W + 40), y: start.y }
          : { x: p.x, y: p.y + NODE_H + 30 };
    }
    placed.push(p);
    moved.set(n.id, { x: Math.round(p.x), y: Math.round(p.y) });
  });
  return {
    ...d,
    nodes: d.nodes.map((n) => {
      const p = moved.get(n.id);
      return p ? { ...n, x: p.x, y: p.y } : n;
    }),
  };
}

/** The why of a composed version: "Compose P1, P2". */
export function composeWhy(partIds: string[]): string {
  return `Compose ${partIds.join(", ")}`;
}

/**
 * The next diagram version = compose(latest, parts) as version latest+1, new nodes placed off the
 * existing ones, why "Compose P1, P2" (the parts that add something). Null when nothing would change.
 */
export function composeVersion(diagrams: Diagram[], parts: DesignPart[]): Diagram | null {
  const sorted = sortVersions(diagrams);
  const latest: Diagram = sorted[sorted.length - 1] ?? {
    version: 0,
    why: "",
    nodes: [],
    edges: [],
  };
  const preview = composePreview(latest, parts);
  if (preview.parts.length === 0) return null;
  const copy = JSON.parse(JSON.stringify(latest)) as Diagram;
  const merged = placeComposed(
    composeDiagram(copy, parts),
    latest.nodes.map((n) => n.id),
  );
  return { ...merged, version: latest.version + 1, why: composeWhy(preview.parts) };
}

export interface LinkTarget {
  id: string;
  kind: string;
  label: string;
  /** where it comes from: "v3" or "P2" */
  from: string;
}

/**
 * Components a node can be linked to so that reduce merges them by id: the latest high-level version's
 * nodes first, then the other parts' nodes; unique by id, excluding ids already in `current`.
 */
export function linkTargets(
  latest: Diagram | undefined,
  parts: DesignPart[],
  exceptPart: string | null,
  current: { nodes: DiagramNode[] },
): LinkTarget[] {
  const taken = new Set(current.nodes.map((n) => n.id));
  const out: LinkTarget[] = [];
  const seen = new Set<string>();
  const add = (n: DiagramNode, from: string) => {
    if (taken.has(n.id) || seen.has(n.id)) return;
    seen.add(n.id);
    out.push({ id: n.id, kind: n.kind, label: n.label || n.id, from });
  };
  if (latest) for (const n of latest.nodes) add(n, `v${latest.version}`);
  for (const p of parts)
    if (p.id !== exceptPart) for (const n of p.diagram?.nodes ?? []) add(n, p.id);
  return out;
}

/**
 * Re-point node `oldId` at another component: it takes the target's id, kind and label, and its edges
 * and flow steps follow. Refused (returns `d` unchanged) when another node here already has that id.
 */
export function linkNode<D extends Diagram>(
  d: D,
  oldId: string,
  target: Pick<LinkTarget, "id" | "kind" | "label">,
): D {
  if (oldId === target.id || d.nodes.some((n) => n.id === target.id)) return d;
  if (!d.nodes.some((n) => n.id === oldId)) return d;
  const re = (id: string) => (id === oldId ? target.id : id);
  return {
    ...d,
    nodes: d.nodes.map((n) =>
      n.id === oldId ? { ...n, id: target.id, kind: target.kind, label: target.label } : n,
    ),
    edges: d.edges.map((e) => ({ ...e, from: re(e.from), to: re(e.to) })),
    ...(d.flows ? { flows: d.flows.map((f) => ({ ...f, path: f.path.map(re) })) } : {}),
  };
}

/** Edges touching node `id`, split by direction. */
export function connections(
  d: { edges: DiagramEdge[] },
  id: string,
): { out: DiagramEdge[]; in: DiagramEdge[] } {
  return { out: d.edges.filter((e) => e.from === id), in: d.edges.filter((e) => e.to === id) };
}
