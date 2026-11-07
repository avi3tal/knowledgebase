import { useEffect, useMemo, useState } from "react";
import type { DesignCheck, Diagram } from "../api";
import type { Highlight } from "../design";
import { highlightFor, parseDiagramJson, smellsByNode } from "../design";
import { ConfirmBar } from "./ConfirmDialog";
import { DiagramCanvas } from "./DiagramCanvas";

/** Version pills v1 … vN with smell / missing-why markers. */
export function VersionPills({
  versions,
  shown,
  onShow,
  check,
}: {
  versions: number[];
  shown: number;
  onShow: (v: number) => void;
  check?: DesignCheck;
}) {
  return (
    <div className="version-pills" role="tablist">
      {versions.map((v, i) => {
        const info = check?.versions.find((x) => x.version === v);
        const smelly = (info?.smells.length ?? 0) > 0;
        const noWhy = check?.versions_missing_why.includes(v);
        return (
          <span key={v} className="vp-wrap">
            {i > 0 && <span className="vp-arrow">→</span>}
            <button
              role="tab"
              aria-selected={v === shown}
              className={`vpill ${v === shown ? "on" : ""} ${smelly ? "smelly" : ""}`}
              onClick={() => onShow(v)}
              title={info?.why || (noWhy ? "missing a why" : `version ${v}`)}
            >
              v{v}
              {smelly && <span className="vp-dot bad" title={`${info?.smells.length} smells`} />}
              {noWhy && <span className="vp-dot warn" title="missing a why" />}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function HighLevelEditor({
  diagrams,
  check,
  palette,
  shown,
  setShown,
  onDiagram,
  onNewVersion,
  onDeleteVersion,
  saveError,
}: {
  diagrams: Diagram[];
  check: DesignCheck;
  palette: string[];
  shown: number;
  setShown: (v: number) => void;
  onDiagram: (d: Diagram) => void;
  onNewVersion: () => void;
  onDeleteVersion: (v: number) => void;
  saveError?: string;
}) {
  const [mode, setMode] = useState<"canvas" | "json">("canvas");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const diagram = diagrams.find((d) => d.version === shown) ?? diagrams[diagrams.length - 1];
  const versions = diagrams.map((d) => d.version);
  const highlight: Highlight = useMemo(() => highlightFor(check, shown), [check, shown]);
  const smells = useMemo(() => smellsByNode(check.smells, shown), [check.smells, shown]);
  const shownSmells = check.smells.filter((s) => s.version === shown);
  const info = check.versions.find((v) => v.version === shown);
  const isFirst = versions[0] === shown;
  const isLast = versions[versions.length - 1] === shown;
  if (!diagram) return null;

  return (
    <div className="highlevel">
      <div className="hl-timeline">
        <VersionPills versions={versions} shown={shown} onShow={setShown} check={check} />
        <button
          className="primary new-version"
          onClick={onNewVersion}
          disabled={versions.length >= 20}
        >
          ＋ New version
        </button>
        {!isFirst &&
          shown === Math.max(...versions) &&
          (confirmDelete ? (
            <ConfirmBar
              text={`Delete v${shown}? Its file is removed.`}
              yes="Delete"
              danger
              onYes={() => {
                setConfirmDelete(false);
                onDeleteVersion(shown);
              }}
              onNo={() => setConfirmDelete(false)}
            />
          ) : (
            <button className="ghost danger" onClick={() => setConfirmDelete(true)}>
              🗑 Delete v{shown}
            </button>
          ))}
        <span className="grow" />
        <div className="seg">
          <button className={mode === "canvas" ? "on" : ""} onClick={() => setMode("canvas")}>
            🎨 Canvas
          </button>
          <button className={mode === "json" ? "on" : ""} onClick={() => setMode("json")}>
            {"{ }"} JSON
          </button>
        </div>
      </div>

      <label className={`why-field ${diagram.why.trim() ? "" : "missing"}`}>
        <span className="why-tag">why v{shown}?</span>
        <input
          value={diagram.why}
          placeholder={
            isFirst
              ? palette.includes("class")
                ? "e.g. Core objects first: the main classes and how they relate"
                : "e.g. Naive start: one service and one database"
              : "Which flaw, requirement or bottleneck does this version fix? (cite N1, F2…)"
          }
          onChange={(e) => onDiagram({ ...diagram, why: e.target.value })}
        />
      </label>

      {info && !isFirst && (
        <div className="diff-strip">
          {info.diff.added_nodes.map((n) => (
            <span key={`+${n}`} className="diff-chip add">
              ＋ {n}
            </span>
          ))}
          {info.diff.removed_nodes.map((n) => (
            <span key={`-${n}`} className="diff-chip del">
              − {n}
            </span>
          ))}
          {info.diff.added_edges.length + info.diff.removed_edges.length > 0 && (
            <span className="muted small">
              {info.diff.added_edges.length} new · {info.diff.removed_edges.length} removed
              connections
            </span>
          )}
          {info.diff.added_nodes.length +
            info.diff.removed_nodes.length +
            info.diff.added_edges.length +
            info.diff.removed_edges.length ===
            0 && <span className="muted small">No change vs the previous version yet.</span>}
        </div>
      )}

      {mode === "canvas" ? (
        <DiagramCanvas
          key={shown}
          diagram={diagram}
          palette={palette}
          onChange={onDiagram}
          highlight={highlight}
          smells={smells}
        />
      ) : (
        <JsonTab key={shown} diagram={diagram} onApply={onDiagram} />
      )}
      {saveError && <div className="inline-error">⚠ {saveError}</div>}

      {shownSmells.length > 0 && (
        <div className="smells">
          <b>👃 Smells in v{shown}</b>
          {!isLast && <span className="muted small"> (only the final version counts)</span>}
          <ul>
            {shownSmells.map((s) => (
              <li key={`${s.rule}:${s.nodes.join(",")}`}>
                <code>{s.rule}</code> {s.message}{" "}
                {s.nodes.map((n) => (
                  <span key={n} className="smell-node">
                    {n}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JsonTab({ diagram, onApply }: { diagram: Diagram; onApply: (d: Diagram) => void }) {
  const pretty = useMemo(() => JSON.stringify(diagram, null, 2), [diagram]);
  const [text, setText] = useState(pretty);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setText(pretty);
  }, [pretty, dirty]);
  const apply = () => {
    const r = parseDiagramJson(text, diagram.version);
    if ("error" in r) return setError(r.error);
    setError(null);
    setDirty(false);
    onApply(r.diagram);
  };
  return (
    <div className="json-tab">
      <textarea
        className="code-area"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
      />
      <div className="json-actions">
        <button className="primary" onClick={apply} disabled={!dirty}>
          Apply &amp; save
        </button>
        <button
          onClick={() => {
            setText(pretty);
            setDirty(false);
            setError(null);
          }}
          disabled={!dirty}
        >
          Revert
        </button>
        {error && <span className="inline-error">⚠ {error}</span>}
        <span className="muted small">
          Format:{" "}
          <code>
            {"{version, why, nodes: [{id, kind, label, x, y}], edges: [{from, to, label}]}"}
          </code>
        </span>
      </div>
    </div>
  );
}
