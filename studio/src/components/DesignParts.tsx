import type { Ref } from "react";
import { useState } from "react";
import type { DesignDoc, DesignPart, Diagram } from "../api";
import {
  composePreview,
  coverableIds,
  diagramToSub,
  missingPartNodes,
  newPart,
  partToDiagram,
} from "../design";
import { ConfirmBar } from "./ConfirmDialog";
import type { CanvasHandle, Selection } from "./DiagramCanvas";
import { DiagramCanvas } from "./DiagramCanvas";

/**
 * Decompose stage (center pane): the parts as chips in a toolbar, the selected part's sub-diagram on
 * the canvas, and its fields in a bottom drawer. "Compose into high-level" reduces every part into a
 * new diagram version (merge by node id, design.ts composeVersion).
 */
export function PartsEditor({
  parts,
  selected,
  setSelected,
  onParts,
  latest,
  scope,
  canCompose,
  onCompose,
  selection,
  onSelect,
  onRename,
  canvasRef,
  saveError,
}: {
  parts: DesignPart[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  onParts: (parts: DesignPart[]) => void;
  /** the latest high-level version (what "composed" is measured against) */
  latest: Diagram | undefined;
  scope: DesignDoc["scope"];
  canCompose: boolean;
  onCompose: () => void;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onRename: () => void;
  canvasRef: Ref<CanvasHandle>;
  saveError?: string;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [drawer, setDrawer] = useState(
    () => !(parts.find((p) => p.id === selected) ?? parts[0])?.title,
  );
  const part = parts.find((p) => p.id === selected) ?? parts[0];
  const preview = composePreview(latest, parts);
  const edit = (p: DesignPart) => onParts(parts.map((x) => (x.id === p.id ? p : x)));
  const add = () => {
    const p = newPart(parts);
    onParts([...parts, p]);
    setSelected(p.id);
    setDrawer(true);
  };

  return (
    <>
      <div className="cx-toolbar parts-bar">
        <div className="part-chips" role="tablist" aria-label="parts">
          {parts.map((p, i) => {
            const miss = missingPartNodes(latest, [p]).length;
            const empty = (p.diagram?.nodes ?? []).length === 0;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === part?.id}
                className={`part-chip ${p.id === part?.id ? "on" : ""} ${!empty && miss === 0 ? "composed" : ""}`}
                style={{ ["--i" as string]: i }}
                onClick={() => {
                  setSelected(p.id);
                  setConfirmRemove(false);
                }}
                title={
                  empty
                    ? "No sub-diagram yet"
                    : miss === 0
                      ? "Composed: every component is in the high-level design"
                      : `${miss} component${miss === 1 ? "" : "s"} not in the design yet`
                }
              >
                <span className="pc-id">{p.id}</span>
                <span className="pc-title">{p.title || "untitled"}</span>
                <span className="pc-state">{empty ? "○" : miss === 0 ? "✓" : `+${miss}`}</span>
              </button>
            );
          })}
          <button className="add-btn part-add" onClick={add} disabled={parts.length >= 12}>
            ＋ Part
          </button>
        </div>
        <span className="grow" />
        <button
          className="primary compose-btn"
          onClick={onCompose}
          disabled={!canCompose}
          title={
            preview.parts.length === 0
              ? "Every part is already in the latest version"
              : `New version with ${preview.nodes} component(s) and ${preview.edges} connection(s) from ${preview.parts.join(", ")}`
          }
        >
          🧬 Compose into high-level
          {preview.parts.length > 0 && <span className="compose-count">+{preview.nodes}</span>}
        </button>
      </div>

      {!part ? (
        <div className="parts-empty">
          <div className="pe-card">
            <div className="pe-icon">🧩</div>
            <h3>Split the problem into parts</h3>
            <p className="muted">
              One part per hard requirement: the hot read path, the write path, fan-out, search,
              analytics… Solve each on its own (options, a choice, a small diagram), then compose
              them into the high-level design. Reuse the same component ids across parts so they
              merge.
            </p>
            <button className="primary" onClick={add}>
              ＋ First part
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="cx-subbar">
            <PartStatus part={part} latest={latest} />
            {saveError && <span className="inline-error">⚠ {saveError}</span>}
          </div>
          <div className="cx-canvas">
            <DiagramCanvas
              key={part.id}
              diagram={partToDiagram(part)}
              onChange={(d) => edit({ ...part, diagram: diagramToSub(d) })}
              height="fill"
              selection={selection}
              onSelect={onSelect}
              onRename={onRename}
              handle={canvasRef}
            />
          </div>
          <div className={`part-drawer ${drawer ? "open" : ""}`}>
            <button
              className="drawer-toggle"
              onClick={() => setDrawer((d) => !d)}
              aria-expanded={drawer}
            >
              {drawer ? "▾" : "▴"} {part.id} · {part.title || "untitled part"}: problem, options,
              choice
            </button>
            {drawer && (
              <div className="drawer-body">
                <PartSheet part={part} scope={scope} onChange={edit} />
                <div className="part-remove">
                  {confirmRemove ? (
                    <ConfirmBar
                      text={`Remove ${part.id} and its sub-diagram?`}
                      yes="Remove"
                      danger
                      onYes={() => {
                        setConfirmRemove(false);
                        const rest = parts.filter((p) => p.id !== part.id);
                        onParts(rest);
                        setSelected(rest[0]?.id ?? null);
                      }}
                      onNo={() => setConfirmRemove(false)}
                    />
                  ) : (
                    <button className="ghost danger" onClick={() => setConfirmRemove(true)}>
                      🗑 Remove {part.id}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function PartStatus({ part, latest }: { part: DesignPart; latest: Diagram | undefined }) {
  const miss = missingPartNodes(latest, [part]);
  const n = (part.diagram?.nodes ?? []).length;
  if (n === 0)
    return (
      <span className="part-status muted small">
        Draw this part’s components: drag shapes from the stencil.
      </span>
    );
  if (miss.length === 0)
    return (
      <span className="part-status ok">
        ✓ composed into v{latest?.version}: all {n} component{n === 1 ? "" : "s"} are in the design
      </span>
    );
  return (
    <span className="part-status warn">
      {miss.length} component{miss.length === 1 ? "" : "s"} not in the design yet:{" "}
      {miss.map((id) => (
        <code key={id}>{id}</code>
      ))}
    </span>
  );
}

/** Free-text chips (technologies, patterns): Enter or comma adds, × removes. */
function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const commit = () => {
    const v = text.trim().replace(/,$/, "").trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText("");
  };
  return (
    <div className="chip-input">
      {values.map((v) => (
        <span key={v} className="chip">
          {v}
          <button
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`remove ${v}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !text && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}

/** The fields of one part: title, covers, problem, options, choice, why, technologies, patterns. */
export function PartSheet({
  part,
  scope,
  onChange,
}: {
  part: DesignPart;
  scope: DesignDoc["scope"];
  onChange: (p: DesignPart) => void;
}) {
  const set = (patch: Partial<DesignPart>) => onChange({ ...part, ...patch });
  const ids = coverableIds(scope);
  const known = new Set(ids.map((x) => x.id));
  const stray = part.covers.filter((c) => !known.has(c));
  const toggle = (id: string) =>
    set({
      covers: part.covers.includes(id) ? part.covers.filter((c) => c !== id) : [...part.covers, id],
    });
  return (
    <div className="part-sheet">
      <div className="ps-row">
        <label className="ps-title">
          <span className="muted small">title</span>
          <input
            value={part.title}
            placeholder="e.g. Redirect read path"
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>
        <div className="ps-covers">
          <span className="muted small">covers</span>
          <div className="cover-chips">
            {ids.length === 0 && (
              <span className="muted small">Write requirements in Scope first (F1, N1…).</span>
            )}
            {[...ids, ...stray.map((id) => ({ id, text: "not in scope any more" }))].map((it) => (
              <button
                key={it.id}
                className={`cover-chip c-${it.id[0]?.toLowerCase()} ${part.covers.includes(it.id) ? "on" : ""}`}
                onClick={() => toggle(it.id)}
                title={it.text}
                aria-pressed={part.covers.includes(it.id)}
              >
                {it.id}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label>
        <span className="muted small">problem: what is hard about this piece?</span>
        <textarea
          rows={2}
          value={part.problem}
          placeholder="e.g. 100× more redirects than writes, answered in tens of ms worldwide"
          onChange={(e) => set({ problem: e.target.value })}
        />
      </label>
      <table className="sheet options">
        <thead>
          <tr>
            <th />
            <th>option</th>
            <th>pros</th>
            <th>cons</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {part.options.map((o, k) => {
            const chosen = Boolean(part.choice) && part.choice === o.name;
            const setOpt = (patch: Partial<typeof o>) =>
              set({
                options: part.options.map((x, j) => (j === k ? { ...x, ...patch } : x)),
                ...(patch.name !== undefined && chosen ? { choice: patch.name } : {}),
              });
            return (
              <tr key={k} className={chosen ? "chosen" : ""}>
                <td>
                  <button
                    className={`choose-btn ${chosen ? "on" : ""}`}
                    disabled={!o.name.trim()}
                    onClick={() => set({ choice: chosen ? "" : o.name })}
                    title={chosen ? "Chosen" : "Choose this option"}
                    aria-pressed={chosen}
                  >
                    {chosen ? "★" : "☆"}
                  </button>
                </td>
                <td>
                  <input
                    value={o.name}
                    placeholder="option"
                    onChange={(e) => setOpt({ name: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={o.pros}
                    placeholder="+"
                    onChange={(e) => setOpt({ pros: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    rows={1}
                    value={o.cons}
                    placeholder="−"
                    onChange={(e) => setOpt({ cons: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    className="icon-x"
                    onClick={() => set({ options: part.options.filter((_, j) => j !== k) })}
                    aria-label="remove option"
                    title="Remove option"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        className="add-btn"
        onClick={() => set({ options: [...part.options, { name: "", pros: "", cons: "" }] })}
      >
        ＋ Option
      </button>
      <div className="ps-row">
        <label className="ps-choice">
          <span className="muted small">choice (★ an option, or write your own)</span>
          <input
            value={part.choice}
            list={`part-opts-${part.id}`}
            placeholder="the option you pick"
            onChange={(e) => set({ choice: e.target.value })}
          />
          <datalist id={`part-opts-${part.id}`}>
            {part.options
              .filter((o) => o.name.trim())
              .map((o) => (
                <option key={o.name} value={o.name} />
              ))}
          </datalist>
        </label>
        <label className="grow">
          <span className="muted small">why</span>
          <textarea
            rows={2}
            value={part.why}
            placeholder="Why this option wins for these requirements (cite F/N ids)"
            onChange={(e) => set({ why: e.target.value })}
          />
        </label>
      </div>
      <div className="ps-row">
        <div className="grow">
          <span className="muted small">technologies</span>
          <ChipInput
            values={part.technologies}
            onChange={(technologies) => set({ technologies })}
            placeholder="redis, kafka… (Enter)"
          />
        </div>
        <div className="grow">
          <span className="muted small">patterns</span>
          <ChipInput
            values={part.patterns}
            onChange={(patterns) => set({ patterns })}
            placeholder="cache-aside, sharding… (Enter)"
          />
        </div>
      </div>
    </div>
  );
}
