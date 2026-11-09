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
import { Grow, Muted, MutedP } from "../theme/primitives";
import { ConfirmBar } from "./ConfirmDialog";
import type { CanvasHandle, Selection } from "./DiagramCanvas";
import { DiagramCanvas } from "./DiagramCanvas";
import * as D from "./DesignShared.style";
import * as S from "./DesignParts.style";

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
      <D.Toolbar>
        <S.PartChips role="tablist" aria-label="parts">
          {parts.map((p, i) => {
            const miss = missingPartNodes(latest, [p]).length;
            const empty = (p.diagram?.nodes ?? []).length === 0;
            return (
              <S.PartChip
                key={p.id}
                role="tab"
                aria-selected={p.id === part?.id}
                $on={p.id === part?.id}
                $i={i}
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
                <S.PcId>{p.id}</S.PcId>
                <S.PcTitle>{p.title || "untitled"}</S.PcTitle>
                <S.PcState $composed={!empty && miss === 0}>
                  {empty ? "○" : miss === 0 ? "✓" : `+${miss}`}
                </S.PcState>
              </S.PartChip>
            );
          })}
          <S.PartAdd onClick={add} disabled={parts.length >= 12}>
            ＋ Part
          </S.PartAdd>
        </S.PartChips>
        <Grow />
        <S.ComposeButton
          onClick={onCompose}
          disabled={!canCompose}
          title={
            preview.parts.length === 0
              ? "Every part is already in the latest version"
              : `New version with ${preview.nodes} component(s) and ${preview.edges} connection(s) from ${preview.parts.join(", ")}`
          }
        >
          🧬 Compose into high-level
          {preview.parts.length > 0 && <S.ComposeCount>+{preview.nodes}</S.ComposeCount>}
        </S.ComposeButton>
      </D.Toolbar>

      {!part ? (
        <S.Empty>
          <S.EmptyCard>
            <S.EmptyIcon>🧩</S.EmptyIcon>
            <h3>Split the problem into parts</h3>
            <MutedP>
              One part per hard requirement: the hot read path, the write path, fan-out, search,
              analytics… Solve each on its own (options, a choice, a small diagram), then compose
              them into the high-level design. Reuse the same component ids across parts so they
              merge.
            </MutedP>
            <D.AccentButton onClick={add}>＋ First part</D.AccentButton>
          </S.EmptyCard>
        </S.Empty>
      ) : (
        <>
          <D.Subbar>
            <PartStatus part={part} latest={latest} />
            {saveError && <D.ErrorLine $flat>⚠ {saveError}</D.ErrorLine>}
          </D.Subbar>
          <D.CanvasFill>
            <DiagramCanvas
              key={part.id}
              diagram={partToDiagram(part)}
              onChange={(d) => edit({ ...part, diagram: diagramToSub(d) })}
              height="fill"
              selection={selection}
              onSelect={onSelect}
              onRename={onRename}
              handle={canvasRef}
              reservedIds={[
                ...(latest?.nodes ?? []).map((n) => n.id),
                ...parts
                  .filter((p) => p.id !== part.id)
                  .flatMap((p) => p.diagram.nodes.map((n) => n.id)),
              ]}
            />
          </D.CanvasFill>
          <S.Drawer>
            <S.DrawerToggle onClick={() => setDrawer((d) => !d)} aria-expanded={drawer}>
              {drawer ? "▾" : "▴"} {part.id} · {part.title || "untitled part"}: problem, options,
              choice
            </S.DrawerToggle>
            {drawer && (
              <S.DrawerBody>
                <PartSheet part={part} scope={scope} onChange={edit} />
                <S.PartRemove>
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
                    <D.DangerButton $ghost onClick={() => setConfirmRemove(true)}>
                      🗑 Remove {part.id}
                    </D.DangerButton>
                  )}
                </S.PartRemove>
              </S.DrawerBody>
            )}
          </S.Drawer>
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
      <S.Status $tone="muted">Draw this part’s components: drag shapes from the stencil.</S.Status>
    );
  if (miss.length === 0)
    return (
      <S.Status $tone="ok">
        ✓ composed into v{latest?.version}: all {n} component{n === 1 ? "" : "s"} are in the design
      </S.Status>
    );
  return (
    <S.Status $tone="warn">
      {miss.length} component{miss.length === 1 ? "" : "s"} not in the design yet:{" "}
      {miss.map((id) => (
        <code key={id}>{id}</code>
      ))}
    </S.Status>
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
    <S.ChipInput>
      {values.map((v) => (
        <S.Chip key={v}>
          {v}
          <button
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`remove ${v}`}
          >
            ×
          </button>
        </S.Chip>
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
    </S.ChipInput>
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
    <S.Sheet>
      <S.Fields>
        <S.TitleField>
          <Muted $small>title</Muted>
          <input
            value={part.title}
            placeholder="e.g. Redirect read path"
            onChange={(e) => set({ title: e.target.value })}
          />
        </S.TitleField>
        <S.Covers>
          <Muted $small>covers</Muted>
          <S.CoverChips>
            {ids.length === 0 && <Muted $small>Write requirements in Scope first (F1, N1…).</Muted>}
            {[...ids, ...stray.map((id) => ({ id, text: "not in scope any more" }))].map((it) => (
              <S.CoverChip
                key={it.id}
                $kind={it.id[0]?.toLowerCase() ?? ""}
                $on={part.covers.includes(it.id)}
                onClick={() => toggle(it.id)}
                title={it.text}
                aria-pressed={part.covers.includes(it.id)}
              >
                {it.id}
              </S.CoverChip>
            ))}
          </S.CoverChips>
        </S.Covers>
      </S.Fields>
      <label>
        <Muted $small>problem: what is hard about this piece?</Muted>
        <textarea
          rows={2}
          value={part.problem}
          placeholder="e.g. 100× more redirects than writes, answered in tens of ms worldwide"
          onChange={(e) => set({ problem: e.target.value })}
        />
      </label>
      <D.Sheet>
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
              <D.Row key={k} $chosen={chosen}>
                <td>
                  <S.ChooseButton
                    $on={chosen}
                    disabled={!o.name.trim()}
                    onClick={() => set({ choice: chosen ? "" : o.name })}
                    title={chosen ? "Chosen" : "Choose this option"}
                    aria-pressed={chosen}
                  >
                    {chosen ? "★" : "☆"}
                  </S.ChooseButton>
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
                  <D.RemoveX
                    onClick={() => set({ options: part.options.filter((_, j) => j !== k) })}
                    aria-label="remove option"
                    title="Remove option"
                  >
                    ×
                  </D.RemoveX>
                </td>
              </D.Row>
            );
          })}
        </tbody>
      </D.Sheet>
      <D.AddButton
        onClick={() => set({ options: [...part.options, { name: "", pros: "", cons: "" }] })}
      >
        ＋ Option
      </D.AddButton>
      <S.Fields>
        <S.ChoiceField>
          <Muted $small>choice (★ an option, or write your own)</Muted>
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
        </S.ChoiceField>
        <S.WhyField>
          <Muted $small>why</Muted>
          <textarea
            rows={2}
            value={part.why}
            placeholder="Why this option wins for these requirements (cite F/N ids)"
            onChange={(e) => set({ why: e.target.value })}
          />
        </S.WhyField>
      </S.Fields>
      <S.Fields>
        <S.Half>
          <Muted $small>technologies</Muted>
          <ChipInput
            values={part.technologies}
            onChange={(technologies) => set({ technologies })}
            placeholder="redis, kafka… (Enter)"
          />
        </S.Half>
        <S.Half>
          <Muted $small>patterns</Muted>
          <ChipInput
            values={part.patterns}
            onChange={(patterns) => set({ patterns })}
            placeholder="cache-aside, sharding… (Enter)"
          />
        </S.Half>
      </S.Fields>
    </S.Sheet>
  );
}
