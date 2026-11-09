import type { Ref } from "react";
import { useEffect, useMemo, useState } from "react";
import type { DesignCheck, Diagram } from "../api";
import type { Highlight } from "../design";
import { highlightFor, parseDiagramJson, smellsByNode } from "../design";
import { Grow, Muted } from "../theme/primitives";
import { CodeEditor } from "./CodeEditor";
import { ConfirmBar } from "./ConfirmDialog";
import type { CanvasHandle, Selection } from "./DiagramCanvas";
import { DiagramCanvas } from "./DiagramCanvas";
import * as D from "./DesignShared.style";
import * as S from "./DesignHighLevel.style";

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
    <S.Pills role="tablist">
      {versions.map((v, i) => {
        const info = check?.versions.find((x) => x.version === v);
        const smelly = (info?.smells.length ?? 0) > 0;
        const noWhy = check?.versions_missing_why.includes(v);
        return (
          <S.PillWrap key={v}>
            {i > 0 && <S.Arrow>→</S.Arrow>}
            <S.Pill
              role="tab"
              aria-selected={v === shown}
              $on={v === shown}
              onClick={() => onShow(v)}
              title={info?.why || (noWhy ? "missing a why" : `version ${v}`)}
            >
              v{v}
              {smelly && <S.Dot $kind="bad" title={`${info?.smells.length} smells`} />}
              {noWhy && <S.Dot $kind="warn" title="missing a why" />}
            </S.Pill>
          </S.PillWrap>
        );
      })}
    </S.Pills>
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
  reservedIds,
  mode,
  setMode,
  selection,
  onSelect,
  onRename,
  canvasRef,
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
  /** node ids of the parts: a new shape here must not silently merge with one of them */
  reservedIds?: string[];
  mode: "canvas" | "json";
  setMode: (m: "canvas" | "json") => void;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onRename: () => void;
  canvasRef: Ref<CanvasHandle>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const diagram = diagrams.find((d) => d.version === shown) ?? diagrams[diagrams.length - 1];
  const versions = diagrams.map((d) => d.version);
  const highlight: Highlight = useMemo(() => highlightFor(check, shown), [check, shown]);
  const smells = useMemo(() => smellsByNode(check.smells, shown), [check.smells, shown]);
  const info = check.versions.find((v) => v.version === shown);
  const isFirst = versions[0] === shown;
  if (!diagram) return null;
  const changes = info
    ? info.diff.added_nodes.length +
      info.diff.removed_nodes.length +
      info.diff.added_edges.length +
      info.diff.removed_edges.length
    : 0;

  return (
    <>
      <D.Toolbar>
        <VersionPills versions={versions} shown={shown} onShow={setShown} check={check} />
        <D.AccentButton
          onClick={onNewVersion}
          disabled={versions.length >= 20}
          title="Copy the latest version into a new one, then change what it fixes"
        >
          ＋ New version
        </D.AccentButton>
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
            <D.DangerButton $ghost onClick={() => setConfirmDelete(true)}>
              🗑 v{shown}
            </D.DangerButton>
          ))}
        <Grow />
        <S.Seg>
          <S.SegButton $on={mode === "canvas"} onClick={() => setMode("canvas")}>
            🎨 Canvas
          </S.SegButton>
          <S.SegButton $on={mode === "json"} onClick={() => setMode("json")}>
            {"{ }"} JSON
          </S.SegButton>
        </S.Seg>
      </D.Toolbar>
      <D.Subbar>
        <S.WhyField $missing={!diagram.why.trim()}>
          <S.WhyTag $missing={!diagram.why.trim()}>why v{shown}?</S.WhyTag>
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
        </S.WhyField>
        {info && !isFirst && (
          <S.DiffStrip>
            {info.diff.added_nodes.map((n) => (
              <S.DiffChip key={`+${n}`} $kind="add">
                ＋ {n}
              </S.DiffChip>
            ))}
            {info.diff.removed_nodes.map((n) => (
              <S.DiffChip key={`-${n}`} $kind="del">
                − {n}
              </S.DiffChip>
            ))}
            {info.diff.added_edges.length + info.diff.removed_edges.length > 0 && (
              <Muted $small>
                {info.diff.added_edges.length} new · {info.diff.removed_edges.length} removed
                connections
              </Muted>
            )}
            {changes === 0 && <Muted $small>No change vs the previous version yet.</Muted>}
          </S.DiffStrip>
        )}
        {saveError && <D.ErrorLine $flat>⚠ {saveError}</D.ErrorLine>}
      </D.Subbar>
      {mode === "canvas" ? (
        <D.CanvasFill>
          <DiagramCanvas
            key={shown}
            diagram={diagram}
            onChange={onDiagram}
            highlight={highlight}
            smells={smells}
            height="fill"
            selection={selection}
            onSelect={onSelect}
            onRename={onRename}
            handle={canvasRef}
            reservedIds={reservedIds}
          />
        </D.CanvasFill>
      ) : (
        <JsonTab key={shown} diagram={diagram} onApply={onDiagram} />
      )}
    </>
  );
}

/** Right pane: the smells of the version on screen (only the final version counts). */
export function ShownSmells({ check, shown }: { check: DesignCheck; shown: number }) {
  const list = check.smells.filter((s) => s.version === shown);
  const last = Math.max(0, ...check.versions.map((v) => v.version));
  return (
    <S.Smells $clean={list.length === 0}>
      <b>👃 Smells in v{shown}</b>
      {shown !== last && <Muted $small> (only the final version counts)</Muted>}
      {list.length === 0 ? (
        <S.OkLine>✓ None: clean structure.</S.OkLine>
      ) : (
        <ul>
          {list.map((s) => (
            <li key={`${s.rule}:${s.nodes.join(",")}`}>
              <code>{s.rule}</code> {s.message}{" "}
              {s.nodes.map((n) => (
                <S.SmellNode key={n}>{n}</S.SmellNode>
              ))}
            </li>
          ))}
        </ul>
      )}
    </S.Smells>
  );
}

export function JsonTab({ diagram, onApply }: { diagram: Diagram; onApply: (d: Diagram) => void }) {
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
    <S.Json>
      <CodeEditor
        label="Diagram JSON"
        lang="json"
        value={text}
        onChange={(v) => {
          setText(v);
          setDirty(true);
        }}
      />
      <S.JsonActions>
        <D.AccentButton onClick={apply} disabled={!dirty}>
          Apply &amp; save
        </D.AccentButton>
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
        {error && <D.ErrorLine>⚠ {error}</D.ErrorLine>}
        <Muted $small>
          Format:{" "}
          <code>
            {"{version, why, nodes: [{id, kind, label, x, y}], edges: [{from, to, label}]}"}
          </code>
        </Muted>
      </S.JsonActions>
    </S.Json>
  );
}
