import { useEffect, useRef, useState } from "react";
import type { DesignCheck, DesignStage, TipLevel } from "../api";
import { api } from "../api";
import { STAGE_INFO, newlyPassed, nextTipLevel, stagesFirst, stageLabel } from "../design";
import { Grow, Muted } from "../theme/primitives";
import { ConfirmBar } from "./ConfirmDialog";
import * as D from "./DesignShared.style";
import * as S from "./DesignChecklist.style";
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
    <S.Root>
      <S.Head>
        <Ring solved={check.passed} total={check.total} size={64} labelSize={13} />
        <Grow as="div">
          <b>Rubric</b>
          <Muted $small as="div">
            {check.passed}/{check.total} checks · {check.final_smells.length} final smell
            {check.final_smells.length === 1 ? "" : "s"}
          </Muted>
          <S.Bar>
            <S.BarFill $pct={pct} />
          </S.Bar>
        </Grow>
      </S.Head>
      {error && <D.ErrorLine>⚠ {error}</D.ErrorLine>}
      {order.map((st) => {
        const items = check.checks.filter((c) => c.stage === st);
        if (items.length === 0) return null;
        const s = check.stages[st];
        return (
          <S.Group key={st} $current={st === current}>
            <S.Stage onClick={() => onJump(st)}>
              {STAGE_INFO[st].icon} {stageLabel(st, stages)}
              <S.Count $ok={Boolean(s && s.passed === s.total)}>
                {s?.passed ?? 0}/{s?.total ?? items.length}
              </S.Count>
            </S.Stage>
            <ul>
              {items.map((c) => {
                const tip = tips[c.id];
                const next = nextTipLevel(tip?.level);
                return (
                  <S.Item key={c.id} $flash={flash.has(c.id)}>
                    <S.Mark $pass={c.passed} aria-label={c.passed ? "passed" : "not yet"}>
                      {c.passed ? "✓" : "✗"}
                    </S.Mark>
                    <Grow as="div">
                      <div>{c.label}</div>
                      {c.detail && (
                        <Muted $small as="div">
                          {c.detail}
                        </Muted>
                      )}
                      {tip && (
                        <S.TipText $level={tip.level}>
                          <b>{LEVEL_LABEL[tip.level]}:</b> {tip.text}
                        </S.TipText>
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
                          <S.TipButton
                            disabled={asking === c.id}
                            onClick={() =>
                              next === "show" ? setConfirmShow(c.id) : ask(c.id, next)
                            }
                          >
                            💡 {tip ? `stronger tip (${LEVEL_LABEL[next]})` : "tip"}
                          </S.TipButton>
                        ))}
                    </Grow>
                  </S.Item>
                );
              })}
            </ul>
          </S.Group>
        );
      })}
      {showFinalSmells && check.final_smells.length > 0 && (
        <S.Group>
          <S.Stage as="div" $static>
            👃 Final-version smells
          </S.Stage>
          <ul>
            {check.final_smells.map((s) => (
              <S.Item key={`${s.rule}:${s.nodes.join(",")}`}>
                <S.Mark $pass={false}>!</S.Mark>
                <Grow as="div">
                  <code>{s.rule}</code> {s.message}
                  {s.nodes.length > 0 && (
                    <Muted $small as="div">
                      at {s.nodes.join(", ")}
                    </Muted>
                  )}
                </Grow>
              </S.Item>
            ))}
          </ul>
        </S.Group>
      )}
      {check.versions_missing_why.length > 0 && (
        <D.Callout $small>
          Versions without a “why”: {check.versions_missing_why.map((v) => `v${v}`).join(", ")}
        </D.Callout>
      )}
      {check.errors.length > 0 && (
        <D.Callout $small>
          {check.errors.map((e) => (
            <div key={e}>⚠ {e}</div>
          ))}
        </D.Callout>
      )}
    </S.Root>
  );
}
