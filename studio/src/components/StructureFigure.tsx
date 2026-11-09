import type { StructureFigure as StructureSpec } from "../figures";
import { structureFrame } from "../figures";
import type {
  ArrayState,
  CallStackState,
  FigureViewSpec,
  GraphState,
  GridState,
  IntervalsState,
  LinkedListState,
  MapState,
  TreeState,
  VarsState,
  ViewState,
} from "../trace";
import { viewId } from "../trace";
import {
  CallStackView,
  GraphView,
  GridView,
  HeapView,
  IntervalsView,
  TreeView,
} from "./StructureViews";
import { ArrayView, LinkedListView, MapView, VarsView } from "./TraceViews";

/** One trace view for a figure frame (same renderers as the trace player, plus `graph`). */
function View({ spec, state, prev }: { spec: FigureViewSpec; state: ViewState; prev?: ViewState }) {
  switch (spec.type) {
    case "array":
      return <ArrayView spec={spec} state={state as ArrayState} />;
    case "tree":
      return <TreeView spec={spec} state={state as TreeState} />;
    case "heap":
      return <HeapView spec={spec} state={state as ArrayState} />;
    case "grid":
      return <GridView spec={spec} state={state as GridState} />;
    case "intervals":
      return <IntervalsView spec={spec} state={state as IntervalsState} />;
    case "callstack":
      return <CallStackView spec={spec} state={state as CallStackState} />;
    case "linkedlist":
      return <LinkedListView spec={spec} state={state as LinkedListState} />;
    case "graph":
      return <GraphView spec={spec} state={state as GraphState} />;
    case "map":
      return <MapView spec={spec} state={state as MapState} prev={prev as MapState | undefined} />;
    case "vars":
      return (
        <VarsView spec={spec} state={state as VarsState} prev={prev as VarsState | undefined} />
      );
  }
}

/**
 * A data-structure still: the figure's views stacked as the trace player shows them, for the
 * current frame (`step` -1 = the resting picture = frame 1). Changes since the previous frame
 * are highlighted by the views themselves.
 */
export function StructureFigure({ f, step }: { f: StructureSpec; step: number }) {
  const frame = structureFrame(f, step);
  const prev = step > 0 ? f.frames[step - 1] : undefined;
  if (!frame) return null;
  return (
    <div className="viz fig-views">
      {f.views.map((spec) => {
        const id = viewId(spec);
        const state = frame.state[id];
        return state ? <View key={id} spec={spec} state={state} prev={prev?.state[id]} /> : null;
      })}
    </div>
  );
}
