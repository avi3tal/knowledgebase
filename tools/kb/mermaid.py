"""Figure specs (lesson figures, design diagrams) as markdown an LLM agent can read: Mermaid text.

`figure_md(spec)` renders one spec (see kb/figures.py for the kinds) as a titled ```mermaid block
followed by its caption, numbered steps and scenarios. `diagram_md(nodes, edges)` renders a design
console diagram (system-design / ood `nodes` + `edges`), which has the architecture shape.
Structure figures (data-structure stills) have no Mermaid equivalent: their frames become a
numbered list with each frame's variables as JSON.
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable
from typing import Any

from kb.figures import PICTURE_FIELDS

Spec = dict[str, Any]

_ID_RE = re.compile(r"[^A-Za-z0-9_]")
_DB_KINDS = {"sql", "nosql", "db", "database", "kv", "key-value", "timeseries", "search", "warehouse"}
_FLOW_SHAPES = {"start": '(["{}"])', "end": '(["{}"])', "decision": '{{"{}"}}', "step": '["{}"]'}
_SEQ_ARROWS = {"call": "->>", "self": "->>", "reply": "-->>", "async": "-)", "error": "-x", "lost": "--x"}
_UML_ARROWS = {  # type -> (left is `to`?, arrow)
    "inherits": (True, "<|--"),
    "implements": (True, "<|.."),
    "composition": (False, "*--"),
    "aggregation": (False, "o--"),
    "dependency": (False, "..>"),
}


def node_id(raw: Any, prefix: str = "n") -> str:
    """A Mermaid-safe identifier: prefixed (so `end`, `class` etc. are never reserved words)."""
    return f"{prefix}_{_ID_RE.sub('_', str(raw))}"


def label(text: Any) -> str:
    """Text for inside a quoted Mermaid label or a message: no quotes, semicolons or raw newlines."""
    s = str(text if text is not None else "")
    return s.replace(";", "#59;").replace('"', "#quot;").replace("\n", "<br/>")  # `;` first: entities end in `;`


def _fence(lines: list[str]) -> str:
    return "```mermaid\n" + "\n".join(lines) + "\n```"


# ------------------------------------------------------------------ one function per kind


def architecture(spec: Spec, direction: str = "LR") -> str:
    lines = [f"flowchart {direction}"]
    for n in spec.get("nodes", []):
        sub = n.get("sub") or n.get("kind") or ""
        text = label(n.get("label", n.get("id"))) + (f"<br/><i>{label(sub)}</i>" if sub else "")
        shape = '[("{}")]' if n.get("kind") in _DB_KINDS else '["{}"]'
        lines.append(f"  {node_id(n['id'])}" + shape.format(text))
    lines += _flow_edges(spec.get("edges", []))
    return _fence(lines)


def flowchart(spec: Spec) -> str:
    lines = ["flowchart TD"]
    for n in spec.get("nodes", []):
        text = label(n.get("label", n.get("id")))
        if n.get("tone"):
            text += f" ({label(n['tone'])})"
        lines.append(f"  {node_id(n['id'])}" + _FLOW_SHAPES.get(n.get("type", "step"), '["{}"]').format(text))
    lines += _flow_edges(spec.get("edges", []))
    return _fence(lines)


def _flow_edges(edges: list[dict[str, Any]]) -> list[str]:
    out = []
    for e in edges:
        mid = f'|"{label(e["label"])}"|' if e.get("label") else ""
        out.append(f"  {node_id(e['from'])} -->{mid} {node_id(e['to'])}")
    return out


def sequence(spec: Spec) -> str:
    lines = ["sequenceDiagram", "  autonumber"]
    for a in spec.get("actors", []):
        lines.append(f"  participant {node_id(a['id'], 'p')} as {label(a.get('label', a['id']))}")
    for m in spec.get("messages", []):
        style = m.get("style", "call")
        src, dst = node_id(m["from"], "p"), node_id(m["to"], "p")
        text = label(m.get("label", "")) + (" (lost)" if style == "lost" else "")
        lines.append(f"  {src}{_SEQ_ARROWS.get(style, '->>')}{dst}: {text}")
        if m.get("note"):
            over = src if src == dst else f"{src},{dst}"
            lines.append(f"  Note over {over}: {label(m['note'])}")
    return _fence(lines)


def uml(spec: Spec) -> str:
    lines = ["classDiagram"]
    for c in spec.get("classes", []):
        lines += _uml_class(c)
    lines += [_uml_relation(r) for r in spec.get("relations", [])]
    return _fence(lines)


def _uml_class(c: dict[str, Any]) -> list[str]:
    head = f'  class {node_id(c["id"], "c")}["{label(c.get("name", c["id"]))}"]'
    body = [f"    <<{c['stereotype']}>>"] if c.get("stereotype") else []
    body += ["    " + _uml_member(str(m)) for m in [*c.get("fields", []), *c.get("methods", [])]]
    return [head + " {", *body, "  }"] if body else [head]


def _uml_member(member: str) -> str:
    """`+ add(p: Product): None` -> `+add(p: Product): None` (Mermaid wants the prefix attached)."""
    text = re.sub(r"^([+\-#~])\s+", r"\1", member.strip())
    return text.replace("{", "(").replace("}", ")").replace('"', "'")


def _uml_relation(r: dict[str, Any]) -> str:
    rtype = r.get("type", "association")
    flip, arrow = _UML_ARROWS.get(rtype, (False, "-->" if r.get("navigable") else "--"))
    left, right = (r["to"], r["from"]) if flip else (r["from"], r["to"])
    lm, rm = (r.get("to_mult"), r.get("from_mult")) if flip else (r.get("from_mult"), r.get("to_mult"))
    line = f"  {node_id(left, 'c')}"
    line += f' "{label(lm)}"' if lm else ""
    line += f" {arrow}"
    line += f' "{label(rm)}"' if rm else ""
    line += f" {node_id(right, 'c')}"
    return line + (f" : {label(r['label'])}" if r.get("label") else "")


def structure(spec: Spec) -> str:
    """Frames as a numbered list; vars carry over between frames (null clears one), as in the studio."""
    lines, state = [], {}
    for i, f in enumerate(spec.get("frames", []), 1):
        state = {k: v for k, v in {**state, **f.get("vars", {})}.items() if v is not None}
        lines.append(f"{i}. {f.get('text', '')}")
        if state:
            lines.append(f"   `{json.dumps(state, ensure_ascii=False)}`")
    return "\n".join(lines)


_KINDS: dict[str, Callable[[Spec], str]] = {
    "architecture": architecture,
    "flowchart": flowchart,
    "sequence": sequence,
    "uml": uml,
    "structure": structure,
}


# ------------------------------------------------------------------ full figure markdown


def picture(spec: Spec) -> str:
    """Just the picture of a spec (no title, caption or steps)."""
    render = _KINDS.get(str(spec.get("kind")))
    if render is None:
        return f"```json\n{json.dumps(spec, indent=1, ensure_ascii=False)}\n```"
    return render(spec)


def steps_md(steps: list[dict[str, Any]]) -> str:
    out = []
    for i, s in enumerate(steps, 1):
        fail = s.get("fail") or {}
        broken = [*fail.get("nodes", []), *fail.get("edges", [])] if isinstance(fail, dict) else []
        out.append(f"{i}. {s.get('text', '')}" + (f" (fails: {', '.join(broken)})" if broken else ""))
    return "\n".join(out)


def figure_md(spec: Spec) -> str:
    """One figure as markdown: title, picture, caption, steps, then each scenario."""
    parts = [f"**Figure: {spec['title']}**"] if spec.get("title") else []
    parts += _body(spec)
    for sc in spec.get("scenarios", []):
        parts += _scenario(spec, sc)
    return "\n\n".join(parts)


def _body(spec: Spec) -> list[str]:
    parts = [picture(spec)]
    if spec.get("caption"):
        parts.append(f"_{spec['caption']}_")
    if spec.get("steps"):
        parts.append("Steps:\n\n" + steps_md(spec["steps"]))
    return parts


def _scenario(base: Spec, sc: dict[str, Any]) -> list[str]:
    head = f"Scenario: **{sc.get('name', '')}**" + (f" ({sc['tone']})" if sc.get("tone") else "")
    parts = [head + (f": {sc['summary']}" if sc.get("summary") else "")]
    merged = {**base, **{k: v for k, v in sc.items() if k not in {"name", "tone", "summary"}}}
    merged.pop("scenarios", None)
    if not any(k in sc for k in PICTURE_FIELDS):  # same picture as above, new narration
        extra = [f"_{sc['caption']}_"] if sc.get("caption") else []
        return parts + extra + ([steps_md(sc["steps"])] if sc.get("steps") else [])
    if "caption" not in sc:
        merged.pop("caption", None)
    return parts + _body(merged)


def diagram_md(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> str:
    """A design console diagram (system design / OOD) as a Mermaid flowchart."""
    return architecture({"nodes": nodes, "edges": edges})
