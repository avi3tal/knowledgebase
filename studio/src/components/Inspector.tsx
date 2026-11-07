import { useEffect, useRef } from "react";
import type { Diagram } from "../api";
import type { LinkTarget } from "../design";
import {
  connections,
  edgeKey,
  kindStyle,
  linkNode,
  relabelEdge,
  relabelNode,
  removeEdge,
  removeNode,
  reverseEdge,
} from "../design";
import type { Selection } from "./DiagramCanvas";

/**
 * Right-pane inspector for the canvas selection. A node: kind, id, label, connections, "link to an
 * existing component" (so reduce merges by id) and delete. An edge: label, reverse and delete.
 * `renameTick` changes on a double-click in the canvas: the label input takes the focus.
 */
export function Inspector({
  diagram,
  selection,
  onChange,
  onSelect,
  renameTick,
  targets = [],
}: {
  diagram: Diagram;
  selection: Selection;
  onChange: (d: Diagram) => void;
  onSelect: (s: Selection) => void;
  renameTick: number;
  targets?: LinkTarget[];
}) {
  const labelRef = useRef<HTMLInputElement>(null);
  // Focus only on a new rename request, never because the inspector (re)mounted.
  const seen = useRef(renameTick);
  useEffect(() => {
    if (renameTick === seen.current) return;
    seen.current = renameTick;
    labelRef.current?.focus({ preventScroll: true });
    labelRef.current?.select();
  }, [renameTick]);

  const node = selection?.type === "node" ? diagram.nodes.find((n) => n.id === selection.id) : null;
  const edge =
    selection?.type === "edge" ? diagram.edges.find((e) => edgeKey(e) === selection.id) : null;
  if (!node && !edge) return null;

  if (node) {
    const s = kindStyle(node.kind);
    const conn = connections(diagram, node.id);
    const label = (id: string) => diagram.nodes.find((n) => n.id === id)?.label || id;
    return (
      <section className="inspector" style={{ ["--kc" as string]: s.color }} key={node.id}>
        <header className="insp-head">
          <span className="insp-icon">{s.icon}</span>
          <div className="grow">
            <b>{s.label}</b>
            <div className="muted small">
              id <code>{node.id}</code>
            </div>
          </div>
          <button className="icon-x" onClick={() => onSelect(null)} aria-label="close inspector">
            ×
          </button>
        </header>
        <label className="insp-field">
          <span>label</span>
          <input
            ref={labelRef}
            value={node.label ?? ""}
            placeholder={node.id}
            onChange={(e) => onChange(relabelNode(diagram, node.id, e.target.value))}
          />
        </label>
        {targets.length > 0 && (
          <label className="insp-field">
            <span>link to an existing component</span>
            <select
              value=""
              onChange={(e) => {
                const t = targets.find((x) => x.id === e.target.value);
                if (!t) return;
                const next = linkNode(diagram, node.id, t);
                if (next === diagram) return;
                onChange(next);
                onSelect({ type: "node", id: t.id });
              }}
            >
              <option value="">— same thing as… —</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {kindStyle(t.kind).icon} {t.label} · {t.id} ({t.from})
                </option>
              ))}
            </select>
            <small className="muted">
              Takes that component’s id, kind and label, so composing merges them into one box.
            </small>
          </label>
        )}
        <div className="insp-conn">
          <span className="muted small">connections</span>
          {conn.in.length + conn.out.length === 0 && (
            <div className="muted small">none yet: drag from the ● handle to another shape</div>
          )}
          <ul>
            {conn.in.map((e) => (
              <li key={edgeKey(e)}>
                <button
                  className="link-btn"
                  onClick={() => onSelect({ type: "edge", id: edgeKey(e) })}
                >
                  ← {label(e.from)}
                  {e.label ? <span className="muted"> · {e.label}</span> : null}
                </button>
              </li>
            ))}
            {conn.out.map((e) => (
              <li key={edgeKey(e)}>
                <button
                  className="link-btn"
                  onClick={() => onSelect({ type: "edge", id: edgeKey(e) })}
                >
                  → {label(e.to)}
                  {e.label ? <span className="muted"> · {e.label}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="insp-actions">
          <button
            className="danger"
            onClick={() => {
              onChange(removeNode(diagram, node.id));
              onSelect(null);
            }}
          >
            🗑 Delete shape
          </button>
        </div>
      </section>
    );
  }

  const e = edge!;
  const key = edgeKey(e);
  const from = diagram.nodes.find((n) => n.id === e.from);
  const to = diagram.nodes.find((n) => n.id === e.to);
  const canReverse = !diagram.edges.some((x) => x.from === e.to && x.to === e.from);
  return (
    <section className="inspector" key={key}>
      <header className="insp-head">
        <span className="insp-icon">↗</span>
        <div className="grow">
          <b>Connection</b>
          <div className="muted small">
            <button className="link-btn" onClick={() => onSelect({ type: "node", id: e.from })}>
              {from?.label || e.from}
            </button>{" "}
            →{" "}
            <button className="link-btn" onClick={() => onSelect({ type: "node", id: e.to })}>
              {to?.label || e.to}
            </button>
          </div>
        </div>
        <button className="icon-x" onClick={() => onSelect(null)} aria-label="close inspector">
          ×
        </button>
      </header>
      <label className="insp-field">
        <span>label</span>
        <input
          ref={labelRef}
          value={e.label ?? ""}
          placeholder="e.g. read-through, GET /{code}"
          onChange={(ev) => onChange(relabelEdge(diagram, key, ev.target.value))}
        />
      </label>
      <div className="insp-actions">
        <button
          disabled={!canReverse}
          title={canReverse ? "Swap the direction" : "The reverse connection already exists"}
          onClick={() => {
            onChange(reverseEdge(diagram, key));
            onSelect({ type: "edge", id: `${e.to}->${e.from}` });
          }}
        >
          ⇄ Reverse
        </button>
        <button
          className="danger"
          onClick={() => {
            onChange(removeEdge(diagram, key));
            onSelect(null);
          }}
        >
          🗑 Delete
        </button>
      </div>
    </section>
  );
}
