"""Result comparators, applied to JSON-normalised values (mirrors tools/gokb/compare.go)."""

from __future__ import annotations

import json
import math
from typing import Any

FLOAT_TOL = 1e-6


def _canon(x: Any) -> str:
    return json.dumps(x, sort_keys=True)


def _deep_sort(x: Any) -> Any:
    if isinstance(x, list):
        return sorted((_deep_sort(v) for v in x), key=_canon)
    return x


def _close(a: Any, b: Any) -> bool:
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_close(x, y) for x, y in zip(a, b, strict=True))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return math.isclose(a, b, rel_tol=FLOAT_TOL, abs_tol=FLOAT_TOL)
    return a == b


def normalise(value: Any) -> Any:
    """Round-trip through JSON so tuples become lists etc. Raises TypeError if unserialisable."""
    return json.loads(json.dumps(value))


def compare(got: Any, expected: Any, comparator: str) -> bool:
    if comparator == "exact":
        return got == expected
    if comparator == "unordered":
        if not isinstance(got, list) or not isinstance(expected, list):
            return got == expected
        return sorted(map(_canon, got)) == sorted(map(_canon, expected))
    if comparator == "unordered_deep":
        return _deep_sort(got) == _deep_sort(expected)
    if comparator == "float":
        return _close(got, expected)
    if comparator == "any_of":
        return isinstance(expected, list) and any(got == e for e in expected)
    raise ValueError(f"unknown comparator {comparator!r}")


def compare_case(got: Any, expected: Any, comparator: str, design: bool) -> bool:
    """Design problems compare op-by-op with the comparator."""
    if design:
        if not isinstance(got, list) or not isinstance(expected, list) or len(got) != len(expected):
            return False
        return all(compare(g, e, comparator) for g, e in zip(got, expected, strict=True))
    return compare(got, expected, comparator)
