"""Empirical time-complexity estimate from (n, time) benchmark points.

Each candidate model t(n) = a + b*f(n) is fitted by least squares on *relative* error, and the
simplest model whose error is close to the best one wins. This is an estimate: constant factors,
caches and GC can blur O(n) vs O(n log n), so the pass/fail verdict (``matches``) uses the
log-log slope with a tolerance rather than the best-fitting label.
"""

from __future__ import annotations

import math
import re
from collections.abc import Callable
from dataclasses import dataclass

MIN_POINTS = 4
# Simplest first: ties go to the simpler model.
MODELS: list[tuple[str, Callable[[float], float]]] = [
    ("O(1)", lambda n: 1.0),
    ("O(log n)", lambda n: math.log2(n)),
    ("O(n)", lambda n: n),
    ("O(n log n)", lambda n: n * math.log2(n)),
    ("O(n^2)", lambda n: n * n),
    ("O(n^3)", lambda n: n**3),
    ("O(2^n)", lambda n: 2.0**n),
    ("O(n!)", lambda n: math.gamma(n + 1)),
]
# Exponential models only make sense (and only stay finite) for tiny n.
MAX_N_FOR = {"O(2^n)": 64, "O(n!)": 20}
TIE_RATIO = 1.25
TIE_SLACK = 0.02


@dataclass
class Fit:
    best: str
    slope: float
    errors: dict[str, float]


def _fit_model(ns: list[float], ts: list[float], f: Callable[[float], float]) -> float:
    """Relative RMS error of the best a + b*f(n) fit with a, b >= 0."""
    xs = [f(n) for n in ns]
    ws = [1.0 / (t * t) for t in ts]

    def err(a: float, b: float) -> float:
        return math.sqrt(sum(((a + b * x - t) / t) ** 2 for x, t in zip(xs, ts, strict=True)) / len(ts))

    if max(xs) == min(xs):  # constant model
        a = sum(w * t for w, t in zip(ws, ts, strict=True)) / sum(ws)
        return err(a, 0.0)

    sw = sum(ws)
    sx = sum(w * x for w, x in zip(ws, xs, strict=True))
    st = sum(w * t for w, t in zip(ws, ts, strict=True))
    sxx = sum(w * x * x for w, x in zip(ws, xs, strict=True))
    sxt = sum(w * x * t for w, x, t in zip(ws, xs, ts, strict=True))
    det = sw * sxx - sx * sx
    if det == 0:
        return math.inf
    a = (st * sxx - sx * sxt) / det
    b = (sw * sxt - sx * st) / det
    if b <= 0:
        return math.inf
    if a < 0:
        a, b = 0.0, sxt / sxx
    return err(a, b)


def loglog_slope(ns: list[float], ts: list[float]) -> float:
    lx, ly = [math.log(n) for n in ns], [math.log(t) for t in ts]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    den = sum((x - mx) ** 2 for x in lx)
    return sum((x - mx) * (y - my) for x, y in zip(lx, ly, strict=True)) / den if den else 0.0


def estimate(points: list[tuple[int, float]]) -> Fit | None:
    """points: [(n, seconds_or_ns_per_call)] with distinct n. None if too few points."""
    pts = sorted((float(n), float(t)) for n, t in points if n > 1 and t > 0)
    if len({n for n, _ in pts}) < MIN_POINTS:
        return None
    ns, ts = [n for n, _ in pts], [t for _, t in pts]
    errors: dict[str, float] = {}
    for name, f in MODELS:
        if name in MAX_N_FOR and max(ns) > MAX_N_FOR[name]:
            continue
        errors[name] = _fit_model(ns, ts, f)
    best_err = min(errors.values())
    best = next(name for name, e in errors.items() if e <= best_err * TIE_RATIO + TIE_SLACK)
    return Fit(best=best, slope=loglog_slope(ns, ts), errors=errors)


_CANON_SUBS = [
    (r"\s+", ""),
    (r"\*", ""),
    (r"·", ""),
    (r"log\(n\)", "logn"),
    (r"lgn", "logn"),
    (r"²", "^2"),
    (r"³", "^3"),
    (r"n\*\*(\d)", r"n^\1"),
]


def canonical(big_o: str) -> str:
    """'O(n * log(n))' -> 'o(nlogn)' for comparisons."""
    s = big_o.lower()
    for pat, rep in _CANON_SUBS:
        s = re.sub(pat, rep, s)
    return s


SLOPE_TOLERANCE = 0.3


def matches(fit: Fit, expected: str, ns: list[int]) -> bool | None:
    """Is the measurement consistent with ``expected``?

    Compares the measured log-log slope with the expected model's theoretical slope over the
    same n range (O(n) vs O(n log n) differ by only ~0.1, so both count as consistent).
    None when ``expected`` is not a single-variable model we can measure (e.g. O(m*n)).
    """
    models = {canonical(name): f for name, f in MODELS}
    f = models.get(canonical(expected))
    if f is None:
        return None
    pts = [float(n) for n in ns if n > 1]
    theoretical = loglog_slope(pts, [max(f(n), 1e-12) for n in pts]) if len(pts) > 1 else 0.0
    return abs(fit.slope - theoretical) <= SLOPE_TOLERANCE
