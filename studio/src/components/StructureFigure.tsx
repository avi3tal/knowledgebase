import { useRef } from "react";
import type { StructureFigure as StructureSpec } from "../figures";
import { structureFrame } from "../figures";
import { useFitScale } from "../fit";
import type {
  ArrayState,
  CallStackState,
  FigureViewSpec,
  GraphState,
  GridState,
  IntervalsState,
  LinkedListState,
  MapState,
  MazeState,
  RoadMapState,
  TreeState,
  VarsState,
  ViewState,
} from "../trace";
import { viewId } from "../trace";
import * as S from "./StructureFigure.style";
import {
  CallStackView,
  GraphView,
  GridView,
  HeapView,
  IntervalsView,
  TreeView,
} from "./StructureViews";
import { ArrayView, LinkedListView, MapView, VarsView } from "./TraceViews";
import type { MazeExtras } from "./MazeView";
import { MazeView } from "./MazeView";
import type { RoadExtras } from "./RoadMapView";
import { RoadMapView } from "./RoadMapView";

/**
 * One view of a trace step or figure frame: the single dispatcher shared by the trace player and
 * structure figures. `prev` (the previous step's state) lets map / vars views highlight changes;
 * `maze` carries the maze scene's extras (heat, Predict mode); `road` the road map's (settled set).
 */
export function ViewFor({
  spec,
  state,
  prev,
  maze,
  road,
}: {
  spec: FigureViewSpec;
  state: ViewState;
  prev?: ViewState;
  maze?: MazeExtras;
  road?: RoadExtras;
}) {
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
    case "roadmap":
      return <RoadMapView spec={spec} state={state as RoadMapState} {...road} />;
    case "maze":
      return <MazeView spec={spec} state={state as MazeState} {...maze} />;
    case "vars":
      return (
        <VarsView spec={spec} state={state as VarsState} prev={prev as VarsState | undefined} />
      );
  }
}

/** How much a still may grow to fill its frame, and how tall it may get inline (not expanded). */
const MAX_SCALE = 2.25;
const INLINE_MAX_HEIGHT = 460;

/**
 * A data-structure still: the figure's views stacked as the trace player shows them, for the
 * current frame (`step` -1 = the resting picture = frame 1), scaled up to fill the figure (the
 * views are drawn at trace-player size, which looks lost in a wide figure). Changes since the
 * previous frame are highlighted by the views themselves.
 */
export function StructureFigure({
  f,
  step,
  expanded = false,
}: {
  f: StructureSpec;
  step: number;
  expanded?: boolean;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const { scale, natural } = useFitScale(outer, inner, {
    max: expanded ? MAX_SCALE * 1.6 : MAX_SCALE,
    maxHeight: expanded ? undefined : INLINE_MAX_HEIGHT,
  });
  const frame = structureFrame(f, step);
  const prev = step > 0 ? f.frames[step - 1] : undefined;
  if (!frame) return null;
  return (
    <S.Fit ref={outer} $expanded={expanded}>
      <S.Scaled $w={natural.w * scale} $h={natural.h * scale}>
        <S.Views ref={inner} $scale={scale}>
          {f.views.map((spec) => {
            const id = viewId(spec);
            const state = frame.state?.[id];
            return state ? (
              <ViewFor key={id} spec={spec} state={state} prev={prev?.state?.[id]} />
            ) : null;
          })}
        </S.Views>
      </S.Scaled>
    </S.Fit>
  );
}
