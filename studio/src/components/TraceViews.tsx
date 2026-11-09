import type {
  ArrayState,
  ArrayViewSpec,
  Json,
  LinkedListState,
  LinkedListViewSpec,
  MapState,
  MapViewSpec,
  VarsState,
  VarsViewSpec,
} from "../trace";
import { changedKeys, changedVars, inWindow, linkKind } from "../trace";
import { Muted } from "../theme/primitives";
import * as S from "./TraceViews.style";

const show = (v: Json | undefined): string =>
  v === undefined || v === null ? "—" : typeof v === "string" ? v : JSON.stringify(v);

const CELL = 48; // px — keep in sync with the Cell width (42) + the Cells gap (6)

export function ArrayView({ spec, state }: { spec: ArrayViewSpec; state: ArrayState }) {
  const pointers = Object.entries(state.pointers).filter(
    (e): e is [string, number] => typeof e[1] === "number",
  );
  const win = state.window;
  return (
    <S.Block>
      <S.Label>{spec.label ?? spec.var}</S.Label>
      <S.Cells
        $width={Math.max(1, state.values.length) * CELL}
        // room for every pointer row (labels stack 22px apart under the cells)
        $paddingBottom={Math.max(56, 12 + Object.keys(state.pointers).length * 22)}
      >
        {win && <S.WindowFrame $left={win[0] * CELL} $width={(win[1] - win[0] + 1) * CELL - 6} />}
        {state.values.map((v, i) => (
          <S.Cell key={i} $on={inWindow(state, i)}>
            <S.CellValue>{show(v)}</S.CellValue>
            <S.CellIndex>{i}</S.CellIndex>
          </S.Cell>
        ))}
        {pointers.map(([name, idx], k) => (
          <S.Pointer key={name} $k={k} $x={idx * CELL} $top={64 + k * 22}>
            ▲ {name}
          </S.Pointer>
        ))}
      </S.Cells>
    </S.Block>
  );
}

export function MapView({
  spec,
  state,
  prev,
}: {
  spec: MapViewSpec;
  state: MapState;
  prev?: MapState;
}) {
  const changed = changedKeys(prev, state);
  return (
    <S.Block>
      <S.Label>{spec.label ?? spec.var}</S.Label>
      <S.MapBox>
        {state.entries.length === 0 && <Muted>empty</Muted>}
        {state.entries.map(([k, v]) => (
          <S.MapEntry key={JSON.stringify(k)} $changed={changed.has(JSON.stringify(k))}>
            <b>{show(k)}</b>
            {v !== null && <span> → {show(v)}</span>}
          </S.MapEntry>
        ))}
      </S.MapBox>
    </S.Block>
  );
}

export function VarsView({
  spec,
  state,
  prev,
}: {
  spec: VarsViewSpec;
  state: VarsState;
  prev?: VarsState;
}) {
  const changed = changedVars(prev, state);
  return (
    <S.Block>
      {spec.label && <S.Label>{spec.label}</S.Label>}
      <S.Vars>
        {Object.entries(state.values).map(([k, v]) => (
          <S.Var key={k} $changed={changed.has(k)}>
            <S.VarName>{k}</S.VarName>
            <S.VarValue>{show(v)}</S.VarValue>
          </S.Var>
        ))}
      </S.Vars>
    </S.Block>
  );
}

const NODE_W = 46;
const NODE_STEP = 78;
const NODE_TOP = 58;
const NODE_H = 38;

export function LinkedListView({
  spec,
  state,
}: {
  spec: LinkedListViewSpec;
  state: LinkedListState;
}) {
  const pos = new Map(state.nodes.map((n, i) => [n.id, i]));
  const x = (i: number) => i * NODE_STEP;
  const pointers = Object.entries(state.pointers);
  const width = Math.max(1, state.nodes.length) * NODE_STEP;
  const height = NODE_TOP + NODE_H + 46;
  return (
    <S.Block>
      <S.Label>{spec.label ?? spec.var}</S.Label>
      <S.LinkedList $width={width} $height={height}>
        <S.Links width={width} height={height}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {state.nodes.map((n, i) => {
            const kind = linkKind(state, i);
            const from = x(i) + NODE_W;
            const midY = NODE_TOP + NODE_H / 2;
            if (kind === "none") {
              return (
                <S.NullLink key={n.id} x={from + 6} y={midY + 4}>
                  ∅
                </S.NullLink>
              );
            }
            const target = n.next === null ? 0 : (pos.get(n.next) ?? 0);
            if (kind === "forward") {
              return (
                <S.Link
                  key={n.id}
                  $kind="forward"
                  d={`M ${from} ${midY} L ${x(target) - 2} ${midY}`}
                  markerEnd="url(#arrow)"
                />
              );
            }
            // Curved arrow below the row for reversed links / cycles, above for forward skips.
            const back = kind === "back";
            const startX = x(i) + NODE_W / 2;
            const endX = x(target) + NODE_W / 2;
            const y0 = back ? NODE_TOP + NODE_H : NODE_TOP;
            const bend = back ? NODE_TOP + NODE_H + 34 : NODE_TOP - 26;
            return (
              <S.Link
                key={n.id}
                $kind={back ? "back" : "skip"}
                d={`M ${startX} ${y0} C ${startX} ${bend}, ${endX} ${bend}, ${endX} ${y0 + (back ? 2 : -2)}`}
                markerEnd="url(#arrow)"
              />
            );
          })}
        </S.Links>
        {state.nodes.map((n, i) => (
          <S.ListNode key={n.id} $left={x(i)} $top={NODE_TOP} $width={NODE_W} $height={NODE_H}>
            {show(n.val)}
          </S.ListNode>
        ))}
        {pointers.map(([name, id], k) => (
          <S.Pointer
            key={name}
            $k={k}
            $faded={id === null}
            $x={id === null ? -NODE_STEP * 0.6 : x(pos.get(id) ?? 0)}
            $top={k * 16}
            $width={NODE_W}
          >
            {name}
            {id === null ? " = ∅" : " ▼"}
          </S.Pointer>
        ))}
      </S.LinkedList>
    </S.Block>
  );
}
