import { useId } from "react";
import type { UmlFigure as UmlSpec, UmlRelation } from "../figures";
import { STEREOTYPE_LABEL, UML, nearEnd, splitVisibility, umlEdge, umlLayout } from "../figures";

/** Marker shapes; each comes in three colours (normal / highlighted / failed). */
const SHAPES = {
  // hollow triangle, tip at the parent's border
  tri: { d: "M0,0 L14,7 L0,14 z", w: 14, h: 14, refX: 14, fill: "hollow" },
  // diamond at the whole, starting at its border
  diamond: { d: "M0,6 L9,0 L18,6 L9,12 z", w: 18, h: 12, refX: 0, fill: "hollow" },
  filled: { d: "M0,6 L9,0 L18,6 L9,12 z", w: 18, h: 12, refX: 0, fill: "solid" },
  open: { d: "M0,0 L11,6 L0,12", w: 12, h: 12, refX: 11, fill: "none" },
} as const;
type Shape = keyof typeof SHAPES;
const TONES = ["base", "on", "failed"] as const;
type Tone = (typeof TONES)[number];

/** [marker at `from`, marker at `to`, dashed] for a relation. */
function ends(r: UmlRelation): [Shape | null, Shape | null, boolean] {
  switch (r.type) {
    case "inherits":
      return [null, "tri", false];
    case "implements":
      return [null, "tri", true];
    case "composition":
      return ["filled", null, false];
    case "aggregation":
      return ["diamond", null, false];
    case "dependency":
      return [null, "open", true];
    default:
      return [null, r.navigable ? "open" : null, false];
  }
}

const VIS_CLASS: Record<string, string> = { "+": "pub", "-": "priv", "#": "prot", "~": "pkg" };

/**
 * A UML class diagram: class boxes (stereotype, name, fields, methods) and relations with proper
 * UML arrowheads. Steps highlight classes and relations; `fail` turns them red with ✕.
 */
export function UmlFigure({ f, active }: { f: UmlSpec; active: number }) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const { boxes, width, height } = umlLayout(f);
  const step = active >= 0 ? f.steps?.[active] : undefined;
  const litNodes = new Set(step?.nodes ?? []);
  const litEdges = new Set(step?.edges ?? []);
  const failed = new Set(step?.fail ?? []);
  const dim = active >= 0;
  const toneOf = (key: string, lit: Set<string>): Tone =>
    failed.has(key) ? "failed" : lit.has(key) ? "on" : "base";
  const marker = (s: Shape | null, t: Tone) => (s ? `url(#${uid}-${s}-${t})` : undefined);

  return (
    <svg
      className="fig-svg uml"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width }}
      role="img"
    >
      <title>{f.title}</title>
      <defs>
        {TONES.flatMap((t) =>
          (Object.keys(SHAPES) as Shape[]).map((s) => {
            const m = SHAPES[s];
            return (
              <marker
                key={`${s}-${t}`}
                id={`${uid}-${s}-${t}`}
                viewBox={`-1 -1 ${m.w + 2} ${m.h + 2}`}
                refX={m.refX}
                refY={m.h / 2}
                markerWidth={m.w + 2}
                markerHeight={m.h + 2}
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d={m.d} className={`uml-head ${m.fill} ${t}`} />
              </marker>
            );
          }),
        )}
      </defs>
      {(f.relations ?? []).map((r) => {
        const a = boxes.get(r.from);
        const b = boxes.get(r.to);
        if (!a || !b) return null;
        const key = `${r.from}>${r.to}`;
        const tone = toneOf(key, litEdges);
        const state = tone !== "base" ? tone : dim ? "dim" : "";
        const [startShape, endShape, dashed] = ends(r);
        const { start, end } = umlEdge(a, b);
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const fromM = nearEnd(start, end);
        const toM = nearEnd(end, start);
        return (
          <g key={key} className={`uml-rel ${r.type} ${dashed ? "dashed" : ""} ${state}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              markerStart={marker(startShape, tone)}
              markerEnd={marker(endShape, tone)}
            />
            {r.label && (
              <text className="uml-rel-label" x={mid.x} y={mid.y - 6} textAnchor="middle">
                {r.label}
              </text>
            )}
            {r.from_mult && (
              <text className="uml-mult" x={fromM.x} y={fromM.y + 4} textAnchor="middle">
                {r.from_mult}
              </text>
            )}
            {r.to_mult && (
              <text className="uml-mult" x={toM.x} y={toM.y + 4} textAnchor="middle">
                {r.to_mult}
              </text>
            )}
            {tone === "failed" && (
              <text className="flow-fail" x={mid.x} y={mid.y + 6} textAnchor="middle">
                ✕
              </text>
            )}
          </g>
        );
      })}
      {f.classes.map((c) => {
        const b = boxes.get(c.id);
        if (!b) return null;
        const tone = toneOf(c.id, litNodes);
        const state = tone !== "base" ? tone : dim ? "dim" : "";
        const r = 6;
        const headerPath = `M0,${b.header} V${r} A${r},${r} 0 0 1 ${r},0 H${b.w - r} A${r},${r} 0 0 1 ${b.w},${r} V${b.header} Z`;
        const nameY = UML.padY + (c.stereotype ? UML.stereo : 0) + 15;
        const member = (text: string, i: number, top: number) => {
          const [vis, rest] = splitVisibility(text);
          return (
            <text
              key={i}
              className="uml-member"
              x={UML.padX}
              y={top + UML.padY + i * UML.line + 13}
            >
              {vis && <tspan className={`uml-vis ${VIS_CLASS[vis] ?? ""}`}>{vis} </tspan>}
              <tspan>{rest}</tspan>
            </text>
          );
        };
        const methodsTop = b.header + b.fields;
        return (
          <g
            key={c.id}
            className={`uml-class ${c.stereotype ?? ""} ${state}`}
            transform={`translate(${b.x} ${b.y})`}
          >
            <rect className="uml-box" width={b.w} height={b.h} rx={r} />
            <path className="uml-header" d={headerPath} />
            {c.stereotype && (
              <text className="uml-stereo" x={b.w / 2} y={UML.padY + 10} textAnchor="middle">
                {STEREOTYPE_LABEL[c.stereotype]}
              </text>
            )}
            <text className="uml-name" x={b.w / 2} y={nameY} textAnchor="middle">
              {c.name}
            </text>
            <line className="uml-sep" x1={0} y1={b.header} x2={b.w} y2={b.header} />
            {(c.fields ?? []).map((m, i) => member(m, i, b.header))}
            {b.methods > 0 && (
              <line className="uml-sep" x1={0} y1={methodsTop} x2={b.w} y2={methodsTop} />
            )}
            {(c.methods ?? []).map((m, i) => member(m, i, methodsTop))}
            <rect className="uml-outline" width={b.w} height={b.h} rx={r} />
            {tone === "failed" && (
              <text className="flow-fail" x={b.w - 10} y={16} textAnchor="middle">
                ✕
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
