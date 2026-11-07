import type { Graph } from "../api";
import { VIEW, nodeHref, radialLayout } from "../graph";

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
    <section className="neighbourhood">
      <svg width={VIEW.width} height={VIEW.height} viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}>
        {placed
          .filter((p) => p.role !== "center")
          .map((p) => (
            <line
              key={`l-${p.id}`}
              className={`g-edge ${p.role}`}
              x1={VIEW.cx}
              y1={VIEW.cy}
              x2={p.x}
              y2={p.y}
            />
          ))}
        {placed.map((p) => {
          const href = nodeHref(subject, p);
          const body = (
            <g className={`g-node ${p.role} ${p.type}`}>
              <circle cx={p.x} cy={p.y} r={p.role === "center" ? 12 : 7} />
              <text x={p.x} y={p.y + (p.y < VIEW.cy ? -12 : 19)} textAnchor="middle">
                {cut(p.label)}
              </text>
            </g>
          );
          return href ? (
            <a
              key={p.id}
              href={href}
              target={p.type === "ref" ? "_blank" : undefined}
              rel="noreferrer"
            >
              {body}
            </a>
          ) : (
            <g key={p.id}>{body}</g>
          );
        })}
      </svg>
      <div className="legend">
        {LEGEND.map(([role, label]) => (
          <span key={role} className={`g-legend ${role}`}>
            ● {label}
          </span>
        ))}
        <span className="muted">{pos.size - 1} neighbours</span>
      </div>
    </section>
  );
}
