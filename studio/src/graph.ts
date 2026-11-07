import type { GraphEdge, GraphNode } from "./api";

export interface PlacedNode extends GraphNode {
  x: number;
  y: number;
  role: "center" | "prereq" | "related" | "next" | "problem" | "resource";
}

export const VIEW = { width: 760, height: 480, cx: 380, cy: 230, r: 185 };

/** Which side of the centre a neighbour belongs to (from the edge that links them). */
export function roleOf(center: string, node: GraphNode, edges: GraphEdge[]): PlacedNode["role"] {
  if (node.id === center) return "center";
  if (node.type === "problem") return "problem";
  if (node.type === "ref" || node.type === "source") return "resource";
  if (edges.some((e) => e.type === "prereq" && e.from === node.id && e.to === center))
    return "prereq";
  if (edges.some((e) => e.type === "prereq" && e.from === center && e.to === node.id))
    return "next";
  return "related";
}

const SECTORS: Record<Exclude<PlacedNode["role"], "center">, [number, number]> = {
  prereq: [200, 250], // upper-left: what you need first
  related: [260, 300], // top
  next: [310, 345], // upper-right: what this unlocks
  problem: [100, 175], // bottom-left
  resource: [10, 85], // bottom-right
};

/** Deterministic radial layout: centre in the middle, neighbours spread evenly within their sector. */
export function radialLayout(center: string, nodes: GraphNode[], edges: GraphEdge[]): PlacedNode[] {
  const byRole = new Map<PlacedNode["role"], GraphNode[]>();
  for (const n of [...nodes].sort((a, b) => a.label.localeCompare(b.label))) {
    if (n.type === "source") continue; // refs already name their source
    const role = roleOf(center, n, edges);
    byRole.set(role, [...(byRole.get(role) ?? []), n]);
  }
  const out: PlacedNode[] = [];
  for (const [role, group] of byRole) {
    if (role === "center") {
      for (const n of group) out.push({ ...n, role, x: VIEW.cx, y: VIEW.cy });
      continue;
    }
    const [a0, a1] = SECTORS[role];
    group.forEach((n, i) => {
      const t = group.length === 1 ? 0.5 : i / (group.length - 1);
      const angle = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const r = VIEW.r * (group.length > 6 && i % 2 ? 0.78 : 1); // stagger crowded sectors
      out.push({ ...n, role, x: VIEW.cx + r * Math.cos(angle), y: VIEW.cy + r * Math.sin(angle) });
    });
  }
  return out;
}

export function nodeHref(subject: string, n: GraphNode): string | null {
  const [, id] = n.id.split(":");
  if (n.type === "topic") return `#/topic/${subject}/${id}`;
  if (n.type === "problem") return `#/problem/${subject}/${id}`;
  if (n.type === "ref") return n.url ?? null;
  return null;
}
