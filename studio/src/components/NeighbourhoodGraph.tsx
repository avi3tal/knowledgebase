import type { Graph } from "../api";
import { VIEW, nodeHref, radialLayout } from "../graph";
import { Muted } from "../theme/primitives";
import * as S from "./NeighbourhoodGraph.style";

const LEGEND = [
  ["prereq", "learn first"],
  ["next", "unlocks"],
  ["related", "related"],
  ["problem", "practice"],
  ["resource", "resources"],
] as const;

export function NeighbourhoodGraph({ graph, subject }: { graph: Graph; subject: string }) {
  if (!graph.center) return null;
  const placed = radialLayout(graph.center, graph.nodes, graph.edges);
  const pos = new Map(placed.map((p) => [p.id, p]));
  const cut = (s: string) => (s.length > 26 ? s.slice(0, 24) + "…" : s);
  return (
    <S.Root>
      <S.Svg
        width="100%"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {placed
          .filter((p) => p.role !== "center")
          .map((p) => (
            <S.Edge key={`l-${p.id}`} $role={p.role} x1={VIEW.cx} y1={VIEW.cy} x2={p.x} y2={p.y} />
          ))}
        {placed.map((p) => {
          const href = nodeHref(subject, p);
          const body = (
            <S.Node $role={p.role} $type={p.type}>
              <circle cx={p.x} cy={p.y} r={p.role === "center" ? 12 : 7} />
              <text x={p.x} y={p.y + (p.y < VIEW.cy ? -12 : 19)} textAnchor="middle">
                {cut(p.label)}
              </text>
            </S.Node>
          );
          return href ? (
            <S.NodeLink
              key={p.id}
              href={href}
              target={p.type === "ref" ? "_blank" : undefined}
              rel="noreferrer"
            >
              {body}
            </S.NodeLink>
          ) : (
            <g key={p.id}>{body}</g>
          );
        })}
      </S.Svg>
      <S.Legend>
        {LEGEND.map(([role, label]) => (
          <S.LegendItem key={role} $role={role}>
            ● {label}
          </S.LegendItem>
        ))}
        <Muted>{pos.size - 1} neighbours</Muted>
      </S.Legend>
    </S.Root>
  );
}
