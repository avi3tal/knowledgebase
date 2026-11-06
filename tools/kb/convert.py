"""Convert between JSON case values and Python solution values."""

from __future__ import annotations

from typing import Any

from kb.structs import ListNode, TreeNode


def to_py(t: str, value: Any) -> Any:
    """JSON value -> fresh Python value of meta type ``t`` (always a new object)."""
    if t.endswith("[]"):
        return None if value is None else [to_py(t[:-2], v) for v in value]
    if t == "ListNode":
        return ListNode.from_list(value)
    if t == "TreeNode":
        return TreeNode.from_list(value)
    if t == "float" and value is not None:
        return float(value)
    return value


def to_json(t: str, value: Any) -> Any:
    """Python value of meta type ``t`` -> JSON-compatible value."""
    if t == "void":
        return None
    if t.endswith("[]"):
        return None if value is None else [to_json(t[:-2], v) for v in value]
    if t == "ListNode":
        return ListNode.to_list(value)
    if t == "TreeNode":
        return TreeNode.to_list(value)
    return value
