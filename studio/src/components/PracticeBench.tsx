import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "../api";
import { api } from "../api";
import type { Counts } from "../practice-bench";
import { pct, withSession } from "../practice-bench";
import { FOCUS_INFO, STATUS_LABEL, groupByStatus } from "../sessions";
import type { NavGroup } from "./panes";

/** Shared pieces of the Practice pages (problems, problem, progress, sessions) on the Workbench. */

/** A command that copies itself on click. */
export function Copy({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <code
      className="cmd pb-cmd"
      title="click to copy"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? "copied ✓" : (label ?? text)}
    </code>
  );
}

/** A stacked solved / failing / untried bar with a legend. */
export function StatusBar({ c, legend = true }: { c: Counts; legend?: boolean }) {
  const w = (n: number) => `${c.total ? (100 * n) / c.total : 0}%`;
  return (
    <div className="pb-statbar">
      <div
        className="pb-bar"
        title={`${c.solved} solved · ${c.failing} failing · ${c.untried} untried`}
      >
        <span className="solved" style={{ width: w(c.solved) }} />
        <span className="failing" style={{ width: w(c.failing) }} />
      </div>
      {legend && (
        <div className="pb-legend">
          <span className="solved">✓ {c.solved}</span>
          <span className="failing">✗ {c.failing}</span>
          <span className="untried">○ {c.untried}</span>
          <span className="muted">{pct(c.solved, c.total)}%</span>
        </div>
      )}
    </div>
  );
}

/** A labelled number in a page header. */
export function Stat({ n, label, tone }: { n: ReactNode; label: string; tone?: string }) {
  return (
    <span className={`pb-stat ${tone ?? ""}`}>
      <b>{n}</b>
      {label}
    </span>
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
  active: "var(--accent)",
  planned: "var(--warn)",
  done: "var(--ok)",
  abandoned: "var(--muted)",
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
    <section className="rd-card pb-claude">
      <h4>🤖 Plan with Claude</h4>
      <p className="small">
        kb picks problems deterministically. For a plan that reasons about your strengths and
        weaknesses, run <code>/session</code> in Claude Code; it reads <code>kb feedback</code> and
        saves the plan here.
      </p>
      <p className="small muted">
        Review an attempt with <code>/review</code>.
      </p>
    </section>
  );
}
