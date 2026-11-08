/** Lesson figures (spec format: tools/kb/figures.py). Pure helpers; tested in figures.test.ts. */
import type { Diagram } from "./api";
import type { Highlight } from "./design";

export interface FigureStep {
  text: string;
  nodes?: string[];
  /** "from>to" */
  edges?: string[];
  /** nodes or "from>to" edges that fail in this step (drawn red with ✕) */
  fail?: string[];
}
/** What a scenario is about; drives its tab icon and colour. */
export type ScenarioTone = "happy" | "failure" | "edge" | "alternative" | "risk";
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
export type Figure = ArchitectureFigure | FlowchartFigure | SequenceFigure;

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

export function stepsOf(f: Figure): FigureStep[] {
  return f.kind === "sequence" ? sequenceSteps(f) : (f.steps ?? []);
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
