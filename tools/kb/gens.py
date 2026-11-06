"""Input generators for complexity benchmarks.

``meta.bench.args`` maps each parameter to an expression evaluated with ``n`` (the input size)
and the generator functions below, e.g. ``{"nums": "int_array(n)", "target": "-1"}``.
Generation is deterministic per size.
"""

from __future__ import annotations

import random
import string as _string
from collections import deque
from collections.abc import Callable
from typing import Any

DEFAULT_MIN_N = 256
DEFAULT_MAX_N = 1 << 17


def _encode_bst(values: list[int]) -> list[Any]:
    """Level-order array of a height-balanced BST over sorted ``values``."""
    out: list[Any] = []
    q: deque[tuple[int, int] | None] = deque([(0, len(values) - 1)])
    while q:
        rng = q.popleft()
        if rng is None or rng[0] > rng[1]:
            out.append(None)
            continue
        lo, hi = rng
        mid = (lo + hi) // 2
        out.append(values[mid])
        q.append((lo, mid - 1))
        q.append((mid + 1, hi))
    while out and out[-1] is None:
        out.pop()
    return out


def namespace(n: int, seed: int = 0) -> dict[str, Callable[..., Any] | int]:
    rng = random.Random(seed * 1_000_003 + n)

    def int_array(size: int, lo: int = -(10**6), hi: int = 10**6) -> list[int]:
        return [rng.randint(lo, hi) for _ in range(size)]

    def sorted_int_array(size: int, lo: int = -(10**6), hi: int = 10**6) -> list[int]:
        return sorted(int_array(size, lo, hi))

    def distinct_int_array(size: int) -> list[int]:
        return rng.sample(range(-4 * size - 10, 4 * size + 10), size)

    def int_matrix(rows: int, cols: int, lo: int = 0, hi: int = 9) -> list[list[int]]:
        return [int_array(cols, lo, hi) for _ in range(rows)]

    def string(size: int, alphabet: str = _string.ascii_lowercase) -> str:
        return "".join(rng.choice(alphabet) for _ in range(size))

    def string_array(count: int, length: int = 8) -> list[str]:
        return [string(length) for _ in range(count)]

    def rand_int(lo: int, hi: int) -> int:
        return rng.randint(lo, hi)

    def bst(size: int) -> list[Any]:
        return _encode_bst(sorted(distinct_int_array(size)))

    def tree(size: int) -> list[Any]:
        """Complete binary tree with random values (level order, no gaps)."""
        return int_array(size, 0, 1000)

    return {
        "n": n,
        "int_array": int_array,
        "sorted_int_array": sorted_int_array,
        "distinct_int_array": distinct_int_array,
        "int_matrix": int_matrix,
        "string": string,
        "string_array": string_array,
        "rand_int": rand_int,
        "linked_list": int_array,
        "bst": bst,
        "tree": tree,
        "isqrt": lambda x: int(x**0.5),
    }


def evaluate(expr: str, n: int, seed: int = 0, ns: dict[str, Any] | None = None) -> Any:
    """Evaluate a generator expression. Pass a shared ``ns`` so several args draw from one RNG."""
    return eval(expr, {"__builtins__": {}}, ns if ns is not None else namespace(n, seed))  # noqa: S307 - local meta


def sizes(bench: dict[str, Any]) -> list[int]:
    if bench.get("sizes"):
        return [int(s) for s in bench["sizes"]]
    n, hi, out = int(bench.get("min_n", DEFAULT_MIN_N)), int(bench.get("max_n", DEFAULT_MAX_N)), []
    while n <= hi:
        out.append(n)
        n *= 2
    return out


def bench_inputs(bench: dict[str, Any]) -> list[dict[str, Any]]:
    """[{"n": n, "args": {param: value}}] for every benchmark size."""
    out = []
    for n in sizes(bench):
        ns = namespace(n)  # one RNG per size: two int_array(n) args get different arrays
        out.append({"n": n, "args": {name: evaluate(expr, n, ns=ns) for name, expr in bench["args"].items()}})
    return out
