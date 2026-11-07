import { useEffect, useRef, useState } from "react";
import type { DesignCheck, DesignStage, TipLevel } from "../api";
import { api } from "../api";
import { STAGE_INFO, newlyPassed, nextTipLevel, stagesFirst, stageLabel } from "../design";
import { ConfirmBar } from "./ConfirmDialog";
import { Ring } from "./Ring";

export interface TipState {
  level: TipLevel;
  text: string;
}

const LEVEL_LABEL: Record<TipLevel, string> = { nudge: "nudge", hint: "hint", show: "answer" };

/**
 * Right pane: live rubric checks grouped by stage (the current stage first), tips on demand
 * (nudge → hint → show) and final smells. A check that flips to passed plays a short celebration.
 */
export function DesignChecklist({
  subject,
  slug,
  attempt,
  stages,
  check,
  tips,
  setTip,
  onJump,
  current,
  showFinalSmells = true,
}: {
  subject: string;
  slug: string;
  attempt: string;
  stages: DesignStage[];
  check: DesignCheck;
  tips: Record<string, TipState>;
  setTip: (id: string, t: TipState) => void;
  onJump: (s: DesignStage) => void;
  /** the tab on screen: its checks come first */
  current?: string;
  showFinalSmells?: boolean;
}) {
  const [asking, setAsking] = useState<string | null>(null);
  const [confirmShow, setConfirmShow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = (id: string, level: TipLevel) => {
    setAsking(id);
    setError(null);
    api.designTip(subject, slug, id, level, attempt).then(
      (r) => {
        setTip(id, { level: r.level, text: r.text });
        setAsking(null);
      },
      (e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setAsking(null);
      },
    );
  };

  // Celebrate checks that just flipped to passed (not on first render).
  const prev = useRef(check.checks);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  useEffect(() => {
    const flipped = newlyPassed(prev.current, check.checks);
    prev.current = check.checks;
    if (flipped.length === 0) return;
    setFlash(new Set(flipped));
    const t = setTimeout(() => setFlash(new Set()), 1800);
    return () => clearTimeout(t);
  }, [check.checks]);

  const pct = check.total ? Math.round((100 * check.passed) / check.total) : 0;
  const order = current ? stagesFirst(stages, current) : stages;
  return (
    <div className="checklist">
      <div className="cl-head">
        <Ring solved={check.passed} total={check.total} size={64} />
        <div className="grow">
          <b>Rubric</b>
          <div className="muted small">
            {check.passed}/{check.total} checks · {check.final_smells.length} final smell
            {check.final_smells.length === 1 ? "" : "s"}
          </div>
          <div className="cl-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      {error && <div className="inline-error">⚠ {error}</div>}
      {order.map((st) => {
        const items = check.checks.filter((c) => c.stage === st);
        if (items.length === 0) return null;
        const s = check.stages[st];
        return (
          <section key={st} className={`cl-group ${st === current ? "current" : ""}`}>
            <button className="cl-stage" onClick={() => onJump(st)}>
              {STAGE_INFO[st].icon} {stageLabel(st, stages)}
              <span className={`cl-count ${s && s.passed === s.total ? "ok" : ""}`}>
                {s?.passed ?? 0}/{s?.total ?? items.length}
              </span>
            </button>
            <ul>
              {items.map((c) => {
                const tip = tips[c.id];
                const next = nextTipLevel(tip?.level);
                return (
                  <li
                    key={c.id}
                    className={`cl-item ${c.passed ? "pass" : "fail"} ${flash.has(c.id) ? "just-passed" : ""}`}
                  >
                    <span className="cl-mark" aria-label={c.passed ? "passed" : "not yet"}>
                      {c.passed ? "✓" : "✗"}
                    </span>
                    <div className="grow">
                      <div>{c.label}</div>
                      {c.detail && <div className="muted small">{c.detail}</div>}
                      {tip && (
                        <div className={`tip-text lvl-${tip.level}`}>
                          <b>{LEVEL_LABEL[tip.level]}:</b> {tip.text}
                        </div>
                      )}
                      {!c.passed &&
                        next &&
                        (confirmShow === c.id ? (
                          <ConfirmBar
                            text="Reveal the answer? It's logged with your tips."
                            yes="Show"
                            onYes={() => {
                              setConfirmShow(null);
                              ask(c.id, "show");
                            }}
                            onNo={() => setConfirmShow(null)}
                          />
                        ) : (
                          <button
                            className="tip-btn"
                            disabled={asking === c.id}
                            onClick={() =>
                              next === "show" ? setConfirmShow(c.id) : ask(c.id, next)
                            }
                          >
                            💡 {tip ? `stronger tip (${LEVEL_LABEL[next]})` : "tip"}
                          </button>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {showFinalSmells && check.final_smells.length > 0 && (
        <section className="cl-group">
          <div className="cl-stage static">👃 Final-version smells</div>
          <ul>
            {check.final_smells.map((s) => (
              <li key={`${s.rule}:${s.nodes.join(",")}`} className="cl-item fail">
                <span className="cl-mark">!</span>
                <div className="grow">
                  <code>{s.rule}</code> {s.message}
                  {s.nodes.length > 0 && <div className="muted small">at {s.nodes.join(", ")}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {check.versions_missing_why.length > 0 && (
        <div className="callout small">
          Versions without a “why”: {check.versions_missing_why.map((v) => `v${v}`).join(", ")}
        </div>
      )}
      {check.errors.length > 0 && (
        <div className="callout small">
          {check.errors.map((e) => (
            <div key={e}>⚠ {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
