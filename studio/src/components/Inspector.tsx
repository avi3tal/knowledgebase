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
import { Grow, LinkButton, Muted } from "../theme/primitives";
import type { Selection } from "./DiagramCanvas";
import * as D from "./DesignShared.style";
import * as S from "./Inspector.style";

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
      <S.Root $color={s.color} key={node.id}>
        <S.Head>
          <S.Icon $color={s.color}>{s.icon}</S.Icon>
          <Grow as="div">
            <b>{s.label}</b>
            <Muted $small as="div">
              id <code>{node.id}</code>
            </Muted>
          </Grow>
          <D.RemoveX onClick={() => onSelect(null)} aria-label="close inspector">
            ×
          </D.RemoveX>
        </S.Head>
        <S.Field>
          <span>label</span>
          <input
            ref={labelRef}
            value={node.label ?? ""}
            placeholder={node.id}
            onChange={(e) => onChange(relabelNode(diagram, node.id, e.target.value))}
          />
        </S.Field>
        {targets.length > 0 && (
          <S.Field>
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
            <Muted as="small">
              Takes that component’s id, kind and label, so composing merges them into one box.
            </Muted>
          </S.Field>
        )}
        <S.Conn>
          <Muted $small>connections</Muted>
          {conn.in.length + conn.out.length === 0 && (
            <Muted $small as="div">
              none yet: drag from the ● handle to another shape
            </Muted>
          )}
          <ul>
            {conn.in.map((e) => (
              <li key={edgeKey(e)}>
                <LinkButton onClick={() => onSelect({ type: "edge", id: edgeKey(e) })}>
                  ← {label(e.from)}
                  {e.label ? <Muted> · {e.label}</Muted> : null}
                </LinkButton>
              </li>
            ))}
            {conn.out.map((e) => (
              <li key={edgeKey(e)}>
                <LinkButton onClick={() => onSelect({ type: "edge", id: edgeKey(e) })}>
                  → {label(e.to)}
                  {e.label ? <Muted> · {e.label}</Muted> : null}
                </LinkButton>
              </li>
            ))}
          </ul>
        </S.Conn>
        <S.Actions>
          <D.DangerButton
            onClick={() => {
              onChange(removeNode(diagram, node.id));
              onSelect(null);
            }}
          >
            🗑 Delete shape
          </D.DangerButton>
        </S.Actions>
      </S.Root>
    );
  }

  const e = edge!;
  const key = edgeKey(e);
  const from = diagram.nodes.find((n) => n.id === e.from);
  const to = diagram.nodes.find((n) => n.id === e.to);
  const canReverse = !diagram.edges.some((x) => x.from === e.to && x.to === e.from);
  return (
    <S.Root key={key}>
      <S.Head>
        <S.Icon>↗</S.Icon>
        <Grow as="div">
          <b>Connection</b>
          <Muted $small as="div">
            <LinkButton onClick={() => onSelect({ type: "node", id: e.from })}>
              {from?.label || e.from}
            </LinkButton>{" "}
            →{" "}
            <LinkButton onClick={() => onSelect({ type: "node", id: e.to })}>
              {to?.label || e.to}
            </LinkButton>
          </Muted>
        </Grow>
        <D.RemoveX onClick={() => onSelect(null)} aria-label="close inspector">
          ×
        </D.RemoveX>
      </S.Head>
      <S.Field>
        <span>label</span>
        <input
          ref={labelRef}
          value={e.label ?? ""}
          placeholder="e.g. read-through, GET /{code}"
          onChange={(ev) => onChange(relabelEdge(diagram, key, ev.target.value))}
        />
      </S.Field>
      <S.Actions>
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
        <D.DangerButton
          onClick={() => {
            onChange(removeEdge(diagram, key));
            onSelect(null);
          }}
        >
          🗑 Delete
        </D.DangerButton>
      </S.Actions>
    </S.Root>
  );
}
