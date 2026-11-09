/** Lesson figures (spec format: tools/kb/figures.py). Pure helpers; tested in figures.test.ts. */
import type { Diagram } from "./api";
import type { Highlight } from "./design";
import type { FigureViewSpec, ViewState } from "./trace";

export interface FigureStep {
  text: string;
  nodes?: string[];
  /** "from>to" */
  edges?: string[];
  /** nodes or "from>to" edges that fail in this step (drawn red with ✕) */
  fail?: string[];
}
/** What a scenario is about; drives its tab icon and colour. */
export type ScenarioTone = "happy" | "failure" | "edge" | "alternative" | "risk" | "scale";
/**
 * One way the system can play out: a tab on the figure. Any figure field it sets (nodes, edges,
 * actors, messages, steps, caption) replaces the base figure's for this scenario.
 */
export interface Scenario {
  name: string;
  tone?: ScenarioTone;
  /** one line under the tabs: what this scenario shows and what to take away */
  summary?: string;
  steps?: FigureStep[];
  caption?: string;
  nodes?: unknown[];
  edges?: unknown[];
  actors?: unknown[];
  messages?: unknown[];
  classes?: unknown[];
  relations?: unknown[];
  views?: unknown[];
  frames?: unknown[];
}
interface FigureBase {
  title: string;
  caption?: string;
  steps?: FigureStep[];
  /** first tab = the base figure (named `base_name`, default "How it works") */
  scenarios?: Scenario[];
  base_name?: string;
}
export interface ArchitectureFigure extends FigureBase {
  kind: "architecture";
  /** `sub` replaces the shape's name under the label (e.g. "keys 20–50") */
  nodes: { id: string; kind: string; label?: string; sub?: string; x: number; y: number }[];
  edges: { from: string; to: string; label?: string }[];
}
export type FlowType = "start" | "step" | "decision" | "end";
export interface FlowchartFigure extends FigureBase {
  kind: "flowchart";
  /** tone colours an outcome: "good" (green) or "bad" (red) */
  nodes: {
    id: string;
    type: FlowType;
    label: string;
    col: number;
    row: number;
    tone?: "good" | "bad";
  }[];
  edges: { from: string; to: string; label?: string }[];
}
/** lost = never arrives (drawn half-way, ending in ✕): a dropped packet, a lost reply */
export type MessageStyle = "call" | "reply" | "error" | "async" | "self" | "lost";
export interface SequenceFigure extends FigureBase {
  kind: "sequence";
  actors: { id: string; label: string; kind?: string }[];
  messages: { from: string; to: string; label: string; style?: MessageStyle; note?: string }[];
}
export type UmlStereotype = "interface" | "abstract" | "enum";
/**
 * inherits / implements: `from` = subclass, `to` = parent (triangle at `to`).
 * composition / aggregation: `from` = whole (diamond at `from`), `to` = part.
 * association: plain line (`navigable` adds an open arrow at `to`); dependency: dashed, arrow at `to`.
 */
export type UmlRelationType =
  "inherits" | "implements" | "composition" | "aggregation" | "association" | "dependency";
export interface UmlClass {
  id: string;
  name: string;
  stereotype?: UmlStereotype;
  /** "- name: type" (visibility + - # ~); enum values plain */
  fields?: string[];
  methods?: string[];
  /** top-left corner */
  x: number;
  y: number;
}
export interface UmlRelation {
  from: string;
  to: string;
  type: UmlRelationType;
  label?: string;
  from_mult?: string;
  to_mult?: string;
  navigable?: boolean;
}
export interface UmlFigure extends FigureBase {
  kind: "uml";
  classes: UmlClass[];
  relations?: UmlRelation[];
}
/** A structure frame as the API serves it: kb normalised the plain vars into trace view states. */
export interface StructureFrame {
  text: string;
  state: Record<string, ViewState>;
}
export interface StructureFigure extends FigureBase {
  kind: "structure";
  views: FigureViewSpec[];
  frames: StructureFrame[];
}
export type Figure =
  ArchitectureFigure | FlowchartFigure | SequenceFigure | UmlFigure | StructureFigure;

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
/** 1 → "①" … 20 → "⑳", then "(21)". */
export function circled(n: number): string {
  return n >= 1 && n <= CIRCLED.length ? (CIRCLED[n - 1] ?? `(${n})`) : `(${n})`;
}

/** Step number of each edge ("from>to" → first step that highlights it). */
export function edgeStepNumbers(steps: FigureStep[] | undefined): Map<string, number> {
  const out = new Map<string, number>();
  (steps ?? []).forEach((s, i) => {
    for (const e of s.edges ?? []) if (!out.has(e)) out.set(e, i + 1);
  });
  return out;
}

/** An architecture figure as a read-only canvas diagram; numbered edges get "① label". */
export function architectureDiagram(f: ArchitectureFigure): Diagram {
  const nums = edgeStepNumbers(f.steps);
  return {
    version: 1,
    why: "",
    nodes: f.nodes.map((n) => ({ ...n })),
    edges: f.edges.map((e) => {
      const n = nums.get(`${e.from}>${e.to}`);
      const label = [n ? circled(n) : "", e.label ?? ""].filter(Boolean).join(" ");
      return { from: e.from, to: e.to, label: label || undefined };
    }),
  };
}

export const TONE_ICON: Record<ScenarioTone, string> = {
  happy: "✅",
  failure: "⚠️",
  edge: "🧪",
  alternative: "🔀",
  risk: "🧨",
  scale: "📈",
};

/** Tabs of a figure: the base figure first, then its scenarios. */
export function scenarioTabs(f: Figure): { name: string; tone: ScenarioTone; summary?: string }[] {
  return [
    { name: f.base_name ?? "How it works", tone: "happy" as ScenarioTone },
    ...(f.scenarios ?? []).map((s) => ({
      name: s.name,
      tone: s.tone ?? "edge",
      summary: s.summary,
    })),
  ];
}

/** The figure as scenario `i` shows it (0 = base): the scenario's fields replace the base's. */
export function applyScenario(f: Figure, i: number): Figure {
  const s = i > 0 ? f.scenarios?.[i - 1] : undefined;
  if (!s) return f;
  const { name: _name, tone: _tone, summary: _summary, ...fields } = s;
  // the base caption describes the base picture: a scenario shows its own caption or none
  return { ...f, caption: undefined, ...fields, scenarios: f.scenarios } as Figure;
}

/** Failed nodes and edges of a step, as a canvas highlight. */
export function stepFailed(step: FigureStep | undefined): Highlight {
  const fail = step?.fail ?? [];
  return {
    nodes: new Set(fail.filter((x) => !x.includes(">"))),
    edges: new Set(fail.filter((x) => x.includes(">")).map((e) => e.replace(">", "->"))),
  };
}

/** Canvas highlight for one step (edge keys converted to the canvas's "from->to"). */
export function stepHighlight(step: FigureStep | undefined): Highlight {
  return {
    nodes: new Set(step?.nodes ?? []),
    edges: new Set((step?.edges ?? []).map((e) => e.replace(">", "->"))),
  };
}

/** Sequence figures: every message is a step (its note, else its label, is the narration). */
export function sequenceSteps(f: SequenceFigure): FigureStep[] {
  return f.messages.map((m) => ({ text: m.note ?? m.label, nodes: [m.from, m.to] }));
}

/** Structure figures: every frame is a step (highlight comes from its pointers / window / cells). */
export function structureSteps(f: StructureFigure): FigureStep[] {
  return f.frames.map((fr) => ({ text: fr.text }));
}

export function stepsOf(f: Figure): FigureStep[] {
  if (f.kind === "sequence") return sequenceSteps(f);
  if (f.kind === "structure") return structureSteps(f);
  return f.steps ?? [];
}

/** The frame a structure figure shows at `step` (-1, the resting picture, shows the first). */
export function structureFrame(f: StructureFigure, step: number): StructureFrame | undefined {
  return f.frames[Math.max(0, Math.min(step, f.frames.length - 1))];
}

// ---------------------------------------------------------------- uml layout

export const UML = {
  /** monospace member at 12px */
  charW: 7.3,
  /** bold class name at 14px */
  nameW: 8.4,
  /** «stereotype» at 11px */
  stereoW: 6.4,
  line: 17,
  padX: 10,
  padY: 6,
  minW: 120,
  name: 20,
  stereo: 14,
  /** empty compartment */
  empty: 10,
  /** space around the whole diagram */
  pad: 28,
} as const;

export const STEREOTYPE_LABEL: Record<UmlStereotype, string> = {
  interface: "«interface»",
  abstract: "«abstract»",
  enum: "«enumeration»",
};

export interface UmlBox {
  w: number;
  h: number;
  /** heights of the three compartments (methods = 0 for an enum without methods) */
  header: number;
  fields: number;
  methods: number;
}

/** Size of a class box: as wide as its longest line, as tall as its compartments. */
export function umlBox(c: UmlClass): UmlBox {
  const fields = c.fields ?? [];
  const methods = c.methods ?? [];
  const widest = Math.max(
    c.name.length * UML.nameW,
    c.stereotype ? STEREOTYPE_LABEL[c.stereotype].length * UML.stereoW : 0,
    ...[...fields, ...methods].map((m) => m.length * UML.charW),
  );
  const compartment = (n: number) => (n ? UML.padY * 2 + n * UML.line : UML.empty);
  const header = UML.padY * 2 + UML.name + (c.stereotype ? UML.stereo : 0);
  const f = compartment(fields.length);
  const m = c.stereotype === "enum" && methods.length === 0 ? 0 : compartment(methods.length);
  return {
    w: Math.max(UML.minW, Math.ceil(widest + UML.padX * 2)),
    h: header + f + m,
    header,
    fields: f,
    methods: m,
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}

export const rectCenter = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Where the line from the rectangle's centre toward `p` leaves the rectangle. */
export function rectBorderPoint(r: Rect, p: Point): Point {
  const c = rectCenter(r);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const tx = dx === 0 ? Infinity : r.w / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : r.h / 2 / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: c.x + dx * t, y: c.y + dy * t };
}

/**
 * A relation drawn between two boxes, border to border: a straight vertical (horizontal) line
 * through the middle of their overlap when the boxes share columns (rows), else along the
 * centre-to-centre line.
 */
export function umlEdge(a: Rect, b: Rect): { start: Point; end: Point } {
  const lo = Math.max(a.x, b.x);
  const hi = Math.min(a.x + a.w, b.x + b.w);
  if (hi - lo >= 24 && (a.y + a.h <= b.y || b.y + b.h <= a.y)) {
    const x = (lo + hi) / 2;
    const down = a.y < b.y;
    return {
      start: { x, y: down ? a.y + a.h : a.y },
      end: { x, y: down ? b.y : b.y + b.h },
    };
  }
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  if (bottom - top >= 16 && (a.x + a.w <= b.x || b.x + b.w <= a.x)) {
    const y = (top + bottom) / 2;
    const right = a.x < b.x;
    return {
      start: { x: right ? a.x + a.w : a.x, y },
      end: { x: right ? b.x : b.x + b.w, y },
    };
  }
  return { start: rectBorderPoint(a, rectCenter(b)), end: rectBorderPoint(b, rectCenter(a)) };
}

/**
 * Anchor for a label near `end` of a line (a multiplicity): `along` units back toward `other`,
 * then `side` units to the right of the direction of travel.
 */
export function nearEnd(end: Point, other: Point, along = 18, side = 12): Point {
  const dx = other.x - end.x;
  const dy = other.y - end.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return { x: end.x + ux * along - uy * side, y: end.y + uy * along + ux * side };
}

/** "+ add(x)" → ["+", "add(x)"]; enum values and bare names have no visibility. */
export function splitVisibility(member: string): [string, string] {
  const m = /^([+\-#~])\s*(.*)$/.exec(member);
  return m ? [m[1] ?? "", m[2] ?? ""] : ["", member];
}

/** Boxes of every class (offset by the diagram padding) and the SVG size that holds them. */
export function umlLayout(f: UmlFigure): {
  boxes: Map<string, Rect & UmlBox>;
  width: number;
  height: number;
} {
  const boxes = new Map<string, Rect & UmlBox>();
  let width = 0;
  let height = 0;
  for (const c of f.classes) {
    const b = umlBox(c);
    const r = { ...b, x: c.x + UML.pad, y: c.y + UML.pad };
    boxes.set(c.id, r);
    width = Math.max(width, r.x + r.w + UML.pad);
    height = Math.max(height, r.y + r.h + UML.pad);
  }
  return { boxes, width, height };
}

// ---------------------------------------------------------------- flowchart layout

export const FLOW = { colW: 250, rowH: 96, w: 170, h: 52, pad: 24 } as const;

/** Centre of a flowchart node in SVG units. */
export function flowCenter(n: { col: number; row: number }): { x: number; y: number } {
  return {
    x: FLOW.pad + n.col * FLOW.colW + FLOW.w / 2,
    y: FLOW.pad + n.row * FLOW.rowH + FLOW.h / 2,
  };
}

export function flowSize(f: FlowchartFigure): { width: number; height: number } {
  const cols = Math.max(...f.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...f.nodes.map((n) => n.row)) + 1;
  return {
    width: FLOW.pad * 2 + (cols - 1) * FLOW.colW + FLOW.w,
    height: FLOW.pad * 2 + (rows - 1) * FLOW.rowH + FLOW.h,
  };
}

/**
 * Edge path between two flowchart nodes: straight down/up/sideways when aligned, else an elbow
 * leaving from the bottom (or side) and entering the target's top (or side).
 */
export function flowEdgePath(
  a: { col: number; row: number },
  b: { col: number; row: number },
): string {
  const p = flowCenter(a);
  const q = flowCenter(b);
  const hw = FLOW.w / 2;
  const hh = FLOW.h / 2;
  if (a.col === b.col) {
    const dir = b.row > a.row ? 1 : -1;
    return `M${p.x},${p.y + dir * hh} L${q.x},${q.y - dir * hh}`;
  }
  const side = b.col > a.col ? 1 : -1;
  if (a.row === b.row) return `M${p.x + side * hw},${p.y} L${q.x - side * hw},${q.y}`;
  // leave sideways, then go vertically into the target's top/bottom
  const dir = b.row > a.row ? 1 : -1;
  return `M${p.x + side * hw},${p.y} L${q.x},${p.y} L${q.x},${q.y - dir * hh}`;
}

// ---------------------------------------------------------------- sequence layout

export const SEQ = { laneW: 240, head: 48, rowH: 46, pad: 20, boxW: 150 } as const;

export function sequenceSize(f: SequenceFigure): { width: number; height: number } {
  return {
    width: SEQ.pad * 2 + f.actors.length * SEQ.laneW - (SEQ.laneW - SEQ.boxW),
    height: SEQ.pad * 2 + SEQ.head + (f.messages.length + 1) * SEQ.rowH,
  };
}

/** x of an actor's lifeline. */
export function laneX(f: SequenceFigure, id: string): number {
  const i = f.actors.findIndex((a) => a.id === id);
  return SEQ.pad + i * SEQ.laneW + SEQ.boxW / 2;
}

/** "Figure N" numbers across a lesson: `${blockIndex}:${name}` → 1, 2, … in reading order. */
export function figureNumbering(blocks: { type: string; text?: string }[]): Map<string, number> {
  const out = new Map<string, number>();
  blocks.forEach((b, i) => {
    if (b.type !== "markdown" || !b.text) return;
    for (const m of b.text.matchAll(/^```figure[ \t]*\n([^\n`]*)\n```/gm)) {
      const key = `${i}:${(m[1] ?? "").trim()}`;
      if (!out.has(key)) out.set(key, out.size + 1);
    }
  });
  return out;
}
