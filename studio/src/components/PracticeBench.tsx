import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "../api";
import { api } from "../api";
import type { Counts } from "../practice-bench";
import { pct, withSession } from "../practice-bench";
import { FOCUS_INFO, STATUS_LABEL, groupByStatus } from "../sessions";
import { MutedP } from "../theme/primitives";
import { t } from "../theme/theme";
import * as S from "./PracticeBench.style";
import type { NavGroup } from "./panes";

/** Shared pieces of the Practice pages (problems, problem, progress, sessions) on the Workbench. */

/** A command that copies itself on click. */
export function Copy({
  text,
  label,
  inline,
}: {
  text: string;
  label?: string;
  /** narrow form for attempt rows */
  inline?: boolean;
}) {
  const [done, setDone] = useState(false);
  return (
    <S.Cmd
      $inline={inline}
      title="click to copy"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? "copied ✓" : (label ?? text)}
    </S.Cmd>
  );
}

/** A stacked solved / failing / untried bar with a legend. */
export function StatusBar({
  c,
  legend = true,
  inline,
  className,
}: {
  c: Counts;
  legend?: boolean;
  /** bar and legend in one row (workbench footers) */
  inline?: boolean;
  className?: string;
}) {
  const w = (n: number) => `${c.total ? (100 * n) / c.total : 0}%`;
  return (
    <S.StatBar $inline={inline} className={className}>
      <S.Bar
        $inline={inline}
        title={`${c.solved} solved · ${c.failing} failing · ${c.untried} untried`}
      >
        <S.BarFill $kind="solved" $width={w(c.solved)} />
        <S.BarFill $kind="failing" $width={w(c.failing)} />
      </S.Bar>
      {legend && (
        <S.Legend $inline={inline}>
          <S.LegendItem $kind="solved">✓ {c.solved}</S.LegendItem>
          <S.LegendItem $kind="failing">✗ {c.failing}</S.LegendItem>
          <S.LegendItem $kind="untried">○ {c.untried}</S.LegendItem>
          <S.LegendPct>{pct(c.solved, c.total)}%</S.LegendPct>
        </S.Legend>
      )}
    </S.StatBar>
  );
}

/** A labelled number in a page header. */
export function Stat({ n, label, tone }: { n: ReactNode; label: string; tone?: string }) {
  return (
    <S.StatBox $tone={tone}>
      <b>{n}</b>
      {label}
    </S.StatBox>
  );
}

// ---------------------------------------------------------------- sessions left pane

// The page remounts on every hash change (App keys it): keep the list between sessions.
let sessionsCache: Session[] | null = null;

/** Every session (seeded from `initial` when given), with `live` over its stored copy. */
export function useSessions(initial?: Session[], live?: Session) {
  const [list, setList] = useState<Session[] | null>(() => initial ?? sessionsCache);
  useEffect(() => {
    if (initial) {
      sessionsCache = initial;
      return;
    }
    let on = true;
    api.sessions().then(
      (s) => {
        sessionsCache = s;
        if (on) setList(s);
      },
      () => on && setList((l) => l ?? []),
    );
    return () => {
      on = false;
    };
  }, [initial]);
  return useMemo(() => (list && live ? withSession(list, live) : list), [list, live]);
}

const STATUS_COLOR: Record<Session["status"], string> = {
  active: t.accent,
  planned: t.warn,
  done: t.ok,
  abandoned: t.muted,
};

/** Sessions grouped by status for the NavList; the current one highlighted. */
export function sessionNavGroups(sessions: Session[], current?: string): NavGroup[] {
  return groupByStatus(sessions).map((g) => ({
    key: g.status,
    label: STATUS_LABEL[g.status],
    color: STATUS_COLOR[g.status],
    items: g.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      href: `#/session/${s.id}`,
      icon: FOCUS_INFO[s.target.focus].icon,
      badge: s.score === null ? "–" : s.score,
      current: s.id === current,
      hint: `${s.target.goal ?? ""} ${s.created}`,
      muted: s.status === "abandoned",
    })),
  }));
}

/** The "plan with Claude" hint of the sessions pages. */
export function PlanWithClaude() {
  return (
    <S.ClaudeCard>
      <h4>🤖 Plan with Claude</h4>
      <p>
        kb picks problems deterministically. For a plan that reasons about your strengths and
        weaknesses, run <code>/session</code> in Claude Code; it reads <code>kb feedback</code> and
        saves the plan here.
      </p>
      <MutedP $small>
        Review an attempt with <code>/review</code>.
      </MutedP>
    </S.ClaudeCard>
  );
}
