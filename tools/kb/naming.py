"""Identifier conversions between meta.json names and language conventions."""

from __future__ import annotations

import re

_CAMEL_BOUNDARY = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def snake(name: str) -> str:
    """twoSum -> two_sum, KthLargest -> kth_largest."""
    return _CAMEL_BOUNDARY.sub("_", name).lower()


def camel(name: str) -> str:
    """two-sum / two_sum -> twoSum."""
    parts = [p for p in re.split(r"[-_\s]+", name) if p]
    if not parts:
        return name
    return parts[0].lower() + "".join(p[:1].upper() + p[1:] for p in parts[1:])


def go_exported(name: str) -> str:
    """add -> Add, getMin -> GetMin."""
    return name[:1].upper() + name[1:]


def title_from_slug(slug: str) -> str:
    return " ".join(p.capitalize() for p in slug.split("-"))
