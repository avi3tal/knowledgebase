import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  DesignAttempt,
  DesignCheck,
  DesignDoc,
  DesignPart,
  DesignProblemData,
  DesignSaveFile,
  DesignStage,
  Diagram,
  EstimateRow,
} from "../api";
import { api } from "../api";
import { RootContext } from "../context";
import {
  STAGE_INFO,
  cloneLatest,
  composeVersion,
  diagramToSub,
  formatClock,
  linkTargets,
  partToDiagram,
  sortVersions,
  stageLabel,
} from "../design";
import { designHref } from "../route";
import { runCommand } from "../sessions";
import { ConfirmDialog } from "./ConfirmDialog";
import { DesignBrief } from "./DesignBrief";
import type { TipState } from "./DesignChecklist";
import { DesignChecklist } from "./DesignChecklist";
import { HighLevelEditor, ShownSmells } from "./DesignHighLevel";
import { PartsEditor } from "./DesignParts";
import { DesignReferenceView } from "./DesignReference";
import type { CanvasHandle, Selection } from "./DiagramCanvas";
import { Inspector } from "./Inspector";
import { ShapePalette } from "./ShapePalette";
import { Workbench } from "./Workbench";
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
const DIAGRAM_TABS: Tab[] = ["parts", "high-level"];
const STAGE_COLOR: Record<DesignStage, string> = {
  scope: "#4f46e5",
  estimates: "#0891b2",
  api: "#7c3aed",
  parts: "#db2777",
  "high-level": "#ea580c",
  "deep-dives": "#0d9488",
  "wrap-up": "#65a30d",
  signatures: "#ca8a04",
};

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
  const [selection, setSelection] = useState<Selection>(null);
  const [renameTick, setRenameTick] = useState(0);
  const [mode, setMode] = useState<"canvas" | "json">("canvas");
  const parts = design.parts ?? [];
  const [partId, setPartId] = useState<string | null>(() => parts[0]?.id ?? null);
  const canvasRef = useRef<CanvasHandle>(null);
  const setTab = (t: Tab) => {
    setTabState(t);
    setSelection(null);
    sessionStorage.setItem(storeKey, t);
  };
  const show = (v: number) => {
    setShown(v);
    setSelection(null);
  };
  const selectPart = (id: string | null) => {
    setPartId(id);
    setSelection(null);
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
  const editParts = (ps: DesignPart[]) => editDesign({ ...design, parts: ps });
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
  const addVersion = (d: Diagram) => {
    setDiagrams((ds) => [...ds, d]);
    show(d.version);
    saver.schedule(`diagram:${d.version}`, { file: "diagram", content: d, version: d.version }, 0);
  };
  const newVersion = () => addVersion(cloneLatest(diagrams));
  const deleteVersion = (v: number) => {
    saver.cancel(`diagram:${v}`);
    api.deleteDiagram(subject, slug, attempt, v).then(
      (c) => {
        setCheck(c);
        const rest = diagrams.filter((d) => d.version !== v);
        setDiagrams(rest);
        show([...rest].reverse().find((d) => d.version < v)?.version ?? rest[0]?.version ?? 1);
      },
      (e: unknown) => setActionError(errMsg(e)),
    );
  };
  const latest = diagrams[diagrams.length - 1];
  const composed = useMemo(() => composeVersion(diagrams, parts), [diagrams, parts]);
  const compose = () => {
    if (!composed || diagrams.length >= 20) return;
    addVersion(composed);
    setTab("high-level");
    setMode("canvas");
    showToast(`v${composed.version}: ${composed.why} 🧬`, true);
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
  const saveBadge = (
    <span
      className={`save-state ${saver.state}`}
      title={firstError ?? "Edits autosave after a short pause"}
    >
      {saveLabel[saver.state]}
    </span>
  );

  // ---- what the canvas on screen edits (for the inspector)
  const part = parts.find((p) => p.id === partId) ?? parts[0];
  const shownDiagram = diagrams.find((d) => d.version === shown) ?? latest;
  const onDiagramTab = DIAGRAM_TABS.includes(tab);
  const active: { diagram: Diagram; onChange: (d: Diagram) => void } | null =
    tab === "high-level" && shownDiagram && mode === "canvas"
      ? { diagram: shownDiagram, onChange: editDiagram }
      : tab === "parts" && part
        ? {
            diagram: partToDiagram(part),
            onChange: (d) =>
              editParts(
                parts.map((p) => (p.id === part.id ? { ...part, diagram: diagramToSub(d) } : p)),
              ),
          }
        : null;
  const targets = active
    ? tab === "parts"
      ? linkTargets(latest, parts, part?.id ?? null, active.diagram)
      : linkTargets(undefined, parts, null, active.diagram)
    : [];

  // ---- regions
  const header = (
    <>
      <a className="ch-back" href={designHref(subject, slug)} title="Back to the problem">
        ←
      </a>
      <h1 className="ch-title">
        {problem.title} <span className={`badge ${problem.difficulty}`}>{problem.difficulty}</span>
        {check.submitted && <span className="tag ok-tag">✓ submitted</span>}
      </h1>
      <code className="muted small ch-attempt" title={`attempt folder: ${attempt}`}>
        {attempt}
      </code>
      <a
        className="ch-vscode small"
        href={`vscode://file${initial.path}`}
        title="Open the attempt folder in VS Code"
      >
        ⧉ VS Code
      </a>
      <code className="cmd" onClick={copy} title={`click to copy: ${cmd}`}>
        {copied ? "copied ✓" : cmd}
      </code>
      <span className="grow" />
      {actionError && (
        <span className="inline-error" role="alert">
          ⚠ {actionError}
        </span>
      )}
      <button
        className={`timer ${over ? "over" : ""} ${running ? "" : "paused"}`}
        onClick={() => setRunning((r) => !r)}
        title={running ? "Pause the timer" : "Resume the timer"}
      >
        ⏱ {formatClock(elapsed)}
        {problem.minutes ? <span className="muted"> / {problem.minutes}:00</span> : null}
      </button>
      {saveBadge}
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
    </>
  );

  const tabBar = tabs.map((t, i) => {
    if (t === "reference")
      return (
        <button
          key={t}
          className={`wb-tab ref-tab ${tab === t ? "on" : ""}`}
          onClick={() => setTab(t)}
          style={{ ["--tab-c" as string]: "#f59e0b" }}
        >
          📖 Reference <span className="wb-tab-badge">🔓</span>
        </button>
      );
    const s = check.stages[t];
    const done = Boolean(s && s.total > 0 && s.passed === s.total);
    return (
      <button
        key={t}
        className={`wb-tab ${tab === t ? "on" : ""} ${done ? "done" : ""}`}
        onClick={() => setTab(t)}
        style={{ ["--tab-c" as string]: STAGE_COLOR[t] }}
        aria-current={tab === t ? "step" : undefined}
      >
        <span className="tab-num">{i + 1}</span>
        <span className="tab-icon" aria-hidden>
          {STAGE_INFO[t].icon}
        </span>
        {stageLabel(t, problem.stages)}
        <span className="wb-tab-badge">
          {s && s.total > 0 ? (done ? "✓" : `${s.passed}/${s.total}`) : "–"}
        </span>
      </button>
    );
  });

  const left = onDiagramTab
    ? {
        title: "Shapes",
        icon: "🧰",
        width: 248,
        content: (
          <ShapePalette
            palette={problem.palette}
            onAdd={(k) => canvasRef.current?.addAtCentre(k)}
            onDrop={(k, x, y) => canvasRef.current?.dropAt(k, x, y) ?? false}
            onHover={(x, y) => canvasRef.current?.hover(x, y) ?? false}
            disabled={!active}
            note={
              !active
                ? tab === "parts"
                  ? "Add a part first."
                  : "Switch to the canvas to add shapes."
                : undefined
            }
          />
        ),
      }
    : {
        title: "Brief",
        icon: "🗣️",
        width: 280,
        content: (
          <DesignBrief problem={problem} scope={design.scope} onScope={() => setTab("scope")} />
        ),
      };

  const right = {
    title: selection && active ? "Inspector · Checks" : "Checks",
    icon: "✅",
    width: 330,
    content: (
      <>
        {active && selection && (
          <Inspector
            diagram={active.diagram}
            selection={selection}
            onChange={active.onChange}
            onSelect={setSelection}
            renameTick={renameTick}
            targets={targets}
          />
        )}
        {tab === "high-level" && shownDiagram && (
          <ShownSmells check={check} shown={shownDiagram.version} />
        )}
        <DesignChecklist
          subject={subject}
          slug={slug}
          attempt={attempt}
          stages={problem.stages}
          check={check}
          tips={tips}
          setTip={(id, t) => setTips((m) => ({ ...m, [id]: t }))}
          onJump={(s) => setTab(s)}
          current={tab}
          showFinalSmells={tab !== "high-level"}
        />
      </>
    ),
  };

  const idx = tabs.indexOf(tab);
  const prevTab = idx > 0 ? tabs[idx - 1] : undefined;
  const nextTab = idx >= 0 && idx < tabs.length - 1 ? tabs[idx + 1] : undefined;
  const tabName = (t: Tab) => (t === "reference" ? "Reference" : stageLabel(t, problem.stages));
  const pct = check.total ? (100 * check.passed) / check.total : 0;
  const footer = (
    <>
      <button className="ghost" disabled={!prevTab} onClick={() => prevTab && setTab(prevTab)}>
        ← {prevTab ? tabName(prevTab) : "start"}
      </button>
      <div className="ft-progress" title={`${check.passed} of ${check.total} checks pass`}>
        <div className="ft-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <b>
          {check.passed}/{check.total}
        </b>{" "}
        checks
      </div>
      <span className={`ft-chip ${check.final_smells.length ? "bad" : "ok"}`}>
        👃 {check.final_smells.length} smell{check.final_smells.length === 1 ? "" : "s"}
      </span>
      <span className="ft-chip">
        🗺️ {diagrams.length} version{diagrams.length === 1 ? "" : "s"}
      </span>
      {problem.stages.includes("parts") && (
        <span className="ft-chip">
          🧩 {parts.length} part{parts.length === 1 ? "" : "s"}
        </span>
      )}
      <span className="grow" />
      {saveBadge}
      <button
        className={nextTab ? "primary" : "ghost"}
        disabled={!nextTab}
        onClick={() => nextTab && setTab(nextTab)}
      >
        {nextTab ? tabName(nextTab) : "end"} →
      </button>
    </>
  );

  const formErrors = Object.entries(saver.errors)
    .filter(([k]) => !k.startsWith("diagram:"))
    .map(([k, e]) => (
      <div key={k} className="inline-error">
        ⚠ {k}: {e}
      </div>
    ));

  return (
    <div className="console">
      <Workbench
        id="console"
        header={header}
        tabs={tabBar}
        left={left}
        right={right}
        footer={footer}
        centerClass={onDiagramTab ? "flush" : ""}
      >
        {tab === "high-level" && (
          <HighLevelEditor
            diagrams={diagrams}
            check={check}
            palette={problem.palette}
            shown={shownDiagram?.version ?? shown}
            setShown={show}
            onDiagram={editDiagram}
            onNewVersion={newVersion}
            onDeleteVersion={deleteVersion}
            saveError={saver.errors[`diagram:${shown}`]}
            reservedIds={parts.flatMap((p) => p.diagram.nodes.map((n) => n.id))}
            mode={mode}
            setMode={(m) => {
              setMode(m);
              setSelection(null);
            }}
            selection={selection}
            onSelect={setSelection}
            onRename={() => setRenameTick((n) => n + 1)}
            canvasRef={canvasRef}
          />
        )}
        {tab === "parts" && (
          <PartsEditor
            parts={parts}
            selected={part?.id ?? null}
            setSelected={selectPart}
            onParts={editParts}
            latest={latest}
            scope={design.scope}
            canCompose={Boolean(composed) && diagrams.length < 20}
            onCompose={compose}
            selection={selection}
            onSelect={setSelection}
            onRename={() => setRenameTick((n) => n + 1)}
            canvasRef={canvasRef}
            saveError={saver.errors.design}
          />
        )}
        {!onDiagramTab && (
          <div className="console-form" key={tab}>
            <h2 className="stage-title">
              {tab === "reference"
                ? "📖 Reference"
                : `${STAGE_INFO[tab].icon} ${stageLabel(tab, problem.stages)}`}
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
            {formErrors}
          </div>
        )}
      </Workbench>
      {toast &&
        createPortal(
          <div className={`toast ${toast.good ? "good" : ""}`} role="status">
            {toast.text}
          </div>,
          document.body,
        )}

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
