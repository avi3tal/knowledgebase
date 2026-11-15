import { useEffect, useMemo, useState } from "react";
import type { RaceRunner } from "../api";
import { expansionSteps, mazeColours, mazeView, raceStep, routeSoFar } from "../maze";
import type { MazeState, Trace } from "../trace";
import { Muted } from "../theme/primitives";
import { Icon } from "./Icon";
import { MazeView } from "./MazeView";
import * as P from "./TracePlayer.style";
import * as S from "./RacePlayer.style";

const SPEEDS = [500, 260, 120];

interface Lane {
  runner: RaceRunner;
  trace: Trace;
  id: string;
  expansions: number[];
}

/** Every runner with its trace and race timeline (runners without a maze trace are dropped). */
function lanesOf(runners: RaceRunner[], traces: Record<string, Trace>): Lane[] {
  return runners.flatMap((runner) => {
    const trace = traces[runner.trace];
    const maze = trace && mazeView(trace);
    return trace && maze
      ? [{ runner, trace, id: maze.id, expansions: expansionSteps(trace, maze.id) }]
      : [];
  });
}

/** The shared race clock: one tick = every runner expands its next cell. */
function useRaceClock(ticks: number, speed: number) {
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (tick >= ticks - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setTick((k) => k + 1), SPEEDS[speed] ?? 260);
    return () => clearTimeout(t);
  }, [playing, tick, ticks, speed]);
  return { tick, playing, setPlaying, setTick };
}

/** Several searches on the same maze, side by side, one expansion per tick; kb's scoreboard at the end. */
export function RacePlayer({
  title,
  runners,
  traces,
}: {
  title: string;
  runners: RaceRunner[];
  traces: Record<string, Trace>;
}) {
  const lanes = useMemo(() => lanesOf(runners, traces), [runners, traces]);
  const ticks = Math.max(1, ...lanes.map((l) => l.expansions.length + 1));
  const [speed, setSpeed] = useState(1);
  const clock = useRaceClock(ticks, speed);
  const done = clock.tick >= ticks - 1;
  const best = Math.min(...lanes.map((l) => l.runner.stats.moves ?? Infinity));
  return (
    <S.Race>
      <S.Title>{title}</S.Title>
      <S.Sub>Same maze, same start and goal. Each tick, every search expands one more cell.</S.Sub>
      <S.Lanes>
        {lanes.map((l) => (
          <RaceLane
            key={l.runner.label}
            lane={l}
            tick={clock.tick}
            winner={done && l.runner.stats.moves === best}
          />
        ))}
      </S.Lanes>
      <RaceBar clock={clock} ticks={ticks} done={done} speed={speed} setSpeed={setSpeed} />
      {done && <Scoreboard lanes={lanes} best={best} />}
    </S.Race>
  );
}

type Clock = ReturnType<typeof useRaceClock>;

function RaceBar({
  clock,
  ticks,
  done,
  speed,
  setSpeed,
}: {
  clock: Clock;
  ticks: number;
  done: boolean;
  speed: number;
  setSpeed: (n: number) => void;
}) {
  const label = done
    ? "race again"
    : clock.playing
      ? "pause"
      : clock.tick
        ? "resume"
        : "start the race";
  const reset = () => {
    clock.setPlaying(false);
    clock.setTick(0);
  };
  return (
    <S.Bar>
      <P.Btn $primary onClick={() => (done ? reset() : clock.setPlaying(!clock.playing))}>
        <Icon name="play" size={12} /> {label}
      </P.Btn>
      <P.Btn onClick={reset}>reset</P.Btn>
      <Muted>
        tick {clock.tick + 1}/{ticks}
      </Muted>
      <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed">
        <option value={0}>slow</option>
        <option value={1}>normal</option>
        <option value={2}>fast</option>
      </select>
    </S.Bar>
  );
}

function RaceLane({ lane, tick, winner }: { lane: Lane; tick: number; winner: boolean }) {
  const { trace, id, expansions, runner } = lane;
  const last = trace.steps.length - 1;
  const step = raceStep(expansions, tick, last);
  const state = trace.steps[step]?.state[id] as MazeState | undefined;
  const colours = useMemo(() => mazeColours(trace), [trace]);
  const spec = mazeView(trace)?.spec;
  const finished = tick >= expansions.length;
  if (!state || !spec) return null;
  return (
    <S.Lane $winner={winner}>
      <S.LaneHead>
        <S.Runner>{runner.label}</S.Runner>
        <S.Counter>
          expanded {Math.min(tick + 1, expansions.length)}/{expansions.length}
        </S.Counter>
      </S.LaneHead>
      <MazeView
        spec={{ ...spec, label: undefined }}
        state={state}
        {...colours}
        route={routeSoFar(trace, id, step)}
      />
      <S.Status $done={finished}>
        {finished
          ? runner.stats.moves !== null
            ? `Reached the goal: a ${runner.stats.moves}-move route`
            : "No route: the goal is walled off"
          : "searching…"}
      </S.Status>
    </S.Lane>
  );
}

function Scoreboard({ lanes, best }: { lanes: Lane[]; best: number }) {
  const fewest = Math.min(...lanes.map((l) => l.runner.stats.expanded));
  return (
    <S.Board>
      {lanes.map(({ runner }) => (
        <p key={runner.label}>
          <b>{runner.label}</b>: {runner.stats.moves ?? "no"} moves, after expanding{" "}
          {runner.stats.expanded} cells
          {runner.stats.moves === best && <S.Badge $tone="ok">shortest route</S.Badge>}
          {runner.stats.expanded === fewest && <S.Badge $tone="accent">least work</S.Badge>}
        </p>
      ))}
    </S.Board>
  );
}
