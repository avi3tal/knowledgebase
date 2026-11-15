import type { RoadMapState, RoadMapViewSpec, Trace } from "./trace";
import { viewId } from "./trace";

/** The trace's road-map view (and its state id), if it has one. */
export function roadMapView(trace: Trace): { spec: RoadMapViewSpec; id: string } | null {
  const spec = trace.view.find((v): v is RoadMapViewSpec => v.type === "roadmap");
  return spec ? { spec, id: viewId(spec) } : null;
}

/**
 * Intersections settled by `step`: every node that has been `current` (popped from the heap) at or
 * before it. Dijkstra's invariant: a popped node's distance is final.
 */
export function settledSoFar(trace: Trace, id: string, step: number): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i <= Math.min(step, trace.steps.length - 1); i++) {
    const cur = (trace.steps[i]?.state[id] as RoadMapState | undefined)?.current;
    if (cur) out.add(cur);
  }
  return out;
}

/** "a>b" key of a road, the same in both directions (roads are undirected). */
export const roadKey = (a: string, b: string): string => (a < b ? `${a}>${b}` : `${b}>${a}`);

/** Roads on the route, as road keys. */
export function routeRoads(route: string[] | null): Set<string> {
  const out = new Set<string>();
  route?.forEach((n, i) => {
    const next = route[i + 1];
    if (next !== undefined) out.add(roadKey(n, next));
  });
  return out;
}
