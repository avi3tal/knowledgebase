import type { RoadMapState, RoadMapViewSpec } from "../trace";
import { roadKey, routeRoads } from "../roadmap";
import * as TV from "./TraceViews.style";
import type { NodeTone } from "./RoadMapView.style";
import * as S from "./RoadMapView.style";

export interface RoadExtras {
  /** intersections whose distance is final (popped so far) */
  settled?: Set<string>;
}

type Point = { x: number; y: number };
type Spots = Map<string, Point & { name: string }>;

/** Layout units -> SVG units. */
function placeAll(state: RoadMapState): Spots {
  return new Map(
    state.nodes.map((n) => [
      n.id,
      { name: n.name, x: S.ROAD_PAD + n.x * S.ROAD_UNIT, y: S.ROAD_PAD + n.y * S.ROAD_UNIT },
    ]),
  );
}

/** Each road with both ends placed, keyed and in both directions' key form. */
function placedRoads(state: RoadMapState, spots: Spots) {
  return state.roads.flatMap((r) => {
    const a = spots.get(r.a);
    const b = spots.get(r.b);
    return a && b ? [{ key: roadKey(r.a, r.b), w: r.w, a, b }] : [];
  });
}

function Roads({ state, spots }: { state: RoadMapState; spots: Spots }) {
  const relaxed = state.relax && roadKey(state.relax[0], state.relax[1]);
  return (
    <>
      {placedRoads(state, spots).map(({ key, a, b }) => {
        const ends = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
        return (
          <g key={key}>
            <S.Asphalt {...ends} $relaxed={key === relaxed} />
            <S.CentreLine {...ends} />
          </g>
        );
      })}
    </>
  );
}

/** Travel times, above the route line so they stay readable. */
function Times({ state, spots }: { state: RoadMapState; spots: Spots }) {
  const onRoute = routeRoads(state.route);
  return (
    <>
      {placedRoads(state, spots).map(({ key, w, a, b }) => (
        <S.At key={key} $x={(a.x + b.x) / 2} $y={(a.y + b.y) / 2}>
          <S.Pill $on={onRoute.has(key)} />
          <S.PillText $on={onRoute.has(key)}>{w === null ? "" : `${String(w)} min`}</S.PillText>
        </S.At>
      ))}
    </>
  );
}

function toneOf(state: RoadMapState, id: string, settled?: Set<string>): NodeTone {
  if (state.current === id) return "current";
  if (settled?.has(id)) return "settled";
  return state.frontier.includes(id) ? "waiting" : "idle";
}

function Places({ state, spots, settled }: { state: RoadMapState; spots: Spots } & RoadExtras) {
  return (
    <>
      {[...spots.entries()].map(([id, p]) => (
        <S.At key={id} $x={p.x} $y={p.y}>
          <S.Spot $tone={toneOf(state, id, settled)} />
          <S.Initial>{p.name.slice(0, 1)}</S.Initial>
          <S.PlaceName>{p.name}</S.PlaceName>
          {state.dist[id] !== undefined && <S.DistTag>{String(state.dist[id])}</S.DistTag>}
          {state.goal === id && <S.GoalFlag />}
        </S.At>
      ))}
    </>
  );
}

/** The route's points and SVG path data. */
function routePath(route: string[], spots: Spots) {
  const pts = route.flatMap((id) => {
    const p = spots.get(id);
    return p ? [p] : [];
  });
  return { pts, d: pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ") };
}

/** The cheapest route, drawn over the roads. */
function RouteLine({ route, spots }: { route: string[]; spots: Spots }) {
  const { pts, d } = routePath(route, spots);
  return <S.RouteLine key={d} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />;
}

/** Then a car drives it, on top of everything. */
function CarOnRoute({ route, spots }: { route: string[]; spots: Spots }) {
  const { pts, d } = routePath(route, spots);
  return <S.Car key={d} $path={d} $stops={pts.length} />;
}

function Legend() {
  const item = (tone: NodeTone | "route", text: string) => (
    <span key={tone}>
      <S.Dot $tone={tone} />
      {text}
    </span>
  );
  return (
    <S.Legend>
      {item("current", "being settled")}
      {item("waiting", "in the heap")}
      {item("settled", "distance final")}
      {item("route", "cheapest route")}
    </S.Legend>
  );
}

/** A weighted graph as a town: roads with travel times, intersections settling, a car on the route. */
export function RoadMapView({
  spec,
  state,
  settled,
}: {
  spec: RoadMapViewSpec;
  state: RoadMapState;
} & RoadExtras) {
  const spots = placeAll(state);
  const xs = [...spots.values()].map((p) => p.x);
  const ys = [...spots.values()].map((p) => p.y);
  const width = Math.max(...xs) + S.ROAD_PAD;
  const height = Math.max(...ys) + S.ROAD_PAD;
  return (
    <TV.Block>
      {spec.label && <TV.Label>{spec.label}</TV.Label>}
      <S.Svg viewBox={`0 0 ${width} ${height}`} $width={width} role="img" aria-label="town map">
        <Roads state={state} spots={spots} />
        {state.route && <RouteLine route={state.route} spots={spots} />}
        <Times state={state} spots={spots} />
        <Places state={state} spots={spots} settled={settled} />
        {state.route && <CarOnRoute route={state.route} spots={spots} />}
      </S.Svg>
      <Legend />
    </TV.Block>
  );
}
