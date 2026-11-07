import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  DesignAttempt,
  DesignCheck,
  DesignDoc,
  DesignProblemData,
  DesignSaveFile,
  DesignStage,
  Diagram,
  EstimateRow,
} from "../api";
import { api } from "../api";
import { RootContext } from "../context";
import { STAGE_INFO, cloneLatest, formatClock, sortVersions } from "../design";
import { designHref } from "../route";
import { runCommand } from "../sessions";
import { ConfirmDialog } from "./ConfirmDialog";
import type { TipState } from "./DesignChecklist";
import { DesignChecklist } from "./DesignChecklist";
import { HighLevelEditor } from "./DesignHighLevel";
import { DesignReferenceView } from "./DesignReference";
import {
  ApiDataEditor,
  DeepDivesEditor,
  EstimatesEditor,
  ScopeEditor,
  SignaturesEditor,
  WrapUpEditor,
} from "./DesignStages";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";
const DEBOUNCE_MS = 600;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Debounced autosave, one timer per file key (design, estimates, signatures, diagram:vN).
 * Every request carries a sequence number and only the newest check result is applied.
 */
function useSaver(
  subject: string,
  slug: string,
  attempt: string,
  onCheck: (c: DesignCheck) => void,
) {
  const timers = useRef(
    new Map<string, { t: ReturnType<typeof setTimeout>; body: DesignSaveFile }>(),
  );
  const inflight = useRef(new Set<Promise<unknown>>());
  const seq = useRef(0);
  const applied = useRef(0);
  const onCheckRef = useRef(onCheck);
  useEffect(() => {
    onCheckRef.current = onCheck;
  }, [onCheck]);
  const [state, setState] = useState<SaveState>("idle");
  const errorsRef = useRef<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setError = useCallback((key: string, msg: string | null) => {
    const { [key]: _old, ...rest } = errorsRef.current;
    errorsRef.current = msg ? { ...rest, [key]: msg } : rest;
    setErrors(errorsRef.current);
  }, []);

  const settle = useCallback(() => {
    if (timers.current.size === 0 && inflight.current.size === 0)
      setState(Object.keys(errorsRef.current).length ? "error" : "saved");
  }, []);

  const send = useCallback(
    (key: string, body: DesignSaveFile) => {
      const n = ++seq.current;
      setState("saving");
      const p = api.saveDesign(subject, slug, attempt, body).then(
        (check) => {
          if (n > applied.current) {
            applied.current = n;
            onCheckRef.current(check);
          }
          setError(key, null);
        },
        (e: unknown) => setError(key, errMsg(e)),
      );
      inflight.current.add(p);
      void p.finally(() => {
        inflight.current.delete(p);
        settle();
      });
      return p;
    },
    [subject, slug, attempt, settle, setError],
  );

  const schedule = useCallback(
    (key: string, body: DesignSaveFile, delay = DEBOUNCE_MS) => {
      const old = timers.current.get(key);
      if (old) clearTimeout(old.t);
      setState("pending");
      const t = setTimeout(() => {
        timers.current.delete(key);
        void send(key, body);
      }, delay);
      timers.current.set(key, { t, body });
    },
    [send],
  );

  const cancel = useCallback(
    (key: string) => {
      const old = timers.current.get(key);
      if (old) clearTimeout(old.t);
      timers.current.delete(key);
      setError(key, null);
      settle();
    },
    [setError, settle],
  );

  /** Send everything pending now and wait for all saves (before Check / Submit). */
  const flush = useCallback(async () => {
    for (const [key, { t, body }] of [...timers.current]) {
      clearTimeout(t);
      timers.current.delete(key);
      void send(key, body);
    }
    await Promise.allSettled([...inflight.current]);
  }, [send]);

  // Leaving the page: fire pending saves instead of dropping them.
  useEffect(() => {
    const pending = timers.current;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (pending.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      for (const [key, { t, body }] of [...pending]) {
        clearTimeout(t);
        pending.delete(key);
        void api.saveDesign(subject, slug, attempt, body).catch(() => undefined);
      }
    };
  }, [subject, slug, attempt]);

  return { state, errors, schedule, cancel, flush };
}

type Tab = DesignStage | "reference";

export function DesignConsole({
  problem,
  initial,
}: {
  problem: DesignProblemData;
  initial: DesignAttempt;
}) {
  const { subject, slug } = problem;
  const attempt = initial.name;
  const root = useContext(RootContext);
  const [design, setDesign] = useState<DesignDoc>(initial.design);
  const [rows, setRows] = useState<EstimateRow[]>(initial.estimates.rows ?? []);
  const [diagrams, setDiagrams] = useState<Diagram[]>(() => sortVersions(initial.diagrams));
  const [signatures, setSignatures] = useState(initial.signatures);
  const [check, setCheck] = useState<DesignCheck>(initial.check);
  const [shown, setShown] = useState(() => {
    const vs = sortVersions(initial.diagrams);
    return vs[vs.length - 1]?.version ?? 1;
  });
  const storeKey = `kb-console-tab:${subject}/${slug}/${attempt}`;
  const [tab, setTabState] = useState<Tab>(() => {
    const saved = sessionStorage.getItem(storeKey) as Tab | null;
    return saved && (saved === "reference" || problem.stages.includes(saved)) ? saved : "scope";
  });
  const setTab = (t: Tab) => {
    setTabState(t);
    sessionStorage.setItem(storeKey, t);
  };
  const [tips, setTips] = useState<Record<string, TipState>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [busy, setBusy] = useState<"check" | "submit" | null>(null);
  const [toast, setToast] = useState<{ text: string; good: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const saver = useSaver(subject, slug, attempt, setCheck);

  // ---- edits (autosave is triggered here, never from an effect)
  const editDesign = (d: DesignDoc) => {
    setDesign(d);
    saver.schedule("design", { file: "design", content: d });
  };
  const editRows = (r: EstimateRow[]) => {
    setRows(r);
    saver.schedule("estimates", { file: "estimates", content: { version: 1, rows: r } });
  };
  const editSignatures = (s: string) => {
    setSignatures(s);
    saver.schedule("signatures", { file: "signatures", content: s });
  };
  const editDiagram = (d: Diagram) => {
    setDiagrams((ds) => ds.map((x) => (x.version === d.version ? d : x)));
    saver.schedule(`diagram:${d.version}`, { file: "diagram", content: d, version: d.version });
  };
  const newVersion = () => {
    const d = cloneLatest(diagrams);
    setDiagrams((ds) => [...ds, d]);
    setShown(d.version);
    saver.schedule(`diagram:${d.version}`, { file: "diagram", content: d, version: d.version }, 0);
  };
  const deleteVersion = (v: number) => {
    saver.cancel(`diagram:${v}`);
    api.deleteDiagram(subject, slug, attempt, v).then(
      (c) => {
        setCheck(c);
        const rest = diagrams.filter((d) => d.version !== v);
        setDiagrams(rest);
        setShown([...rest].reverse().find((d) => d.version < v)?.version ?? rest[0]?.version ?? 1);
      },
      (e: unknown) => setActionError(errMsg(e)),
    );
  };

  // ---- recorded actions
  const showToast = (text: string, good: boolean) => {
    setToast({ text, good });
    setTimeout(() => setToast(null), 4000);
  };
  const runCheck = async () => {
    setBusy("check");
    setActionError(null);
    try {
      await saver.flush();
      const c = await api.checkDesign(subject, slug, attempt);
      setCheck(c);
      const clean = c.final_smells.length === 0 && c.versions_missing_why.length === 0;
      showToast(
        `Recorded: ${c.passed}/${c.total} checks${clean ? " · clean design ✨" : ` · ${c.final_smells.length} smells`}`,
        c.passed === c.total && clean,
      );
    } catch (e) {
      setActionError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };
  const submit = async () => {
    setConfirmSubmit(false);
    setBusy("submit");
    setActionError(null);
    try {
      await saver.flush();
      const c = await api.submitDesign(subject, slug, attempt);
      setCheck(c);
      setTab("reference");
      showToast(`Submitted with ${c.passed}/${c.total}: the reference is unlocked`, true);
    } catch (e) {
      setActionError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  // ---- timer (local only)
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const over = problem.minutes ? elapsed > problem.minutes * 60 : false;

  const cmd = runCommand(initial.path, root);
  const copy = () => {
    void navigator.clipboard?.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const tabs: Tab[] = check.submitted ? [...problem.stages, "reference"] : problem.stages;
  const saveLabel: Record<SaveState, string> = {
    idle: "all saved",
    pending: "● editing…",
    saving: "saving…",
    saved: "✓ saved",
    error: "⚠ not saved",
  };
  const firstError = Object.values(saver.errors)[0];

  return (
    <div className="console">
      <header className="console-head">
        <div className="ch-title">
          <a className="muted small" href={designHref(subject, slug)}>
            ← {problem.title}
          </a>
          <h1>
            {problem.title}{" "}
            <span className={`badge ${problem.difficulty}`}>{problem.difficulty}</span>
            {check.submitted && <span className="tag ok-tag">✓ submitted</span>}
          </h1>
          <div className="ch-meta">
            <code className="muted small">{attempt}</code>
            <a href={`vscode://file${initial.path}`} title="Open the attempt folder in VS Code">
              ⧉ open in VS Code
            </a>
            <code className="cmd" onClick={copy} title="click to copy">
              {copied ? "copied ✓" : cmd}
            </code>
          </div>
        </div>
        <span className="grow" />
        <button
          className={`timer ${over ? "over" : ""} ${running ? "" : "paused"}`}
          onClick={() => setRunning((r) => !r)}
          title={running ? "Pause the timer" : "Resume the timer"}
        >
          ⏱ {formatClock(elapsed)}
          {problem.minutes ? <span className="muted"> / {problem.minutes}:00</span> : null}
        </button>
        <span
          className={`save-state ${saver.state}`}
          title={firstError ?? "Edits autosave after a short pause"}
        >
          {saveLabel[saver.state]}
        </span>
        <button className="check-btn" onClick={() => void runCheck()} disabled={busy !== null}>
          {busy === "check" ? "checking…" : "✓ Check"}
        </button>
        <button
          className="primary submit-btn"
          onClick={() => setConfirmSubmit(true)}
          disabled={busy !== null}
        >
          {busy === "submit" ? "submitting…" : check.submitted ? "Re-submit" : "🚀 Submit"}
        </button>
      </header>
      {actionError && <div className="inline-error banner">⚠ {actionError}</div>}
      {toast &&
        createPortal(
          <div className={`toast ${toast.good ? "good" : ""}`} role="status">
            {toast.text}
          </div>,
          document.body,
        )}

      <div className="console-grid">
        <nav className="stage-tabs" aria-label="stages">
          {tabs.map((t, i) => {
            if (t === "reference")
              return (
                <button
                  key={t}
                  className={`stage-tab reference ${tab === t ? "on" : ""}`}
                  onClick={() => setTab(t)}
                  style={{ ["--i" as string]: i }}
                >
                  <span className="st-icon">📖</span>
                  <span className="st-label">Reference</span>
                  <span className="st-count">🔓</span>
                </button>
              );
            const s = check.stages[t];
            const done = s && s.total > 0 && s.passed === s.total;
            return (
              <button
                key={t}
                className={`stage-tab ${tab === t ? "on" : ""} ${done ? "done" : ""}`}
                onClick={() => setTab(t)}
                style={{ ["--i" as string]: i }}
              >
                <span className="st-icon">{STAGE_INFO[t].icon}</span>
                <span className="st-label">
                  <span className="st-num">{i + 1}</span> {STAGE_INFO[t].label}
                </span>
                <span className="st-count">
                  {s && s.total > 0 ? (done ? "✓" : `${s.passed}/${s.total}`) : "–"}
                </span>
                {s && s.total > 0 && (
                  <span className="st-bar" style={{ ["--p" as string]: s.passed / s.total }} />
                )}
              </button>
            );
          })}
        </nav>

        <main className="stage-body" key={tab}>
          <h2 className="stage-title">
            {tab === "reference"
              ? "📖 Reference"
              : `${STAGE_INFO[tab].icon} ${STAGE_INFO[tab].label}`}
          </h2>
          {tab === "scope" && (
            <ScopeEditor
              scope={design.scope}
              onChange={(scope) => editDesign({ ...design, scope })}
            />
          )}
          {tab === "estimates" && (
            <EstimatesEditor
              rows={rows}
              results={check.estimates}
              units={problem.units}
              constants={problem.constants}
              onChange={editRows}
            />
          )}
          {tab === "api" && (
            <ApiDataEditor doc={design} palette={problem.palette} onChange={editDesign} />
          )}
          {tab === "high-level" && (
            <HighLevelEditor
              diagrams={diagrams}
              check={check}
              palette={problem.palette}
              shown={shown}
              setShown={setShown}
              onDiagram={editDiagram}
              onNewVersion={newVersion}
              onDeleteVersion={deleteVersion}
              saveError={saver.errors[`diagram:${shown}`]}
            />
          )}
          {tab === "deep-dives" && (
            <DeepDivesEditor
              doc={design}
              versions={diagrams.map((d) => d.version)}
              onChange={editDesign}
            />
          )}
          {tab === "wrap-up" && (
            <WrapUpEditor
              keys={problem.wrapup_keys}
              wrapup={design.wrapup ?? {}}
              onChange={(wrapup) => editDesign({ ...design, wrapup })}
            />
          )}
          {tab === "signatures" && (
            <SignaturesEditor value={signatures} onChange={editSignatures} />
          )}
          {tab === "reference" && (
            <DesignReferenceView subject={subject} slug={slug} attempt={attempt} check={check} />
          )}
          {tab !== "high-level" &&
            Object.entries(saver.errors)
              .filter(([k]) => !k.startsWith("diagram:"))
              .map(([k, e]) => (
                <div key={k} className="inline-error">
                  ⚠ {k}: {e}
                </div>
              ))}
        </main>

        <DesignChecklist
          subject={subject}
          slug={slug}
          attempt={attempt}
          stages={problem.stages}
          check={check}
          tips={tips}
          setTip={(id, t) => setTips((m) => ({ ...m, [id]: t }))}
          onJump={(s) => setTab(s)}
        />
      </div>

      {confirmSubmit && (
        <ConfirmDialog
          title={check.submitted ? "Submit again?" : "Submit this attempt?"}
          yes={check.submitted ? "Re-submit" : "Submit"}
          onYes={() => void submit()}
          onNo={() => setConfirmSubmit(false)}
        >
          <p>
            You have{" "}
            <b>
              {check.passed}/{check.total}
            </b>{" "}
            checks and <b>{check.final_smells.length}</b> smell
            {check.final_smells.length === 1 ? "" : "s"} in the final version.
          </p>
          <p className="muted small">
            Submitting records a run and unlocks the reference walkthrough (a spoiler). You can keep
            editing afterwards.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
